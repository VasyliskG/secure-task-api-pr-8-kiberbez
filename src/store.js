import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
 
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(rootDir, 'data');
const files = {
  users: path.join(dataDir, 'users.json'),
  tasks: path.join(dataDir, 'tasks.json')
};
 
export async function initStore() {
  await mkdir(dataDir, { recursive: true });
  for (const file of Object.values(files)) {
    try {
      await readFile(file, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await writeFile(file, '[]\n', { flag: 'wx', mode: 0o600 });
    }
  }
}
 
export async function readCollection(name) {
  const file = files[name];
  if (!file) throw new Error('Unknown collection');
  return JSON.parse(await readFile(file, 'utf8'));
}
 
export async function writeCollection(name, data) {
  const file = files[name];
  if (!file) throw new Error('Unknown collection');
  await writeFile(file, JSON.stringify(data, null, 2), { mode: 0o600 });
}
