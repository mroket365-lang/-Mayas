import { Router, Request, Response } from 'express';
import { db, UserEntity } from '../db/database.js';
import { EmailService } from '../services/emailService.js';
import { realtimeSyncService } from '../services/realtimeSyncService.js';

export const authRouter = Router();

// Generate unique Account ID e.g. USR-842910
function generateAccountId(): string {
  const randNum = Math.floor(100000 + Math.random() * 900000);
  return `USR-${randNum}`;
}

// POST /api/register or /api/auth/register
const handleRegister = async (req: Request, res: Response) => {
  const { email, password, name, username, phone, profileData, messagesData, itemsData } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'البريد الإلكتروني، كلمة السر والاسم مطلوبان' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existingEmail = db.getUsers().find((u) => u.email.toLowerCase() === cleanEmail);
  if (existingEmail) {
    if ((existingEmail as any).isEmailVerified === false) {
      // Regenerate OTP code for previously unverified user
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      (existingEmail as any).verificationCode = verificationCode;
      (existingEmail as any).verificationExpiresAt = Date.now() + 15 * 60 * 1000;
      if (password) existingEmail.passwordHash = password;
      if (name) existingEmail.name = name.trim();
      db.upsertUser(existingEmail);

      EmailService.sendVerificationEmail(cleanEmail, existingEmail.name, verificationCode, 'ar').catch((err) => {
        console.warn('[handleRegister] Could not dispatch OTP verification email:', err);
      });

      return res.json({
        requiresVerification: true,
        email: cleanEmail,
        userId: existingEmail.id,
        message: 'الحساب موجود ولكنه غير مفعل بعد. تم إرسال رمز تحقق جديد مكون من 6 أرقام إلى بريدك الإلكتروني.',
      });
    }

    return res.status(400).json({ error: 'هذا البريد الإلكتروني مسجل ومفعل بالفعل لدينا. يرجى تسجيل الدخول' });
  }

  if (username) {
    const existingUser = db.getUsers().find((u) => u.username && u.username.toLowerCase() === username.trim().toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'اسم المستخدم هذا غير متاح، اختر اسماً آخر' });
    }
  }

  const accountId = generateAccountId();
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  const newUser: UserEntity = {
    id: accountId,
    email: cleanEmail,
    username: username ? username.trim().toLowerCase() : undefined,
    phone: phone ? phone.trim() : undefined,
    passwordHash: password,
    name: name.trim(),
    role: 'user',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    profileData,
    messagesData,
    itemsData,
  };

  (newUser as any).verificationCode = verificationCode;
  (newUser as any).verificationExpiresAt = Date.now() + 15 * 60 * 1000;
  (newUser as any).isEmailVerified = false; // Enforce verification before activation

  db.upsertUser(newUser);

  // Auto create free subscription
  db.upsertSubscription({
    id: `sub_${accountId}`,
    userId: accountId,
    planId: 'free',
    status: 'active',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    autoRenew: true,
    paymentProvider: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log(`[Email Verification] OTP Code ${verificationCode} generated for ${newUser.email}`);

  // Send Verification Email via Resend
  EmailService.sendVerificationEmail(newUser.email, newUser.name, verificationCode, 'ar').catch((err) => {
    console.warn('[handleRegister] Could not dispatch verification email:', err);
  });

  return res.json({
    requiresVerification: true,
    email: newUser.email,
    userId: newUser.id,
    message: 'تم إنشاء الحساب بنجاح! تم إرسال رمز التحقق المكون من 6 أرقام إلى بريدك الإلكتروني لتأكيد الملكية.',
  });
};

authRouter.post('/register', handleRegister);
authRouter.post('/auth/register', handleRegister);

// POST /api/auth/login or /api/login
const handleLogin = (req: Request, res: Response) => {
  const { identifier, password } = req.body; // identifier can be email, username, or phone

  if (!identifier || !password) {
    return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني/اسم المستخدم/الهاتف وكلمة المرور' });
  }

  const cleanId = identifier.trim().toLowerCase();
  const users = db.getUsers();

  const user = users.find(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      (u.username && u.username.toLowerCase() === cleanId) ||
      (u.phone && u.phone === cleanId)
  );

  if (!user) {
    return res.status(404).json({
      error: 'هذا البريد الإلكتروني أو رقم الهاتف غير مسجل لدينا. نقترح عليك إنشاء حساب جديد.',
      code: 'USER_NOT_FOUND',
      notFoundIdentifier: cleanId,
    });
  }

  if (user.passwordHash !== password) {
    return res.status(401).json({ error: 'كلمة المرور غير صحيحة، يرجى التأكد وإعادة المحاولة' });
  }

  if (user.status === 'banned') {
    return res.status(403).json({ error: 'هذا الحساب محظور حالياً. يرجى التواصل مع الدعم الفني' });
  }

  // Check if email is verified
  if ((user as any).isEmailVerified === false) {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    (user as any).verificationCode = verificationCode;
    (user as any).verificationExpiresAt = Date.now() + 15 * 60 * 1000;
    db.upsertUser(user);

    EmailService.sendVerificationEmail(user.email, user.name, verificationCode, 'ar').catch((err) => {
      console.warn('[handleLogin] Could not dispatch OTP verification email:', err);
    });

    return res.json({
      requiresVerification: true,
      email: user.email,
      userId: user.id,
      message: 'بريدك الإلكتروني غير مؤكد بعد. تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني.',
    });
  }

  user.lastActiveAt = new Date().toISOString();
  db.upsertUser(user);

  return res.json({
    message: 'تم تسجيل الدخول بنجاح',
    user: {
      id: user.id,
      accountId: user.id,
      email: user.email,
      username: user.username,
      phone: user.phone,
      name: user.name,
      role: user.role,
      profileData: user.profileData,
      messagesData: user.messagesData,
      itemsData: user.itemsData,
    },
    token: `token_${user.id}_${Date.now()}`,
  });
};

authRouter.post('/login', handleLogin);
authRouter.post('/auth/login', handleLogin);

// POST /api/auth/google or /api/google
const handleGoogleAuth = async (req: Request, res: Response) => {
  const { googleEmail, name, googleId, picture } = req.body;

  if (!googleEmail) {
    return res.status(400).json({ error: 'بريد جوجل غير صالح' });
  }

  const cleanEmail = googleEmail.trim().toLowerCase();
  let user = db.getUsers().find((u) => u.email.toLowerCase() === cleanEmail);
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const accountId = generateAccountId();
    user = {
      id: accountId,
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      profileData: {
        avatar: picture || '',
      },
    };
    (user as any).isEmailVerified = true; // Auto-verified via Google OAuth
    db.upsertUser(user);

    db.upsertSubscription({
      id: `sub_${accountId}`,
      userId: accountId,
      planId: 'free',
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true,
      paymentProvider: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Send Welcome Email to the real Google Account user
    EmailService.sendWelcomeEmail(cleanEmail, user.name, 'ar').catch((err) => {
      console.warn('[auth/google] Could not dispatch welcome email:', err);
    });
  } else {
    user.lastActiveAt = new Date().toISOString();
    (user as any).isEmailVerified = true;
    if (name && !user.name) user.name = name;
    db.upsertUser(user);
  }

  return res.json({
    message: isNewUser
      ? 'تم إنشاء حسابك وربطه ببريد جوجل بنجاح وإرسال رسالة الترحيب إلى بريدك'
      : 'تم تسجيل الدخول بحساب جوجل بنجاح',
    user: {
      id: user.id,
      accountId: user.id,
      email: user.email,
      username: user.username,
      phone: user.phone,
      name: user.name,
      role: user.role,
      profileData: user.profileData,
      messagesData: user.messagesData,
      itemsData: user.itemsData,
    },
    token: `token_${user.id}_${Date.now()}`,
  });
};

authRouter.post('/google', handleGoogleAuth);
authRouter.post('/auth/google', handleGoogleAuth);

// POST /api/auth/recover-password or /api/recover-password
const handleRecoverPassword = async (req: Request, res: Response) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني أو اسم المستخدم أو الهاتف' });
  }

  const cleanId = identifier.trim().toLowerCase();
  const user = db.getUsers().find(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      (u.username && u.username.toLowerCase() === cleanId) ||
      (u.phone && u.phone === cleanId)
  );

  if (!user) {
    return res.status(404).json({
      error: 'هذا البريد الإلكتروني أو رقم الهاتف غير مسجل لدينا. نقترح عليك إنشاء حساب جديد.',
      code: 'USER_NOT_FOUND',
      notFoundIdentifier: cleanId,
    });
  }

  const resetToken = 'rst_' + Math.random().toString(36).substring(2, 10);
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  (user as any).resetToken = resetToken;
  (user as any).resetCode = resetCode;
  (user as any).resetTokenExpires = Date.now() + 30 * 60 * 1000;
  db.upsertUser(user);

  console.log(`[Email Password Reset] Reset code ${resetCode} for ${user.email}`);

  // Send password reset email via Resend
  const appUrl = process.env.APP_URL || 'https://ais-pre-c2gl4sfut7jgdyzkbmw4bm-492461559935.europe-west3.run.app';
  const resetLink = `${appUrl}?resetToken=${resetToken}`;
  EmailService.sendPasswordResetEmail(user.email, user.name, resetCode, resetLink, 'ar').catch((err) => {
    console.warn('[auth/recover-password] Could not dispatch reset email:', err);
  });

  return res.json({
    success: true,
    message: `تم إرسال رابط استعادة كلمة السر ورمز التحقق إلى بريدك (${user.email}) بنجاح.`,
    hint: `رمز التحقق الخاص بك لإعادة تعيين كلمة السر هو: ${resetCode}`,
    resetLink,
  });
};

