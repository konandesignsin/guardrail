import { readFile } from 'fs/promises';
import { join } from 'path';
import type { Check, Finding } from '../core/types.js';

const DUMMY_ID = 'dummy-001';

export const dummyCheck: Check = {
  id: DUMMY_ID,
  name: 'TODO comment detector',

  async run(files, rootDir) {
    const findings: Finding[] = [];

    for (const file of files) {
      const content = await readFile(join(rootDir, file), 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/\/\/\s*TODO\b/i);
        if (!match) continue;

        findings.push({
          id: DUMMY_ID,
          severity: 'low',
          category: 'quality',
          file,
          line: i + 1,
          message: 'TODO comment left in source code',
          whyItMatters:
            'TODOs are easy to forget. If this was meant to be done before launch, it might slip through without a tracker entry.',
          fix: 'Either complete the task now or create an issue/ticket and link it in the comment (e.g. // TODO #123).',
        });
      }
    }

    return findings;
  },
};
