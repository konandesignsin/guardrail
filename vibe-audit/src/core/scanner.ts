import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.next', 'build']);

export async function scanFiles(rootDir: string): Promise<string[]> {
  const results: string[] = [];
  await walk(rootDir, rootDir, results);
  return results.sort();
}

async function walk(root: string, dir: string, out: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const name = entry.name;
    if (name.startsWith('.') && name !== '.env') continue;
    const full = join(dir, name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      await walk(root, full, out);
    } else if (entry.isFile()) {
      const ext = name.slice(name.lastIndexOf('.'));
      if (['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte'].includes(ext)) {
        out.push(relative(root, full));
      }
    }
  }
}
