import nodemailer from 'nodemailer';

// Email configuration - in production, use environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    // In development, log instead of actually sending
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 Email to: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Body: ${html}`);
      return true;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@beetronic-os.com',
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err);
    return false;
  }
}

export function getEmailTemplates() {
  return {
    verifyEmail: (name: string, verificationLink: string) => `
      <h2>Verify Your Email</h2>
      <p>Hi ${name},</p>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationLink}">Verify Email</a></p>
      <p>This link expires in 24 hours.</p>
    `,

    resetPassword: (name: string, resetLink: string) => `
      <h2>Reset Your Password</h2>
      <p>Hi ${name},</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetLink}">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, ignore this email.</p>
    `,

    welcomeEmail: (name: string) => `
      <h2>Welcome to BEETRONIC OS!</h2>
      <p>Hi ${name},</p>
      <p>Your account has been created successfully.</p>
      <p>You can now login with your credentials.</p>
      <p>For enhanced security, we recommend enabling two-factor authentication.</p>
    `,

    twoFactorDisabled: (name: string) => `
      <h2>Two-Factor Authentication Disabled</h2>
      <p>Hi ${name},</p>
      <p>Two-factor authentication has been disabled on your account.</p>
      <p>If this wasn't you, please change your password immediately.</p>
    `,
  };
}