authRouter.post('/recover-password', handleRecoverPassword);
authRouter.post('/auth/recover-password', handleRecoverPassword);

// POST /api/auth/test-email or /api/test-email
const handleTestEmail = async (req: Request, res: Response) => {
  const { email, name } = req.body;
  const targetEmail = email || 'm.roket365@gmail.com';
  const targetName = name || 'مستخدم رفيق التجريبي';

  const result = await EmailService.sendWelcomeEmail(targetEmail, targetName, 'ar');
  return res.json({
    status: result.success ? 'success' : 'failed',
    result,
    hint: result.success
      ? 'تم تسليم الرسالة التجريبية بنجاح عبر Resend!'
      : 'تحقق من صحة RESEND_API_KEY ونطاق الإرسال في Resend.',
  });
};

authRouter.post('/test-email', handleTestEmail);
authRouter.post('/auth/test-email', handleTestEmail);

// POST /api/auth/reset-password or /api/reset-password
const handleResetPassword = (req: Request, res: Response) => {
  const { identifier, codeOrToken, newPassword } = req.body;

  if (!identifier || !codeOrToken || !newPassword) {
    return res.status(400).json({ error: 'جميع البيانات مطلوبة لتغيير كلمة السر' });
  }

  const cleanId = identifier.trim().toLowerCase();
  const user = db.getUsers().find(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      (u.username && u.username.toLowerCase() === cleanId) ||
      (u.phone && u.phone === cleanId)
  );

  if (!user) {
    return res.status(404).json({
      error: 'هذا البريد الإلكتروني أو رقم الهاتف غير مسجل لدينا. نقترح عليك إنشاء حساب جديد.',
      code: 'USER_NOT_FOUND',
      notFoundIdentifier: cleanId,
    });
  }

  const validToken = (user as any).resetToken === codeOrToken;
  const validCode = (user as any).resetCode === codeOrToken;

  if (!validToken && !validCode) {
    return res.status(400).json({ error: 'رمز التحقق أو الرابط غير صحيح أو انتهت صلاحيته' });
  }

  user.passwordHash = newPassword;
  delete (user as any).resetToken;
  delete (user as any).resetCode;
  delete (user as any).resetTokenExpires;
  db.upsertUser(user);

  return res.json({
    success: true,
    message: 'تم تغيير كلمة السر بنجاح! يمكنك الآن تسجيل الدخول بكلمة السر الجديدة.',
  });
};

