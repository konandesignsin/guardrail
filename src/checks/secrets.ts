import { readFile } from 'fs/promises';
import { join } from 'path';
import type { Check, Finding } from '../core/types.js';

const CHECK_ID = 'secrets';

const HARDCODED_PATTERNS = [
  { pattern: /\bsk-[A-Za-z0-9]{20,}/g, name: 'OpenAI API key' },
  { pattern: /\bsk_live_[A-Za-z0-9]{20,}/g, name: 'Stripe secret key' },
  { pattern: /\bAKIA[0-9A-Z]{16}\b/g, name: 'AWS access key' },
  { pattern: /\bAIza[0-9A-Za-z_-]{35}/g, name: 'Google API key' },
  { pattern: /\bghp_[A-Za-z0-9]{36}/g, name: 'GitHub personal access token' },
  { pattern: /api_key\s*[:=]\s*['"][^'"]{8,}['"]/gi, name: 'Generic API key' },
];

const SERVICE_ROLE_JWT = /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g;

function maskSecret(value: string): string {
  if (value.length <= 4) return '****';
  return value.slice(0, 4) + '****';
}

function extractMatch(line: string, pattern: RegExp): string | null {
  const match = line.match(pattern);
  return match ? match[0] : null;
}

export const secretsCheck: Check = {
  id: CHECK_ID,
  name: 'Secrets detector',

  async run(files, rootDir) {
    const findings: Finding[] = [];
    const hasEnv = files.includes('.env');
    const hasEnvExample = files.includes('.env.example');
    let gitignoreContent = '';

    if (files.includes('.gitignore')) {
      gitignoreContent = await readFile(join(rootDir, '.gitignore'), 'utf-8');
    }

    if (hasEnv && !gitignoreContent.includes('.env')) {
      findings.push({
        id: `${CHECK_ID}-001`,
        severity: 'high',
        category: 'security',
        file: '.env',
        line: 1,
        message: '.env file exists but is not in .gitignore',
        whyItMatters:
          'Your .env file contains secrets. If it gets committed to git, anyone with repo access can see your API keys and database passwords.',
        fix: 'Add ".env" to your .gitignore file so it never gets committed.',
      });
    }

    if (hasEnv && !hasEnvExample) {
      findings.push({
        id: `${CHECK_ID}-002`,
        severity: 'low',
        category: 'security',
        file: '.env',
        line: 1,
        message: '.env exists but .env.example is missing',
        whyItMatters:
          'Other developers (or you on another machine) won\'t know what environment variables are needed. An example file documents the required config without exposing real values.',
        fix: 'Create a .env.example file with placeholder values (e.g., API_KEY=your_key_here) and commit it to git.',
      });
    }

    for (const file of files) {
      if (file === '.gitignore') continue;
      const content = await readFile(join(rootDir, file), 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (SERVICE_ROLE_JWT.test(line)) {
          const match = extractMatch(line, SERVICE_ROLE_JWT);
          const decoded = match ? tryDecodeJwt(match) : '';
          if (decoded && decoded.includes('service_role')) {
            findings.push({
              id: `${CHECK_ID}-003`,
              severity: 'high',
              category: 'security',
              file,
              line: i + 1,
              message: `Supabase service_role key found: ${maskSecret(match || '')}`,
              whyItMatters:
                'The service_role key bypasses Row Level Security and has full database access. If exposed in client code, anyone can read/write/delete all your data.',
              fix: 'Use the anon key in client code. Only use service_role in secure server-side environments (Node.js backend, Edge Functions with care).',
            });
          }
        }

        for (const { pattern, name } of HARDCODED_PATTERNS) {
          pattern.lastIndex = 0;
          if (pattern.test(line)) {
            const match = extractMatch(line, pattern);
            findings.push({
              id: `${CHECK_ID}-004`,
              severity: 'high',
              category: 'security',
              file,
              line: i + 1,
              message: `${name} hardcoded: ${maskSecret(match || '')}`,
              whyItMatters:
                'Hardcoded secrets in source code get committed to git. Anyone with access (including leaked repos) can use your API keys, potentially costing you money or exposing data.',
              fix: 'Move the secret to a .env file and load it with import.meta.env.VITE_KEY_NAME (Vite) or process.env.KEY_NAME (Node).',
            });
          }
        }

        if (/\b(VITE_|NEXT_PUBLIC_)[A-Z_]+\s*[:=]\s*['"][^'"]{8,}['"]/.test(line)) {
          const match = line.match(/\b(VITE_|NEXT_PUBLIC_)[A-Z_]+\s*[:=]\s*['"]([^'"]{8,})['"]/);
          if (match) {
            findings.push({
              id: `${CHECK_ID}-005`,
              severity: 'high',
              category: 'security',
              file,
              line: i + 1,
              message: `Secret in public env variable: ${match[1]}${match[2].split('_')[0]}...`,
              whyItMatters:
                'VITE_ and NEXT_PUBLIC_ variables are embedded in your client-side JavaScript bundle. Anyone can view them by inspecting your website, even if they\'re "hidden" in config files.',
              fix: 'Never put secrets in VITE_ or NEXT_PUBLIC_ variables. Use server-side environment variables or a backend API to handle sensitive operations.',
            });
          }
        }
      }
    }

    return findings;
  },
};

function tryDecodeJwt(token: string): string {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return '';
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return decoded;
  } catch {
    return '';
  }
}
