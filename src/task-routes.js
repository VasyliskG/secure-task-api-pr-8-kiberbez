import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { readCollection, writeCollection } from './store.js';
import { createTaskSchema, patchTaskSchema } from './validation.js';
import { httpError } from './errors.js';
 
export const taskRouter = Router();
 
function publicTask(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };
}
 
function findOwnedTask(tasks, id, userId) {
  return tasks.findIndex((task) => task.id === id && task.ownerId === userId);
}
 
taskRouter.get('/', async (req, res) => {
  const tasks = await readCollection('tasks');
  const data = tasks
    .filter((task) => task.ownerId === req.auth.userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(publicTask);
  return res.json({ data });
});
 
taskRouter.post('/', async (req, res) => {
  const input = createTaskSchema.parse(req.body);
  const tasks = await readCollection('tasks');
  const now = new Date().toISOString();
  const task = {
    id: randomUUID(),
    ownerId: req.auth.userId,
    ...input,
    createdAt: now,
    updatedAt: now
  };
  tasks.push(task);
  await writeCollection('tasks', tasks);
  return res.status(201).location(`/api/tasks/${task.id}`).json({ data: publicTask(task) });
});
 
taskRouter.get('/:id', async (req, res) => {
  const tasks = await readCollection('tasks');
  const index = findOwnedTask(tasks, req.params.id, req.auth.userId);
  if (index === -1) throw httpError(404, 'TASK_NOT_FOUND', 'Завдання не знайдено');
  return res.json({ data: publicTask(tasks[index]) });
});
 
taskRouter.patch('/:id', async (req, res) => {
  const input = patchTaskSchema.parse(req.body);
  const tasks = await readCollection('tasks');
  const index = findOwnedTask(tasks, req.params.id, req.auth.userId);
  if (index === -1) throw httpError(404, 'TASK_NOT_FOUND', 'Завдання не знайдено');
  tasks[index] = { ...tasks[index], ...input, updatedAt: new Date().toISOString() };
  await writeCollection('tasks', tasks);
  return res.json({ data: publicTask(tasks[index]) });
});
 
taskRouter.delete('/:id', async (req, res) => {
  const tasks = await readCollection('tasks');
  const index = findOwnedTask(tasks, req.params.id, req.auth.userId);
  if (index === -1) throw httpError(404, 'TASK_NOT_FOUND', 'Завдання не знайдено');
  tasks.splice(index, 1);
  await writeCollection('tasks', tasks);
  return res.status(204).end();
});