authRouter.post('/reset-password', handleResetPassword);
authRouter.post('/auth/reset-password', handleResetPassword);

// GET /api/user/data or /api/auth/me or /api/user/sync-data
const handleGetUserData = (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  const email = (req.query.email as string) || (req.headers['x-user-email'] as string);

  if (!userId && !email) {
    return res.status(400).json({ error: 'User ID or Email is required' });
  }

  let user = userId ? db.findUserById(userId) : undefined;
  if (!user && email) {
    user = db.findUserByEmail(email);
  }

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({
    success: true,
    user: {
      id: user.id,
      accountId: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      phone: user.phone,
      role: user.role,
      status: user.status,
      isEmailVerified: (user as any).isEmailVerified ?? true,
      addressAs: (user as any).addressAs || user.profileData?.addressAs || 'يا غالي',
    },
    profileData: user.profileData || null,
    messagesData: user.messagesData || [],
    itemsData: user.itemsData || [],
    lastActiveAt: user.lastActiveAt,
  });
};

authRouter.get('/user/data', handleGetUserData);
authRouter.get('/auth/me', handleGetUserData);
authRouter.get('/user/sync-data', handleGetUserData);

// POST /api/auth/sync or /api/sync
const handleSync = (req: Request, res: Response) => {
  const { userId, email, profileData, messagesData, itemsData } = req.body;

  const targetId = userId || (req.headers['x-user-id'] as string);
  const targetEmail = email || (req.headers['x-user-email'] as string);

  if (!targetId && !targetEmail) {
    return res.status(400).json({ error: 'User ID or Email is required' });
  }

  let user = targetId ? db.findUserById(targetId) : undefined;
  if (!user && targetEmail) {
    user = db.findUserByEmail(targetEmail);
  }

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Update profile
  if (profileData && typeof profileData === 'object') {
    user.profileData = {
      ...(user.profileData || {}),
      ...profileData,
    };
    if (profileData.displayName) {
      // Keep companion display name in profileData
      user.profileData.displayName = profileData.displayName;
    }
    if (profileData.personality) {
      user.profileData.personality = profileData.personality;
    }
    if (profileData.addressAs) {
      (user as any).addressAs = profileData.addressAs;
    }
  }

  // Smart merge messages: union by id, ordered by timestamp, keep last 200
  if (Array.isArray(messagesData)) {
    const existingMessages: any[] = Array.isArray(user.messagesData) ? user.messagesData : [];
    const msgMap = new Map<string, any>();
    existingMessages.forEach((m) => {
      if (m && m.id) msgMap.set(m.id, m);
    });
    messagesData.forEach((m) => {
      if (m && m.id) msgMap.set(m.id, { ...(msgMap.get(m.id) || {}), ...m });
    });
    const mergedList = Array.from(msgMap.values()).sort((a, b) => {
      const ta = new Date(a.timestamp || 0).getTime();
      const tb = new Date(b.timestamp || 0).getTime();
      return ta - tb;
    });
    user.messagesData = mergedList.slice(-200);
  }

  // Smart merge items: union by id, latest updatedAt
  if (Array.isArray(itemsData)) {
    const existingItems: any[] = Array.isArray(user.itemsData) ? user.itemsData : [];
    const itemMap = new Map<string, any>();
    existingItems.forEach((it) => {
      if (it && it.id) itemMap.set(it.id, it);
    });
    itemsData.forEach((it) => {
      if (it && it.id) itemMap.set(it.id, { ...(itemMap.get(it.id) || {}), ...it });
    });
    user.itemsData = Array.from(itemMap.values());
  }

  user.lastActiveAt = new Date().toISOString();
  db.upsertUser(user);

  // Broadcast to other devices/tabs of this user in real time
  realtimeSyncService.broadcastToUser(user.id, user.email, 'user_data_synced', {
    userId: user.id,
    email: user.email,
    profileData: user.profileData,
    messagesData: user.messagesData,
    itemsData: user.itemsData,
    updatedAt: user.lastActiveAt,
  });

  return res.json({
    success: true,
    message: 'Data synchronized successfully',
    profileData: user.profileData,
    messagesCount: (user.messagesData || []).length,
    itemsCount: (user.itemsData || []).length,
  });
};

