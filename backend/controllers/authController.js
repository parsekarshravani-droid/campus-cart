import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok } from '../utils/asyncHandler.js';
import { createVerificationToken, hashToken, setAuthCookie, clearAuthCookie, signAuthToken } from '../utils/token.js';
import { isEmailConfigured, sendVerificationEmail } from '../services/mailService.js';

const publicUser = (user) => user.toJSON();

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, college, department, year, phone } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with this email already exists.');

  const { raw, hash, expires } = createVerificationToken();

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    college,
    department,
    year,
    phone: phone || '',
    verificationToken: hash,
    verificationTokenExpires: expires,
  });

  let verificationSent = false;
  try {
    verificationSent = await sendVerificationEmail(user, raw);
  } catch (error) {
    console.warn(`[auth] Verification email failed for ${user.email}: ${error.message}`);
  }
  if (!verificationSent) {
    console.info(
      `[auth] Email delivery is not configured — ${user.email} was created unverified and no verification email was sent.`
    );
  }

  setAuthCookie(res, signAuthToken(user));

  return ok(res, 201, 'Account created successfully. Welcome to CAMPUS CART!', {
    user: publicUser(user),
    emailVerification: {
      required: isEmailConfigured(),
      sent: verificationSent,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user) throw ApiError.unauthorized('Incorrect email or password.');

  const matches = await user.comparePassword(password);
  if (!matches) throw ApiError.unauthorized('Incorrect email or password.');

  if (user.isSuspended) throw ApiError.forbidden('Your account is suspended. Contact your campus admin.');

  // Only enforced when the deployment can actually deliver verification emails.
  if (isEmailConfigured() && !user.isVerified) {
    throw new ApiError(403, 'Please verify your email address before signing in.');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  setAuthCookie(res, signAuthToken(user));

  return ok(res, 200, `Welcome back, ${user.name.split(' ')[0]}!`, { user: publicUser(user) });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  return ok(res, 200, 'Signed out successfully.', {});
});

export const me = asyncHandler(async (req, res) =>
  ok(res, 200, 'Session restored.', {
    user: publicUser(req.user),
    emailVerification: { required: isEmailConfigured() },
  })
);

export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    verificationToken: hashToken(req.body.token),
    verificationTokenExpires: { $gt: new Date() },
  }).select('+verificationToken +verificationTokenExpires');

  if (!user) throw ApiError.badRequest('This verification link is invalid or has expired.');

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save({ validateBeforeSave: false });

  return ok(res, 200, 'Email verified successfully.', { user: publicUser(user) });
});

export const resendVerification = asyncHandler(async (req, res) => {
  if (req.user.isVerified) throw ApiError.badRequest('Your email is already verified.');

  const { raw, hash, expires } = createVerificationToken();
  req.user.verificationToken = hash;
  req.user.verificationTokenExpires = expires;
  await req.user.save({ validateBeforeSave: false });

  let sent = false;
  try {
    sent = await sendVerificationEmail(req.user, raw);
  } catch (error) {
    console.warn(`[auth] Resend verification failed: ${error.message}`);
  }

  return ok(
    res,
    200,
    sent
      ? 'Verification email sent. Check your inbox.'
      : 'Email delivery is not configured on this deployment, so no message was sent.',
    { sent }
  );
});
