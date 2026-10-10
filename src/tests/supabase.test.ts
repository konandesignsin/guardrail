import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { supabaseCheck } from '../checks/supabase.js';
import type { FileInput } from '../core/types.js';

describe('supabaseCheck', () => {
  it('flags a table created without RLS as high', () => {
    const files: FileInput[] = [
      { path: 'supabase/migrations/001_init.sql', content: 'CREATE TABLE messages (id uuid primary key);\n' },
    ];

    const findings = supabaseCheck(files);

    assert.equal(findings.length, 1);
    assert.equal(findings[0].severity, 'high');
    assert.equal(findings[0].check, 'supabase');
    assert.ok(findings[0].title.includes('messages'));
    assert.ok(findings[0].title.includes('without Row Level Security'));
  });

  it('flags RLS enabled with no policies as medium', () => {
    const files: FileInput[] = [
      {
        path: 'supabase/migrations/001_init.sql',
        content: [
          'CREATE TABLE profiles (id uuid primary key);',
          'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;',
          '',
        ].join('\n'),
      },
    ];

    const findings = supabaseCheck(files);

    assert.equal(findings.length, 1);
    assert.equal(findings[0].severity, 'medium');
    assert.ok(findings[0].title.includes('no policies'));
  });

  it('downgrades USING (true) on a SELECT policy to medium', () => {
    const files: FileInput[] = [
      {
        path: 'supabase/migrations/001_init.sql',
        content: [
          'CREATE POLICY "public_read" ON posts',
          '  FOR SELECT',
          '  USING (true);',
          '',
        ].join('\n'),
      },
    ];

    const findings = supabaseCheck(files);

    assert.equal(findings.length, 1);
    assert.equal(findings[0].severity, 'medium');
  });

  it('keeps USING (true) on a non-SELECT policy as high', () => {
    const files: FileInput[] = [
      {
        path: 'supabase/migrations/001_init.sql',
        content: [
          'CREATE POLICY "any_write" ON posts',
          '  FOR UPDATE',
          '  USING (true);',
          '',
        ].join('\n'),
      },
    ];

    const findings = supabaseCheck(files);

    assert.equal(findings.length, 1);
    assert.equal(findings[0].severity, 'high');
  });

  it('flags WITH CHECK (true) as high', () => {
    const files: FileInput[] = [
      {
        path: 'supabase/migrations/001_init.sql',
        content: 'CREATE POLICY "all_write" ON posts FOR INSERT WITH CHECK (true);\n',
      },
    ];

    const findings = supabaseCheck(files);

    assert.equal(findings.length, 1);
    assert.equal(findings[0].severity, 'high');
    assert.ok(findings[0].title.includes('WITH CHECK (true)'));
  });

  it('accepts a properly secured table', () => {
    const files: FileInput[] = [
      {
        path: 'supabase/migrations/001_init.sql',
        content: [
          'CREATE TABLE notes (id uuid primary key, user_id uuid);',
          'ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;',
          'CREATE POLICY own_notes ON notes FOR SELECT USING (auth.uid() = user_id);',
          '',
        ].join('\n'),
      },
    ];

    const findings = supabaseCheck(files);

    assert.equal(findings.length, 0);
  });
});