authRouter.post('/sync', handleSync);
authRouter.post('/auth/sync', handleSync);

// POST /api/user/update-profile or /api/auth/user/update-profile (Real-time Profile Updates and Synchronization)
const handleUpdateProfile = (req: Request, res: Response) => {
  const {
    userId,
    name,
    username,
    phone,
    addressAs,
    displayName,
    personality,
    companionGender,
    language,
    theme,
    timezone,
    voiceSpeed,
    useEmojis,
    proactivityLevel,
    dailyMessageLimit,
    privateCandidMode,
    specialCounselingEnabled,
    dailyCheckInEnabled,
    dailyCheckInTime,
  } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  let user = db.findUserById(userId);
  if (!user && req.body.email) {
    user = db.findUserByEmail(req.body.email);
  }

  if (!user) {
    // If user is guest/not in db, simply return success
    return res.json({
      success: true,
      message: 'تم تحديث تفضيلات الجلسة بنجاح',
      user: {
        id: userId,
        accountId: userId,
        name: name || 'ضيف زائر',
        displayName: displayName || name,
        addressAs: addressAs || 'يا غالي',
        role: 'guest',
      },
    });
  }

  // Account level name
  if (name && name.trim()) {
    user.name = name.trim();
  }
  if (username) user.username = username.trim().toLowerCase();
  if (phone) user.phone = phone.trim();
  if (timezone) user.timezone = timezone;
  if (language) user.locale = language;
  if (addressAs !== undefined) (user as any).addressAs = String(addressAs).trim();

  // Full Companion Profile Data
  user.profileData = {
    ...(user.profileData || {}),
    name: user.name,
    displayName: displayName !== undefined ? displayName : (user.profileData?.displayName || user.name),
    addressAs: addressAs !== undefined ? String(addressAs).trim() : (user.profileData?.addressAs || (user as any).addressAs || 'يا غالي'),
    personality: personality || user.profileData?.personality || 'close_friend',
    companionGender: companionGender || user.profileData?.companionGender || 'female',
    language: language || user.profileData?.language || 'ar',
    theme: theme || user.profileData?.theme || 'light',
    timeZone: timezone || user.profileData?.timeZone || 'Asia/Riyadh',
    voiceSpeed: voiceSpeed !== undefined ? voiceSpeed : user.profileData?.voiceSpeed,
    useEmojis: useEmojis !== undefined ? useEmojis : user.profileData?.useEmojis,
    proactivityLevel: proactivityLevel || user.profileData?.proactivityLevel,
    dailyMessageLimit: dailyMessageLimit || user.profileData?.dailyMessageLimit,
    privateCandidMode: privateCandidMode !== undefined ? privateCandidMode : user.profileData?.privateCandidMode,
    specialCounselingEnabled: specialCounselingEnabled !== undefined ? specialCounselingEnabled : user.profileData?.specialCounselingEnabled,
    dailyCheckInEnabled: dailyCheckInEnabled !== undefined ? dailyCheckInEnabled : user.profileData?.dailyCheckInEnabled,
    dailyCheckInTime: dailyCheckInTime !== undefined ? dailyCheckInTime : user.profileData?.dailyCheckInTime,
  };

  user.lastActiveAt = new Date().toISOString();
  db.upsertUser(user);

  // Broadcast real-time profile change to all open devices of this user
  realtimeSyncService.broadcastToUser(user.id, user.email, 'user_profile_updated', {
    userId: user.id,
    email: user.email,
    profile: user.profileData,
    updatedAt: user.lastActiveAt,
  });

  return res.json({
    success: true,
    message: 'تم تحديث بيانات البروفايل ونداء الرفيق بنجاح',
    user: {
      id: user.id,
      accountId: user.id,
      email: user.email,
      name: user.name,
      displayName: user.profileData.displayName,
      addressAs: (user as any).addressAs || user.profileData?.addressAs || 'يا غالي',
      username: user.username,
      phone: user.phone,
      role: user.role,
      isEmailVerified: (user as any).isEmailVerified ?? true,
      createdAt: user.createdAt,
    },
    profileData: user.profileData,
  });
};

