import { scanFiles } from './core/scanner.js';
import { terminalReport, markdownReport } from './core/reporter.js';
import type { Check, Finding } from './core/types.js';
import { secretsCheck } from './checks/secrets.js';
import { supabaseCheck } from './checks/supabase.js';
import { qualityCheck } from './checks/quality.js';

const CHECKS: Check[] = [secretsCheck, supabaseCheck, qualityCheck];

async function main() {
  const target = process.argv[2];

  if (!target) {
    console.error('Usage: npx tsx src/cli.ts <path-to-project>');
    process.exit(1);
  }

  const files = await scanFiles(target);

  if (files.length === 0) {
    console.log(`No source files found in ${target}`);
    process.exit(0);
  }

  const allFindings: Finding[] = [];
  for (const check of CHECKS) {
    const results = await check.run(files, target);
    allFindings.push(...results);
  }

  console.log(terminalReport(allFindings, files.length));

  const md = markdownReport(allFindings, files.length);
  const { writeFile } = await import('fs/promises');
  await writeFile('audit-report.md', md, 'utf-8');
  console.log('Markdown report written to audit-report.md');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
