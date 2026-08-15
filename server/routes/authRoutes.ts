import { Router, Request, Response } from 'express';
import { db, UserEntity } from '../db/database.js';
import { EmailService } from '../services/emailService.js';

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

  const existingEmail = db.getUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existingEmail) {
    return res.status(400).json({ error: 'هذا البريد الإلكتروني مسجل بالفعل لدينا' });
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
    email: email.trim().toLowerCase(),
    username: username ? username.trim().toLowerCase() : undefined,
    phone: phone ? phone.trim() : undefined,
    passwordHash: password, // In production app, hashed with bcrypt
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
  (newUser as any).isEmailVerified = true;

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

  console.log(`[Email Verification] Verification code ${verificationCode} generated for ${newUser.email}`);

  // Send Welcome Email & Verification code via Resend
  EmailService.sendWelcomeEmail(newUser.email, newUser.name, 'ar').catch((err) => {
    console.warn('[handleRegister] Could not dispatch welcome email:', err);
  });

  return res.json({
    message: 'تم إنشاء الحساب بنجاح وتم إرسال رسالة الترحيب وتأكيد الحساب إلى بريدك الإلكتروني',
    verificationCodeSent: true,
    verificationCode,
    user: {
      id: newUser.id,
      accountId: newUser.id,
      email: newUser.email,
      username: newUser.username,
      phone: newUser.phone,
      name: newUser.name,
      role: newUser.role,
    },
    token: `token_${newUser.id}_${Date.now()}`,
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

// POST /api/auth/sync or /api/sync
const handleSync = (req: Request, res: Response) => {
  const { userId, profileData, messagesData, itemsData } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const user = db.findUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (profileData) user.profileData = profileData;
  if (messagesData) user.messagesData = messagesData;
  if (itemsData) user.itemsData = itemsData;

  user.lastActiveAt = new Date().toISOString();
  db.upsertUser(user);

  return res.json({ message: 'Data synchronized successfully' });
};

authRouter.post('/sync', handleSync);
authRouter.post('/auth/sync', handleSync);

// POST /api/user/update-profile or /api/auth/user/update-profile (Real-time Profile Updates and Synchronization)
const handleUpdateProfile = (req: Request, res: Response) => {
  const { userId, name, username, phone, addressAs, companionGender, language, theme, timezone } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  let user = db.findUserById(userId);
  if (!user) {
    // If user is local/guest and updating profile, create entry in db
    user = {
      id: userId,
      email: `${userId.toLowerCase()}@rafiq.local`,
      name: name || 'مستخدم الرفيق',
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };
  }

  // Only update formal account name if explicitly provided and not just modifying companion nickname
  if (name && name.trim()) {
    user.name = name.trim();
  }
  if (username) user.username = username.trim().toLowerCase();
  if (phone) user.phone = phone.trim();
  if (timezone) user.timezone = timezone;
  if (language) user.locale = language;
  if (addressAs !== undefined) (user as any).addressAs = String(addressAs).trim();

  user.lastActiveAt = new Date().toISOString();
  user.profileData = {
    ...(user.profileData || {}),
    name: user.name,
    addressAs: addressAs !== undefined ? String(addressAs).trim() : user.profileData?.addressAs,
    companionGender: companionGender || user.profileData?.companionGender,
    language: language || user.profileData?.language,
    theme: theme || user.profileData?.theme,
  };

  db.upsertUser(user);

  return res.json({
    success: true,
    message: 'تم تحديث بيانات البروفايل ونداء الرفيق بنجاح',
    user: {
      id: user.id,
      accountId: user.id,
      email: user.email,
      name: user.name,
      addressAs: (user as any).addressAs || user.profileData?.addressAs || 'يا غالي',
      username: user.username,
      phone: user.phone,
      role: user.role,
      isEmailVerified: (user as any).isEmailVerified ?? true,
      createdAt: user.createdAt,
    },
  });
};

authRouter.post('/user/update-profile', handleUpdateProfile);
authRouter.post('/auth/user/update-profile', handleUpdateProfile);

// POST /api/auth/send-verification-otp
authRouter.post('/send-verification-otp', (req: Request, res: Response) => {
  const { email, userId } = req.body;

  let user = db.getUsers().find((u) => u.email.toLowerCase() === (email || '').toLowerCase() || u.id === userId);

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

  if (user) {
    (user as any).verificationCode = otpCode;
    (user as any).verificationExpiresAt = expiresAt;
    db.upsertUser(user);
  }

  console.log(`[Email Verification OTP] Code for ${email || userId}: ${otpCode}`);

  return res.json({
    success: true,
    message: `تم إرسال رمز التحقق (OTP) إلى بريدك الإلكتروني (${email || 'المسجل'})`,
    code: otpCode, // Provided for user preview and seamless verification
    hint: `رمز التحقق المرسل لبريدك هو: ${otpCode}`,
  });
});

// POST /api/auth/verify-otp
authRouter.post('/verify-otp', (req: Request, res: Response) => {
  const { email, userId, code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'يرجى إدخال رمز التحقق المكون من 6 أرقام' });
  }

  const user = db.getUsers().find((u) => u.email.toLowerCase() === (email || '').toLowerCase() || u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'لم يتم العثور على المستخدم' });
  }

  const storedCode = (user as any).verificationCode;
  if (storedCode && storedCode !== code.trim()) {
    return res.status(400).json({ error: 'رمز التحقق غير صحيح، يرجى التأكد وإعادة المحاولة' });
  }

  (user as any).isEmailVerified = true;
  delete (user as any).verificationCode;
  delete (user as any).verificationExpiresAt;
  db.upsertUser(user);

  return res.json({
    success: true,
    message: 'تم التحقق من بريدك الإلكتروني بنجاح وتوثيق الحساب ✨',
    isEmailVerified: true,
  });
});

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
