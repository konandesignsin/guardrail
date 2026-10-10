import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scan } from '../scan.js';
import type { FileInput } from '../core/types.js';

describe('scan', () => {
  it('combines findings from all three checks', () => {
    const files: FileInput[] = [
      { path: '.gitignore', content: '.env\n' },
      { path: '.env.example', content: 'VITE_API_URL=your_url_here\n' },
      {
        path: 'src/App.tsx',
        content: 'const key = "sk-abcdef1234567890abcdef12";\nexport default function App() { return null; }\n',
      },
      {
        path: 'supabase/migrations/001_init.sql',
        content: 'CREATE POLICY "public_read" ON posts\n  FOR SELECT\n  USING (true);\n',
      },
      { path: 'src/orphan.ts', content: 'export function unused() {}\n' },
    ];

    const { findings } = scan(files);
    const checks = new Set(findings.map((f) => f.check));

    assert.ok(checks.has('secrets'));
    assert.ok(checks.has('supabase'));
    assert.ok(checks.has('quality'));
  });
});

describe('scan scoring', () => {
  it('returns score 100 for a clean project', () => {
    const files: FileInput[] = [
      { path: '.gitignore', content: '.env\n' },
      { path: '.env.example', content: 'VITE_API_URL=your_url_here\n' },
      { path: 'package.json', content: JSON.stringify({ dependencies: { react: '^18.0.0' } }) },
      {
        path: 'src/App.tsx',
        content: "import React from 'react';\nexport default function App() { return null; }\n",
      },
    ];

    const result = scan(files);

    assert.equal(result.score, 100);
    assert.equal(result.findings.length, 0);
  });

  it('weights findings as high*15 + medium*5 + low*1', () => {
    const files: FileInput[] = [
      { path: '.gitignore', content: '.env\n' },
      { path: '.env.example', content: 'VITE_API_URL=your_url_here\n' },
      {
        path: 'src/App.tsx',
        content: 'const key = "sk-abcdef1234567890abcdef12";\nexport default function App() { return null; }\n',
      },
      {
        path: 'supabase/migrations/001_init.sql',
        content: 'CREATE POLICY "public_read" ON posts\n  FOR SELECT\n  USING (true);\n',
      },
      { path: 'src/orphan.ts', content: 'export function unused() {}\n' },
    ];

    const result = scan(files);

    assert.equal(result.findings.length, 3);
    assert.equal(result.score, 79);
  });

  it('floors the score at 0', () => {
    const lines = Array.from(
      { length: 7 },
      (_, i) => `api_key = "value${i}1234567890"`,
    ).join('\n');
    const files: FileInput[] = [{ path: 'src/keys.ts', content: lines + '\n' }];

    const result = scan(files);

    assert.equal(result.findings.length, 7);
    assert.equal(result.score, 0);
  });
});
