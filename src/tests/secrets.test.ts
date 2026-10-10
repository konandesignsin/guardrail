import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { secretsCheck } from '../checks/secrets.js';
import type { FileInput } from '../core/types.js';

const JWT_HEADER = btoa('{"alg":"HS256","typ":"JWT"}');

function serviceRoleToken(): string {
  const payload = btoa('{"role":"service_role"}').replace(/=+$/, '');
  return `${JWT_HEADER}.${payload}.fakesignature`;
}

function anonToken(): string {
  const payload = btoa('{"role":"anon"}').replace(/=+$/, '');
  return `${JWT_HEADER}.${payload}.fakesignature`;
}

const baseFiles: FileInput[] = [
  { path: '.gitignore', content: '.env\nnode_modules\n' },
  { path: '.env.example', content: 'VITE_API_URL=your_url_here\n' },
];

describe('secretsCheck', () => {
  it('flags a hardcoded OpenAI key without exposing the full value', () => {
    const files: FileInput[] = [
      { path: 'src/api.ts', content: 'const key = "sk-abcdef1234567890abcdef12";\n' },
    ];

    const findings = secretsCheck(files);

    assert.equal(findings.length, 1);
    assert.equal(findings[0].severity, 'high');
    assert.equal(findings[0].check, 'secrets');
    assert.ok(findings[0].title.includes('OpenAI API key'));
    assert.ok(findings[0].title.includes('sk-a****'));
    assert.ok(!JSON.stringify(findings).includes('sk-abcdef1234567890abcdef12'));
  });

  it('flags a service_role JWT in a public env variable by variable name', () => {
    const files: FileInput[] = [
      ...baseFiles,
      { path: '.env', content: `VITE_SUPABASE_KEY="${serviceRoleToken()}"\n` },
    ];

    const findings = secretsCheck(files);

    const publicEnvFinding = findings.find((f) => f.title.startsWith('service_role key in public env variable'));
    assert.ok(publicEnvFinding, 'expected a service_role public env finding');
    assert.equal(publicEnvFinding.severity, 'high');
    assert.ok(publicEnvFinding.title.includes('VITE_SUPABASE_KEY'));
    assert.ok(!JSON.stringify(findings).includes(serviceRoleToken()));
  });

  it('does not flag an anon JWT in a public env variable', () => {
    const files: FileInput[] = [
      ...baseFiles,
      { path: '.env', content: `VITE_SUPABASE_ANON_KEY="${anonToken()}"\n` },
    ];

    const findings = secretsCheck(files);

    assert.equal(findings.length, 0);
  });

  it('does not flag URLs in public env variables', () => {
    const files: FileInput[] = [
      ...baseFiles,
      { path: '.env', content: 'VITE_SUPABASE_URL="https://myproject.supabase.co"\n' },
    ];

    const findings = secretsCheck(files);

    assert.equal(findings.length, 0);
  });

  it('flags a suspicious public env variable name', () => {
    const files: FileInput[] = [
      ...baseFiles,
      { path: '.env', content: 'VITE_DB_PASSWORD="hunter2hunter2"\n' },
    ];

    const findings = secretsCheck(files);

    const finding = findings.find((f) => f.title.startsWith('Secret in public env variable'));
    assert.ok(finding, 'expected a suspicious public env finding');
    assert.equal(finding.severity, 'high');
    assert.ok(finding.title.includes('VITE_DB_PASSWORD'));
  });

  it('flags .env missing from .gitignore as high', () => {
    const files: FileInput[] = [{ path: '.env', content: 'FOO=bar\n' }];

    const findings = secretsCheck(files);

    const finding = findings.find((f) => f.title === '.env file is not in .gitignore');
    assert.ok(finding, 'expected a .gitignore finding');
    assert.equal(finding.severity, 'high');
  });

  it('flags missing .env.example as low', () => {
    const files: FileInput[] = [
      { path: '.gitignore', content: '.env\n' },
      { path: '.env', content: 'FOO=bar\n' },
    ];

    const findings = secretsCheck(files);

    const finding = findings.find((f) => f.title === '.env exists but .env.example is missing');
    assert.ok(finding, 'expected a missing .env.example finding');
    assert.equal(finding.severity, 'low');
  });
});
