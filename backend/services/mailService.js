import nodemailer from 'nodemailer';

let transporter = null;

export function isEmailConfigured() {
  return Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function getTransporter() {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }
  return transporter;
}

/**
 * Send a verification email. Returns false when email delivery is not configured
 * — callers must never report success unless this returns true.
 */
export async function sendVerificationEmail(user, rawToken) {
  const mailer = getTransporter();
  if (!mailer) return false;

  const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].replace(/\/$/, '');
  const link = `${frontend}/verify-email?token=${rawToken}`;

  await mailer.sendMail({
    from: process.env.EMAIL_FROM || 'CAMPUS CART <no-reply@campuscart.app>',
    to: user.email,
    subject: 'Verify your CAMPUS CART account',
    text: `Hi ${user.name}, verify your CAMPUS CART account: ${link}\nThis link expires in 24 hours.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto">
      <h2 style="color:#4F46E5">Verify your CAMPUS CART account</h2>
      <p>Hi ${user.name}, welcome to your campus marketplace.</p>
      <p><a href="${link}" style="background:#4F46E5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Verify email</a></p>
      <p style="color:#64748B;font-size:13px">This link expires in 24 hours. If you did not create this account, ignore this email.</p>
    </div>`,
  });
  return true;
}

export async function sendSuspensionEmail(user, suspended) {
  const mailer = getTransporter();
  if (!mailer) return false;
  await mailer.sendMail({
    from: process.env.EMAIL_FROM || 'CAMPUS CART <no-reply@campuscart.app>',
    to: user.email,
    subject: suspended ? 'Your CAMPUS CART account has been suspended' : 'Your CAMPUS CART account has been reinstated',
    text: suspended
      ? 'An administrator suspended your CAMPUS CART account. Contact your campus admin if you believe this is a mistake.'
      : 'Your CAMPUS CART account is active again. Welcome back!',
  });
  return true;
}
