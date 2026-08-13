import { Router, Request, Response } from 'express';
import { db, UserEntity } from '../db/database.js';

export const authRouter = Router();

// Generate unique Account ID e.g. USR-842910
function generateAccountId(): string {
  const randNum = Math.floor(100000 + Math.random() * 900000);
  return `USR-${randNum}`;
}

// POST /api/register or /api/auth/register
const handleRegister = (req: Request, res: Response) => {
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

  console.log(`[Email Verification] Verification code ${verificationCode} sent to ${newUser.email}`);

  return res.json({
    message: 'تم إنشاء الحساب بنجاح وتم تحويل رمز التحقق إلى بريدك الإلكتروني',
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

// POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
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
});

// POST /api/auth/google
authRouter.post('/google', (req: Request, res: Response) => {
  const { googleEmail, name, googleId } = req.body;

  if (!googleEmail) {
    return res.status(400).json({ error: 'بريد جوجل غير صالح' });
  }

  let user = db.getUsers().find((u) => u.email.toLowerCase() === googleEmail.toLowerCase());

  if (!user) {
    const accountId = generateAccountId();
    user = {
      id: accountId,
      email: googleEmail.trim().toLowerCase(),
      name: name || googleEmail.split('@')[0],
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
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
  } else {
    user.lastActiveAt = new Date().toISOString();
    db.upsertUser(user);
  }

  return res.json({
    message: 'تم تسجيل الدخول بحساب جوجل بنجاح',
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
});

// POST /api/auth/recover-password
authRouter.post('/recover-password', (req: Request, res: Response) => {
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

  console.log(`[Email Password Reset] Sent email to ${user.email}. Code: ${resetCode}, Link: https://rafiq.ai/reset-password?token=${resetToken}`);

  return res.json({
    success: true,
    message: `تم إرسال رابط استعادة كلمة السر ورمز التحقق إلى بريدك (${user.email}) بنجاح.`,
    hint: `رمز التحقق الخاص بك لإعادة تعيين كلمة السر هو: ${resetCode}`,
    resetLink: `https://rafiq.ai/reset-password?token=${resetToken}`,
  });
});

// POST /api/auth/reset-password
authRouter.post('/reset-password', (req: Request, res: Response) => {
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
});

// POST /api/auth/sync
authRouter.post('/sync', (req: Request, res: Response) => {
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
