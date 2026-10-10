import { readdir } from 'fs/promises';
import { join, relative } from 'path';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build']);

const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte']);
const EXTRA_FILES = new Set(['.env', '.env.example', '.env.local', '.gitignore', 'package.json']);

export async function scanFiles(rootDir: string): Promise<string[]> {
  const results: string[] = [];
  await walk(rootDir, rootDir, results);
  return results.sort();
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
      const dot = name.lastIndexOf('.');
      const ext = dot >= 0 ? name.slice(dot) : '';
      if (SOURCE_EXTS.has(ext) || EXTRA_FILES.has(name) || ext === '.sql') {
        out.push(relative(root, full));
      }
    }
  }
}
