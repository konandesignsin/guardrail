import { readFile } from 'fs/promises';
import { join } from 'path';
import type { Check, Finding } from '../core/types.js';

const CHECK_ID = 'supabase';

export const supabaseCheck: Check = {
  id: CHECK_ID,
  name: 'Supabase security audit',

  async run(files, rootDir) {
    const findings: Finding[] = [];
    const sqlFiles = files.filter((f) => f.endsWith('.sql'));
    const sourceFiles = files.filter(
      (f) => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'),
    );

    const tableRlsStatus = new Map<string, { rlsEnabled: boolean; policyCount: number; file: string; line: number }>();

    for (const file of sqlFiles) {
      const content = await readFile(join(rootDir, file), 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const createMatch = line.match(/CREATE\s+TABLE\s+(?:public\.)?(\w+)/i);
        if (createMatch) {
          const tableName = createMatch[1];
          tableRlsStatus.set(tableName, { rlsEnabled: false, policyCount: 0, file, line: i + 1 });
        }

        const alterMatch = line.match(/ALTER\s+TABLE\s+(?:public\.)?(\w+)\s+.*ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
        if (alterMatch) {
          const tableName = alterMatch[1];
          const status = tableRlsStatus.get(tableName);
          if (status) status.rlsEnabled = true;
        }

        const createPolicyMatch = line.match(/CREATE\s+POLICY\s+\w+\s+ON\s+(\w+)/i);
        if (createPolicyMatch) {
          const tableName = createPolicyMatch[1];
          const status = tableRlsStatus.get(tableName);
          if (status) status.policyCount++;
        }

        if (/USING\s*\(\s*true\s*\)/i.test(line)) {
          findings.push({
            id: `${CHECK_ID}-001`,
            severity: 'high',
            category: 'security',
            file,
            line: i + 1,
            message: 'Policy with USING (true) allows all reads',
            whyItMatters:
              'USING (true) means any authenticated user can read all rows in this table. This is like having no security on your data at all.',
            fix: 'Replace with a proper condition:\n  USING (auth.uid() = user_id)\nThis ensures users can only read their own data.',
          });
        }

        if (/WITH\s+CHECK\s*\(\s*true\s*\)/i.test(line)) {
          findings.push({
            id: `${CHECK_ID}-002`,
            severity: 'high',
            category: 'security',
            file,
            line: i + 1,
            message: 'Policy with WITH CHECK (true) allows all writes',
            whyItMatters:
              'WITH CHECK (true) means any user can insert or update any row. Someone could modify or delete data that doesn\'t belong to them.',
            fix: 'Replace with a proper condition:\n  WITH CHECK (auth.uid() = user_id)\nThis ensures users can only modify their own data.',
          });
        }

        if (/storage\.buckets/i.test(line)) {
          const contextStart = Math.max(0, i - 1);
          const contextEnd = Math.min(lines.length, i + 3);
          const context = lines.slice(contextStart, contextEnd).join('\n');
          if (/public.*true/i.test(context) || /VALUES.*true/i.test(context)) {
            findings.push({
              id: `${CHECK_ID}-003`,
              severity: 'medium',
              category: 'security',
              file,
              line: i + 1,
              message: 'Public storage bucket created',
              whyItMatters:
                'Public buckets allow anyone to read uploaded files without authentication. If users upload sensitive documents or photos, they become publicly accessible.',
              fix: 'Set public to false unless the bucket truly needs public access:\n  INSERT INTO storage.buckets (id, public) VALUES (\'avatars\', false);',
            });
          }
        }
      }
    }

    for (const [tableName, status] of tableRlsStatus) {
      if (!status.rlsEnabled) {
        findings.push({
          id: `${CHECK_ID}-004`,
          severity: 'high',
          category: 'security',
          file: status.file,
          line: status.line,
          message: `Table "${tableName}" created without Row Level Security`,
          whyItMatters:
            'Without RLS, any authenticated user can read and write all data in this table. This is the #1 security mistake in Supabase apps.',
          fix: `Add this after your CREATE TABLE:\n  ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;`,
        });
      } else if (status.policyCount === 0) {
        findings.push({
          id: `${CHECK_ID}-005`,
          severity: 'medium',
          category: 'security',
          file: status.file,
          line: status.line,
          message: `Table "${tableName}" has RLS enabled but no policies`,
          whyItMatters:
            'RLS with no policies means NO ONE can access the table — not even the owner. Your app will get "permission denied" errors.',
          fix: `Create at least one policy:\n  CREATE POLICY "Users can read own data"\n  ON public.${tableName}\n  FOR SELECT\n  USING (auth.uid() = user_id);`,
        });
      }
    }

    for (const file of sourceFiles) {
      const content = await readFile(join(rootDir, file), 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (/supabase\.from\(['"]\w+['"]\)\.(delete|update)\(\)/.test(line)) {
          if (!/\.eq\(/.test(line) && !/\.filter\(/.test(line)) {
            const method = line.match(/\.(\w+)\(\)/)?.[1] || 'operation';
            findings.push({
              id: `${CHECK_ID}-006`,
              severity: 'high',
              category: 'security',
              file,
              line: i + 1,
              message: `Dangerous ${method}() without filter — affects all rows`,
              whyItMatters:
                `Calling .${method}() without .eq() or .filter() will ${method === 'delete' ? 'delete' : 'modify'} every row in the table. One bug could wipe out all your data.`,
              fix: `Always add a filter:\n  .${method}()\n  .eq('id', targetId)\nThis ensures you only affect the specific row you intend to.`,
            });
          }
        }

        if (/service[_-]?role/i.test(line) && /supabase/i.test(line)) {
          if (!/message:|whyItMatters:|fix:|const\s+\w+\s*=|\/.*\/\.test/.test(line)) {
            findings.push({
              id: `${CHECK_ID}-007`,
              severity: 'high',
              category: 'security',
              file,
              line: i + 1,
              message: 'service_role key used in client code',
              whyItMatters:
                'The service_role key bypasses all security and has full database access. If used in client code, anyone can extract it from your website and take complete control of your database.',
              fix: 'Use the anon key instead:\n  const supabase = createClient(url, import.meta.env.VITE_SUPABASE_ANON_KEY)\nOnly use service_role in secure server-side code.',
            });
          }
        }

        if (/\b(isAdmin|isAdminUser|hasAdminAccess)\s*[:=]\s*localStorage/.test(line)) {
          findings.push({
            id: `${CHECK_ID}-008`,
            severity: 'high',
            category: 'security',
            file,
            line: i + 1,
            message: 'Admin status determined in client code',
            whyItMatters:
              'Anyone can open browser dev tools and change localStorage to set isAdmin=true. Client-side checks are not security — they\'re just UI hints. Real authorization must happen on the server.',
            fix: 'Check admin status server-side using Supabase RLS policies or Edge Functions. Example:\n  CREATE POLICY "Admins only"\n  ON sensitive_table\n  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));',
          });
        }
      }
    }

    return findings;
  },
};
