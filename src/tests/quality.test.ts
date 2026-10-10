import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { qualityCheck } from '../checks/quality.js';
import type { FileInput } from '../core/types.js';

describe('qualityCheck', () => {
  it('flags a dependency that is never imported', () => {
    const files: FileInput[] = [
      {
        path: 'package.json',
        content: JSON.stringify({ dependencies: { react: '^18.0.0', 'unused-package': '^1.0.0' } }),
      },
      {
        path: 'src/App.tsx',
        content: "import React from 'react';\nexport default function App() { return null; }\n",
      },
    ];

    const findings = qualityCheck(files);

    assert.equal(findings.length, 1);
    assert.equal(findings[0].severity, 'medium');
    assert.equal(findings[0].check, 'quality');
    assert.ok(findings[0].title.includes('"unused-package" is never imported'));
  });

  it('flags a package listed in both dependencies and devDependencies', () => {
    const files: FileInput[] = [
      {
        path: 'package.json',
        content: JSON.stringify({
          dependencies: { typescript: '^5.0.0' },
          devDependencies: { typescript: '^5.0.0' },
        }),
      },
      { path: 'src/App.tsx', content: 'export default function App() { return null; }\n' },
    ];

    const findings = qualityCheck(files);

    const finding = findings.find((f) => f.title.includes('in both dependencies and devDependencies'));
    assert.ok(finding, 'expected a duplicate dependency finding');
    assert.equal(finding.severity, 'medium');
  });

  it('flags heavy packages', () => {
    const files: FileInput[] = [
      { path: 'package.json', content: JSON.stringify({ dependencies: { moment: '^2.29.0' } }) },
      { path: 'src/App.tsx', content: 'export default function App() { return null; }\n' },
    ];

    const findings = qualityCheck(files);

    const finding = findings.find((f) => f.title.includes('Heavy package "moment"'));
    assert.ok(finding, 'expected a heavy package finding');
    assert.equal(finding.severity, 'low');
  });

  it('flags console.log calls', () => {
    const files: FileInput[] = [
      { path: 'package.json', content: JSON.stringify({ dependencies: {} }) },
      {
        path: 'src/App.tsx',
        content: "console.log('debugging');\nexport default function App() { return null; }\n",
      },
    ];

    const findings = qualityCheck(files);

    const finding = findings.find((f) => f.title.includes('console.log'));
    assert.ok(finding, 'expected a console.log finding');
    assert.equal(finding.severity, 'low');
  });

  it('groups orphan files into a single finding', () => {
    const files: FileInput[] = [
      { path: 'package.json', content: JSON.stringify({ dependencies: {} }) },
      { path: 'src/App.tsx', content: 'export default function App() { return null; }\n' },
      { path: 'src/utils/helper.ts', content: 'export const one = 1;\n' },
      { path: 'src/utils/other.ts', content: 'export const two = 2;\n' },
    ];

    const findings = qualityCheck(files);

    const orphans = findings.filter((f) => f.title.includes('orphan file'));
    assert.equal(orphans.length, 1);
    assert.ok(orphans[0].title.includes('2 orphan files'));
  });
});
