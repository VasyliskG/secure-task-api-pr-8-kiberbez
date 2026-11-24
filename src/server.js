import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import { ZodError } from 'zod';
import { initStore } from './store.js';
import { authRouter } from './auth-routes.js';
import { taskRouter } from './task-routes.js';
import { authenticate } from './authenticate.js';
 
if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, 'utf8') < 32) {
  throw new Error('JWT_SECRET має бути заданий і містити не менше 32 байтів');
}
 
const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
 
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/tasks', authenticate, taskRouter);
 
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Маршрут не знайдено' } });
});
 
app.use((err, _req, res, next) => {
  if (res.headersSent) return next(err);
 
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Дані запиту не пройшли перевірку',
        details: err.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      }
    });
  }
 
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 500
    ? err.status : 500;
  if (status >= 500) console.error(err);
  return res.status(status).json({
    error: {
      code: status === 500 ? 'INTERNAL_ERROR' : (err.code ?? 'BAD_REQUEST'),
      message: status === 500 ? 'Внутрішня помилка сервера' :
        (err.expose ? err.message : 'Неправильний формат запиту')
    }
  });
});
 
const port = Number(process.env.PORT || 3000);
await initStore();
app.listen(port, () => console.log(`Secure Task API працює на http://localhost:${port}`));
