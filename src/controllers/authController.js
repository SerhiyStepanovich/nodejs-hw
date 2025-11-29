import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import { sendEmail } from '../utils/sendMail.js';
import handlebars from 'handlebars';
import fs from 'fs/promises';

export const registerUser = async (req, res, next) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(createHttpError(400, 'Email in use'));
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({ email, password: hashedPassword });

  const session = await createSession(user._id);
  setSessionCookies(res, session);

  res.status(201).json(user);
};

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return next(createHttpError(401, 'Invalid credentials'));
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return next(createHttpError(401, 'Invalid credentials'));
  }

  await Session.deleteOne({ userId: user._id });

  const session = await createSession(user._id);
  setSessionCookies(res, session);

  res.status(200).json(user);
};

export const refreshUserSession = async (req, res, next) => {
  const { sessionId, refreshToken } = req.cookies;

  if (!sessionId || !refreshToken) {
    return next(createHttpError(401, 'Session not found'));
  }

  const currentSession = await Session.findOne({
    _id: sessionId,
    refreshToken,
  });

  if (!currentSession) {
    return next(createHttpError(401, 'Session not found'));
  }

  const isExpired =
    new Date() > new Date(currentSession.refreshTokenValidUntil);
  if (isExpired) {
    await Session.deleteOne({ _id: sessionId });
    return next(createHttpError(401, 'Session token expired'));
  }

  await Session.deleteOne({ _id: sessionId });

  const newSession = await createSession(currentSession.userId);
  setSessionCookies(res, newSession);

  res.status(200).json({ message: 'Session refreshed' });
};

export const logoutUser = async (req, res, next) => {
  const { sessionId } = req.cookies;

  if (sessionId) {
    await Session.deleteOne({ _id: sessionId });
  }

  res.clearCookie('sessionId');
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(204).send();
};

export const requestResetEmail = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res
      .status(200)
      .json({ message: 'Password reset email sent successfully' });
  }

  try {
    const token = jwt.sign({ sub: user._id, email }, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });

    const resetLink = `${process.env.FRONTEND_DOMAIN}/reset-password?token=${token}`;
    const userName = user.username || user.email.split('@')[0];

    const templatePath = `src/templates/reset-password-email.html`;
    const source = await fs.readFile(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(source);

    const html = compiledTemplate({
      name: userName,
      resetLink,
    });

    await sendEmail({
      to: email,
      subject: 'Скидання паролю',
      html: html,
      from: process.env.SMTP_FROM,
    });

    res.status(200).json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error('Error sending reset email:', error);
    next(
      createHttpError(500, 'Failed to send the email, please try again later.'),
    );
  }
};

export const resetPassword = async (req, res, next) => {
  const { token, password } = req.body;
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.warn('JWT verification failed:', error.message);
    return next(createHttpError(401, 'Invalid or expired token'));
  }

  const { sub: userId, email } = decoded;

  const user = await User.findOne({ _id: userId, email });
  if (!user) {
    return next(createHttpError(404, 'User not found'));
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  user.password = hashedPassword;
  await user.save();

  // await Session.deleteMany({ userId });

  res.status(200).json({
    message: 'Password reset successfully',
  });
};