authRouter.post('/user/update-profile', handleUpdateProfile);
authRouter.post('/auth/user/update-profile', handleUpdateProfile);

// POST /api/auth/send-verification-otp or /api/send-verification-otp
const handleSendVerificationOtp = async (req: Request, res: Response) => {
  const { email, userId } = req.body;

  const cleanEmail = (email || '').trim().toLowerCase();
  let user = db.getUsers().find((u) => u.email.toLowerCase() === cleanEmail || u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'لم يتم العثور على حساب بهذا البريد الإلكتروني' });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

  (user as any).verificationCode = otpCode;
  (user as any).verificationExpiresAt = expiresAt;
  db.upsertUser(user);

  console.log(`[Email Verification OTP] Code for ${user.email}: ${otpCode}`);

  EmailService.sendVerificationEmail(user.email, user.name, otpCode, 'ar').catch((err) => {
    console.warn('[sendVerificationOtp] Failed sending email:', err);
  });

  return res.json({
    success: true,
    message: `تم إرسال رمز التحقق (OTP) إلى بريدك الإلكتروني (${user.email})`,
  });
};

authRouter.post('/send-verification-otp', handleSendVerificationOtp);
authRouter.post('/auth/send-verification-otp', handleSendVerificationOtp);

// POST /api/auth/verify-otp or /api/verify-otp
const handleVerifyOtp = (req: Request, res: Response) => {
  const { email, userId, code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'يرجى إدخال رمز التحقق المكون من 6 أرقام' });
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  const user = db.getUsers().find((u) => u.email.toLowerCase() === cleanEmail || u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'لم يتم العثور على حساب بهذا البريد' });
  }

  const storedCode = (user as any).verificationCode;
  const expiresAt = (user as any).verificationExpiresAt;

  if (expiresAt && Date.now() > expiresAt) {
    return res.status(400).json({ error: 'انتهت صلاحية رمز التحقق، يرجى طلب رمز جديد' });
  }

  if (!storedCode || storedCode.trim() !== String(code).trim()) {
    return res.status(400).json({ error: 'رمز التحقق غير صحيح، يرجى التأكد وإعادة المحاولة' });
  }

  (user as any).isEmailVerified = true;
  delete (user as any).verificationCode;
  delete (user as any).verificationExpiresAt;
  db.upsertUser(user);

  // Send Welcome Email once verified
  EmailService.sendWelcomeEmail(user.email, user.name, 'ar').catch((err) => {
    console.warn('[verify-otp] Could not dispatch welcome email:', err);
  });

  return res.json({
    success: true,
    message: 'تم التحقق من بريدك الإلكتروني بنجاح وتفعيل الحساب! 🎉',
    user: {
      id: user.id,
      accountId: user.id,
      email: user.email,
      username: user.username,
      phone: user.phone,
      name: user.name,
      role: user.role,
      profileData: user.profileData,
      messagesData: user.messagesData,
      itemsData: user.itemsData,
    },
    token: `token_${user.id}_${Date.now()}`,
  });
};

