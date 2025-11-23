import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import { createSession, setSessionCookies } from '../services/auth.js';

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
