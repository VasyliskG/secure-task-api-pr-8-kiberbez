import { z } from 'zod';
 
const passwordSchema = z.string()
  .min(10, 'Пароль має містити щонайменше 10 символів')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72,
    'Пароль не може перевищувати 72 байти для bcrypt');
 
const emailSchema = z.string().trim().email().transform((value) => value.toLowerCase());
 
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema
}).strict();
 
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).refine((value) => Buffer.byteLength(value, 'utf8') <= 72)
}).strict();
 
export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().default(''),
  status: z.enum(['todo', 'in_progress', 'done']).optional().default('todo')
}).strict();
 
export const patchTaskSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional()
}).strict().refine((value) => Object.keys(value).length > 0,
  'Потрібно передати хоча б одне поле');