authRouter.post('/verify-otp', handleVerifyOtp);
authRouter.post('/auth/verify-otp', handleVerifyOtp);

// GET /api/user/me
authRouter.get('/user/me', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || '';
  const user = db.findUserById(userId);

  if (!user) {
    return res.json({ loggedIn: false });
  }

  return res.json({
    loggedIn: true,
    user: {
      id: user.id,
      accountId: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      phone: user.phone,
      role: user.role,
      isEmailVerified: (user as any).isEmailVerified ?? true,
      createdAt: user.createdAt,
    },
  });
});

// GET /api/features/permissions
authRouter.get('/features/permissions', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || '';
  const email = (req.query.email as string) || '';
  const country = (req.query.country as string) || '';

  const settings = db.getSettings();

  const evaluateFeature = (config?: {
    mode: 'hidden' | 'everyone' | 'specific_user' | 'allowed_users_list' | 'region';
    allowedUserId?: string;
    allowedUsersList?: string;
    allowedRegion?: string;
  }): boolean => {
    if (!config || config.mode === 'hidden') return false;
    if (config.mode === 'everyone') return true;

    if (config.mode === 'specific_user') {
      const target = (config.allowedUserId || '').toLowerCase().trim();
      return (
        !!target &&
        (userId.toLowerCase().trim() === target || email.toLowerCase().trim() === target)
      );
    }

    if (config.mode === 'allowed_users_list') {
      const list = (config.allowedUsersList || '')
        .toLowerCase()
        .split(',')
        .map((s) => s.trim());
      return list.includes(userId.toLowerCase().trim()) || list.includes(email.toLowerCase().trim());
    }

    if (config.mode === 'region') {
      const allowedRegions = (config.allowedRegion || '')
        .toUpperCase()
        .split(',')
        .map((s) => s.trim());
      return allowedRegions.includes(country.toUpperCase().trim());
    }

    return false;
  };

  const privateCandidAllowed = evaluateFeature(settings.privateCandidVisibility);
  const maritalSupportAllowed = evaluateFeature(settings.maritalSupportVisibility);

  return res.json({
    privateCandidAllowed,
    maritalSupportAllowed,
  });
});
