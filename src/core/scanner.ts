import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';
import type { FileInput } from './types.js';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build']);

const SKIP_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
]);

const SKIP_EXTS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.svg',
  '.webp',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.mp3',
  '.mp4',
  '.wav',
  '.avi',
  '.mov',
]);

const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte', '.sql']);
const EXTRA_FILES = new Set(['.env', '.env.example', '.env.local', '.gitignore', 'package.json']);

export async function scanFiles(rootDir: string): Promise<FileInput[]> {
  const paths: string[] = [];
  await walk(rootDir, rootDir, paths);
  paths.sort();

  const files: FileInput[] = [];
  for (const path of paths) {
    const content = await readFile(join(rootDir, path), 'utf-8');
    files.push({ path, content });
  }
  return files;
}

async function walk(root: string, dir: string, out: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const name = entry.name;
    if (name.startsWith('.') && name !== '.env' && name !== '.env.example' && name !== '.env.local' && name !== '.gitignore') continue;
    const full = join(dir, name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      await walk(root, full, out);
    } else if (entry.isFile()) {
      if (SKIP_FILES.has(name)) continue;
      const dot = name.lastIndexOf('.');
      const ext = dot >= 0 ? name.slice(dot).toLowerCase() : '';
      if (SKIP_EXTS.has(ext)) continue;
      if (SOURCE_EXTS.has(ext) || EXTRA_FILES.has(name)) {
        out.push(relative(root, full).replace(/\\/g, '/'));
      }
    }
  }
}
