import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { readCollection, writeCollection } from './store.js';
import { registerSchema, loginSchema } from './validation.js';
import { authenticate } from './authenticate.js';
import { httpError } from './errors.js';
 
export const authRouter = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Забагато спроб. Спробуйте пізніше.' } }
});
 
authRouter.post('/register', authLimiter, async (req, res) => {
  const input = registerSchema.parse(req.body);
  const users = await readCollection('users');
  if (users.some((user) => user.email === input.email)) {
    throw httpError(409, 'EMAIL_EXISTS', 'Користувач із такою адресою вже існує');
  }
  const user = {
    id: randomUUID(),
    email: input.email,
    passwordHash: await bcrypt.hash(input.password, 12),
    createdAt: new Date().toISOString()
  };
  users.push(user);
  await writeCollection('users', users);
  return res.status(201).json({
    data: { id: user.id, email: user.email, createdAt: user.createdAt }
  });
});
 
authRouter.post('/login', authLimiter, async (req, res) => {
  const input = loginSchema.parse(req.body);
  const users = await readCollection('users');
  const user = users.find((item) => item.email === input.email);
  const passwordMatches = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
 
  if (!passwordMatches) {
    throw httpError(401, 'INVALID_CREDENTIALS', 'Неправильна адреса електронної пошти або пароль');
  }
 
  const accessToken = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '15m',
    issuer: 'secure-task-api',
    audience: 'secure-task-api-client'
  });
 
  return res.status(200).json({
    data: {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      user: { id: user.id, email: user.email }
    }
  });
});
 
authRouter.get('/me', authenticate, async (req, res) => {
  const users = await readCollection('users');
  const user = users.find((item) => item.id === req.auth.userId);
  if (!user) throw httpError(401, 'USER_NOT_FOUND', 'Обліковий запис більше не існує');
  return res.json({ data: { id: user.id, email: user.email, createdAt: user.createdAt } });
});
