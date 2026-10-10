import { readFile } from 'fs/promises';
import { join, basename } from 'path';
import type { Check, Finding } from '../core/types.js';

const CHECK_ID = 'quality';

const HEAVY_PACKAGES = [
  { name: 'moment', alternative: 'date-fns or dayjs (20x smaller)' },
  { name: 'lodash', alternative: 'lodash-es (tree-shakeable) or native JS methods' },
  { name: 'rxjs', alternative: 'native Promises or lighter alternatives for simple use cases' },
];

export const qualityCheck: Check = {
  id: CHECK_ID,
  name: 'Code quality audit',

  async run(files, rootDir) {
    const findings: Finding[] = [];
    const sourceFiles = files.filter(
      (f) => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'),
    );

    let packageJson: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> } = {};
    if (files.includes('package.json')) {
      const content = await readFile(join(rootDir, 'package.json'), 'utf-8');
      try {
        packageJson = JSON.parse(content);
      } catch {
        return findings;
      }
    }

    const deps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};
    const allDeps = new Set([...Object.keys(deps), ...Object.keys(devDeps)]);

    const importedModules = new Set<string>();
    const fileImports = new Map<string, Set<string>>();

    for (const file of sourceFiles) {
      const content = await readFile(join(rootDir, file), 'utf-8');
      const lines = content.split('\n');
      const imports = new Set<string>();

      for (const line of lines) {
        const importMatch = line.match(/import\s+.*?from\s+['"]([^'"]+)['"]/);
        if (importMatch) {
          const module = importMatch[1];
          imports.add(module);

          if (!module.startsWith('.') && !module.startsWith('@/')) {
            const pkgName = module.startsWith('@') ? module.split('/').slice(0, 2).join('/') : module.split('/')[0];
            importedModules.add(pkgName);
          }
        }
      }

      fileImports.set(file, imports);

      if (lines.length > 500) {
        findings.push({
          id: `${CHECK_ID}-001`,
          severity: 'low',
          category: 'quality',
          file,
          line: 1,
          message: `File has ${lines.length} lines (over 500)`,
          whyItMatters:
            'Large files are hard to understand, test, and maintain. They often contain multiple responsibilities that should be separated.',
          fix: 'Break the file into smaller, focused modules. Extract components, hooks, or utility functions into separate files.',
        });
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (/console\.log\(/.test(line)) {
          findings.push({
            id: `${CHECK_ID}-002`,
            severity: 'low',
            category: 'quality',
            file,
            line: i + 1,
            message: 'console.log left in source code',
            whyItMatters:
              'Debug logs clutter the console in production and can expose sensitive data. They also signal unfinished code to other developers.',
            fix: 'Remove the console.log or use a proper logging library with log levels that can be disabled in production.',
          });
        }

        if (/\/\/\s*(TODO|FIXME)\b/i.test(line)) {
          const match = line.match(/\/\/\s*(TODO|FIXME)\b:?\s*(.*)/i);
          const keyword = match?.[1] || 'TODO';
          findings.push({
            id: `${CHECK_ID}-003`,
            severity: 'low',
            category: 'quality',
            file,
            line: i + 1,
            message: `${keyword} comment in source code`,
            whyItMatters:
              'TODOs and FIXMEs are easy to forget. If this was important enough to note, it should be tracked in your issue tracker where it won\'t be lost.',
            fix: 'Either fix the issue now or create a ticket in your issue tracker and reference it: // TODO #123',
          });
        }
      }
    }

    for (const pkg of HEAVY_PACKAGES) {
      if (deps[pkg.name]) {
        findings.push({
          id: `${CHECK_ID}-004`,
          severity: 'low',
          category: 'quality',
          file: 'package.json',
          line: 1,
          message: `Heavy package "${pkg.name}" in dependencies`,
          whyItMatters:
            `${pkg.name} adds significant bundle size, slowing down your app. Users on mobile or slow connections will notice the difference.`,
          fix: `Consider using ${pkg.alternative}.`,
        });
      }
    }

    for (const pkg of Object.keys(deps)) {
      if (!importedModules.has(pkg) && !pkg.startsWith('@types/')) {
        findings.push({
          id: `${CHECK_ID}-005`,
          severity: 'medium',
          category: 'quality',
          file: 'package.json',
          line: 1,
          message: `Dependency "${pkg}" is never imported in source code`,
          whyItMatters:
            'Unused dependencies bloat your node_modules and install time. They also confuse developers about what the project actually uses.',
          fix: `Remove it: npm uninstall ${pkg}`,
        });
      }
    }

    const duplicateDeps = Object.keys(deps).filter((pkg) => devDeps[pkg]);
    for (const pkg of duplicateDeps) {
      findings.push({
        id: `${CHECK_ID}-006`,
        severity: 'medium',
        category: 'quality',
        file: 'package.json',
        line: 1,
        message: `"${pkg}" is in both dependencies and devDependencies`,
        whyItMatters:
          'Having a package in both lists is confusing and can cause version conflicts. It should only be in one.',
        fix: `Decide if it's needed at runtime (dependencies) or only for development (devDependencies) and remove it from the other.`,
      });
    }

    const importedFiles = new Set<string>();
    for (const [, imports] of fileImports) {
      for (const imp of imports) {
        if (imp.startsWith('.') || imp.startsWith('@/')) {
          importedFiles.add(imp);
        }
      }
    }

    for (const file of sourceFiles) {
      if (file === 'main.tsx' || file === 'index.tsx' || file === 'App.tsx') continue;
      const fileBase = basename(file).replace(/\.\w+$/, '');
      const isImported = Array.from(importedFiles).some(
        (imp) => imp.includes(fileBase) || imp.includes(file.replace(/\.\w+$/, '')),
      );

      if (!isImported && sourceFiles.length > 1) {
        findings.push({
          id: `${CHECK_ID}-007`,
          severity: 'low',
          category: 'quality',
          file,
          line: 1,
          message: 'File is never imported by any other file',
          whyItMatters:
            'Orphan files are dead code. They add to bundle size (if imported elsewhere) or confusion about what the project actually does.',
          fix: 'If the file is truly unused, delete it. If it should be used, import it where needed.',
        });
      }
    }

    return findings;
  },
};
