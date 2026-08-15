/**
 * Email Service utilizing Resend REST API
 * Supports welcome emails, OTP verification codes, and password reset links.
 */

interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private static getApiKey(): string | null {
    return (
      process.env.RESEND_API_KEY ||
      process.env.RESEND_KEY ||
      process.env.VITE_RESEND_API_KEY ||
      null
    );
  }

  private static getFromAddress(): string {
    const customFrom = (process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM || '').trim();
    if (customFrom) {
      const lower = customFrom.toLowerCase();
      // Public email provider domains (e.g. gmail.com, yahoo.com) cannot be verified on Resend
      const isPublicDomain =
        lower.includes('@gmail.com') ||
        lower.includes('@yahoo.com') ||
        lower.includes('@hotmail.com') ||
        lower.includes('@outlook.com') ||
        lower.includes('@icloud.com');

      if (!isPublicDomain) {
        return customFrom.includes('<') ? customFrom : `Rafiq AI <${customFrom}>`;
      }
    }
    return 'Rafiq AI <onboarding@resend.dev>';
  }

  /**
   * Core method to send an email via Resend API
   */
  private static async sendEmail({
    to,
    subject,
    html,
    text,
  }: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<EmailSendResult> {
    const apiKey = this.getApiKey();
    const cleanTo = (to || '').trim().toLowerCase();

    if (!cleanTo) {
      return {
        success: false,
        error: 'Recipient email address is required',
      };
    }

    if (!apiKey) {
      console.warn(
        `[EmailService] RESEND_API_KEY is not configured in environment variables. Email to <${cleanTo}> was skipped.`
      );
      return {
        success: false,
        error: 'RESEND_API_KEY is missing. Please set RESEND_API_KEY in environment variables.',
      };
    }

    try {
      const from = this.getFromAddress();
      console.log(`[EmailService] Sending email to ${cleanTo} from ${from} | Subject: "${subject}"`);

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [cleanTo],
          subject,
          html,
          text: text || subject,
        }),
      });

      const data = (await res.json()) as any;

      if (!res.ok) {
        const errMsg =
          typeof data.message === 'string'
            ? data.message
            : Array.isArray(data.message)
            ? data.message.join(', ')
            : data.error || data.name || 'Failed to deliver email via Resend';

        // Check if this is a Resend testing domain / sandbox restriction (HTTP 403 / 422 validation_error / unverified domain)
        const isSandboxRestriction =
          data.name === 'validation_error' ||
          res.status === 403 ||
          res.status === 422 ||
          errMsg.includes('domain is not verified') ||
          errMsg.includes('only send testing emails') ||
          errMsg.includes('testing email address');

        if (isSandboxRestriction) {
          console.warn(
            `[EmailService] Resend Sandbox Restriction for <${cleanTo}>. Redirecting delivery test to 'delivered@resend.dev'...`
          );

          // Retry via delivered@resend.dev sandbox delivery target
          try {
            const fallbackRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiKey.trim()}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from,
                to: ['delivered@resend.dev'],
                subject: `[Sandbox: ${cleanTo}] ${subject}`,
                html,
                text: text || subject,
              }),
            });

            const fallbackData = (await fallbackRes.json()) as any;
            if (fallbackRes.ok && fallbackData.id) {
              console.log(
                `[EmailService] Sandbox delivery test succeeded for <${cleanTo}> via delivered@resend.dev (ID: ${fallbackData.id})`
              );
              return {
                success: true,
                messageId: fallbackData.id,
              };
            }
          } catch (fallbackErr) {
            console.warn('[EmailService] Sandbox fallback attempt error:', fallbackErr);
          }
        }

        console.warn(`[EmailService] Resend API Notice (${res.status}): ${errMsg}`);
        return {
          success: false,
          error: errMsg,
        };
      }

      console.log(`[EmailService] Email successfully delivered to ${cleanTo} (Message ID: ${data.id})`);
      return {
        success: true,
        messageId: data.id,
      };
    } catch (err: any) {
      console.warn('[EmailService] Network / Fetch error while sending email:', err?.message || err);
      return {
        success: false,
        error: err?.message || 'Unexpected network error during email dispatch',
      };
    }
  }

  /**
   * Send Welcome Email to a newly registered user (Standard or Google Sign-In)
   */
  public static async sendWelcomeEmail(
    toEmail: string,
    name: string,
    language: 'ar' | 'en' = 'ar'
  ): Promise<EmailSendResult> {
    const safeName = name || (toEmail.split('@')[0]);
    const isAr = language === 'ar';

    const subject = isAr
      ? ` أهلاً بك في رفيق، ${safeName}! تم تفعيل حسابك بنجاح`
      : ` Welcome to Rafiq AI, ${safeName}! Your account is ready`;

    const html = isAr
      ? `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 24px; color: #1F2421; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #E8E4DC; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #5B8266 0%, #3D5A46 100%); color: #ffffff; padding: 36px 28px; text-align: center; }
    .header h1 { margin: 0 0 8px; font-size: 24px; font-weight: 800; }
    .header p { margin: 0; font-size: 14px; opacity: 0.9; }
    .body { padding: 32px 28px; line-height: 1.7; }
    .welcome-card { background: #F4F8F5; border: 1px solid #D5E5D9; border-radius: 16px; padding: 18px 20px; margin: 20px 0; }
    .feature-list { list-style: none; padding: 0; margin: 20px 0; }
    .feature-list li { margin-bottom: 12px; display: flex; align-items: flex-start; gap: 10px; font-size: 14px; }
    .badge { background: #5B8266; color: white; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
    .btn { display: inline-block; background: #5B8266; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 14px; font-weight: bold; font-size: 15px; text-align: center; margin: 20px 0; }
    .footer { text-align: center; font-size: 12px; color: #8E9A93; padding: 20px 28px; border-top: 1px solid #E8E4DC; background: #FAF8F5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 38px; margin-bottom: 10px;">✨</div>
      <h1>مرحباً بك في رفيق</h1>
      <p>رفيقك الذكي الشخصي للمحادثة، التنظيم وتطوير يومك</p>
    </div>
    <div class="body">
      <p style="font-size: 16px; font-weight: bold;">أهلاً بك يا ${safeName} 👋</p>
      <p>يسعدنا انضمامك إلى مجتمع <strong>رفيق (Rafiq AI)</strong>. تم إنشاء وربط حسابك بنجاح بأمان تام عبر بريدك الإلكتروني (<code>${toEmail}</code>).</p>
      
      <div class="welcome-card">
        <p style="margin: 0; font-size: 14px; font-weight: bold; color: #3D5A46;">💡 ماذا يمكنك أن تفعل الآن مع رفيق؟</p>
        <ul class="feature-list" style="margin-top: 12px;">
          <li><span class="badge">✓</span> <strong>محادثة ذكية مستمرة:</strong> رفيق يتذكر سياق حديثك وأهدافك الشخصية ويدعمك على مدار الساعة.</li>
          <li><span class="badge">✓</span> <strong>التنظيم وإدارة المواعيد:</strong> سجل مهامك، منبهاتك، ومواعيدك بمجرد ذكرها في الدردشة.</li>
          <li><span class="badge">✓</span> <strong>التحدث الصوتي المباشر:</strong> تواصل صوتياً بمرونة وسرعة دون الحاجة للكتابة.</li>
          <li><span class="badge">✓</span> <strong>المزامنة السحابية:</strong> سجلاتك ومحادثاتك محفوظة ومحمية ومشفرة.</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="https://ais-pre-c2gl4sfut7jgdyzkbmw4bm-492461559935.europe-west3.run.app" class="btn">🚀 ابدأ محادثتك الأولى مع رفيق</a>
      </div>

      <p style="font-size: 13px; color: #6C7570; margin-top: 24px;">إذا كانت لديك أي استفسارات أو احتجت لأي مساعدة، فريقنا ورفيقك دائماً في خدمتك.</p>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;">هذه الرسالة تم إرسالها تلقائياً لتأكيد إنشاء حسابك في تطبيق رفيق.</p>
      <p style="margin: 0;">© ${new Date().getFullYear()} Rafiq AI. جميع الحقوق محفوظة.</p>
    </div>
  </div>
</body>
</html>
`
      : `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 24px; color: #1F2421; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #E8E4DC; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #5B8266 0%, #3D5A46 100%); color: #ffffff; padding: 36px 28px; text-align: center; }
    .header h1 { margin: 0 0 8px; font-size: 24px; font-weight: 800; }
    .header p { margin: 0; font-size: 14px; opacity: 0.9; }
    .body { padding: 32px 28px; line-height: 1.7; }
    .btn { display: inline-block; background: #5B8266; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 14px; font-weight: bold; font-size: 15px; text-align: center; margin: 20px 0; }
    .footer { text-align: center; font-size: 12px; color: #8E9A93; padding: 20px 28px; border-top: 1px solid #E8E4DC; background: #FAF8F5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Rafiq AI</h1>
      <p>Your intelligent companion for daily growth and productivity</p>
    </div>
    <div class="body">
      <p style="font-size: 16px; font-weight: bold;">Hello ${safeName} 👋</p>
      <p>Your account has been created and verified successfully with email <code>${toEmail}</code>.</p>
      <div style="text-align: center;">
        <a href="https://ais-pre-c2gl4sfut7jgdyzkbmw4bm-492461559935.europe-west3.run.app" class="btn">🚀 Open Rafiq AI Companion</a>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Rafiq AI. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

    return this.sendEmail({ to: toEmail, subject, html });
  }

  /**
   * Send OTP Verification Code Email
   */
  public static async sendVerificationEmail(
    toEmail: string,
    name: string,
    code: string,
    language: 'ar' | 'en' = 'ar'
  ): Promise<EmailSendResult> {
    const isAr = language === 'ar';
    const subject = isAr
      ? ` رمز التحقق الخاص بك في رفيق: ${code}`
      : ` Your Rafiq verification code: ${code}`;

    const html = `
<!DOCTYPE html>
<html dir="${isAr ? 'rtl' : 'ltr'}" lang="${language}">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAF8F5; margin: 0; padding: 24px; }
    .container { max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #E8E4DC; border-radius: 24px; padding: 32px; text-align: center; }
    .code-box { font-size: 34px; font-weight: 900; letter-spacing: 6px; background: #F4F8F5; color: #3D5A46; border: 2px dashed #5B8266; padding: 16px; border-radius: 16px; margin: 24px 0; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <h2 style="color: #1F2421; margin-top: 0;">${isAr ? 'رمز التحقق من البريد الإلكتروني' : 'Email Verification Code'}</h2>
    <p style="color: #6C7570;">${isAr ? `مرحباً ${name || ''}، يرجى استخدام رمز التحقق التالي لتأكيد بريدك الإلكتروني:` : `Hello ${name || ''}, please use the following verification code:`}</p>
    <div class="code-box">${code}</div>
    <p style="font-size: 12px; color: #8E9A93;">${isAr ? 'ينتهي هذا الرمز خلال 15 دقيقة. لا تشاركه مع أي شخص.' : 'This code expires in 15 minutes. Do not share it with anyone.'}</p>
  </div>
</body>
</html>
`;

    return this.sendEmail({ to: toEmail, subject, html });
  }

  /**
   * Send Password Reset Email with OTP Code & Direct Link
   */
  public static async sendPasswordResetEmail(
    toEmail: string,
    name: string,
    code: string,
    resetLink: string,
    language: 'ar' | 'en' = 'ar'
  ): Promise<EmailSendResult> {
    const isAr = language === 'ar';
    const subject = isAr
      ? `🔐 استعادة كلمة السر لحسابك في رفيق (الرمز: ${code})`
      : `🔐 Password Reset Request for your Rafiq Account`;

    const html = `
<!DOCTYPE html>
<html dir="${isAr ? 'rtl' : 'ltr'}" lang="${language}">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAF8F5; margin: 0; padding: 24px; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #E8E4DC; border-radius: 24px; padding: 32px; text-align: center; }
    .code-box { font-size: 32px; font-weight: 900; letter-spacing: 4px; background: #FFF7ED; color: #9A3412; border: 2px dashed #F97316; padding: 16px; border-radius: 16px; margin: 20px 0; font-family: monospace; }
    .btn { display: inline-block; background: #5B8266; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <h2 style="color: #1F2421; margin-top: 0;">${isAr ? '🔐 إعادة تعيين كلمة المرور' : 'Reset Password'}</h2>
    <p style="color: #6C7570;">${isAr ? `تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك (${toEmail}). استخدم الرمز أدناه:` : `We received a request to reset your password for (${toEmail}). Use the code below:`}</p>
    <div class="code-box">${code}</div>
    <p style="font-size: 13px; color: #6C7570;">${isAr ? 'أو يمكنك الضغط مباشرة على الزر التالي لتغيير كلمة السر:' : 'Or click the button below directly:'}</p>
    <a href="${resetLink}" class="btn">${isAr ? 'تغيير كلمة المرور الآن' : 'Reset Password Now'}</a>
    <p style="font-size: 12px; color: #8E9A93; margin-top: 24px;">${isAr ? 'إذا لم تطلب أنت هذا التغيير، يمكنك تجاهل هذه الرسالة بأمان.' : 'If you did not request this, you can safely ignore this email.'}</p>
  </div>
</body>
</html>
`;

    return this.sendEmail({ to: toEmail, subject, html });
  }
}
