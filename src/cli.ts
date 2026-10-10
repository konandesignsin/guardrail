import { scanFiles } from './core/scanner.js';
import { terminalReport, markdownReport } from './core/reporter.js';
import { scan } from './scan.js';

async function main() {
  const args = process.argv.slice(2);
  const writeReport = args.includes('--report');
  const asJson = args.includes('--json');
  const target = args.find((a) => !a.startsWith('--'));

  if (!target) {
    console.error('Usage: npx tsx src/cli.ts <path-to-project> [--report] [--json]');
    process.exit(1);
  }

  const files = await scanFiles(target);

  if (files.length === 0) {
    console.log(`No source files found in ${target}`);
    process.exit(0);
  }

  const { score, findings } = scan(files);

  const high = findings.filter((f) => f.severity === 'high').length;
  const medium = findings.filter((f) => f.severity === 'medium').length;
  const low = findings.filter((f) => f.severity === 'low').length;

  if (asJson) {
    const json = JSON.stringify(
      {
        score,
        fileCount: files.length,
        summary: { high, medium, low },
        findings,
      },
      null,
      2,
    );
    console.log(json);
    process.exit(0);
  }

  console.log(`\n${high} high, ${medium} medium, ${low} low — score ${score}/100\n`);

  console.log(terminalReport(findings, files.length, score));

  if (writeReport) {
    const md = markdownReport(findings, files.length, score);
    const { writeFile } = await import('fs/promises');
    await writeFile('audit-report.md', md, 'utf-8');
    console.log('Markdown report written to audit-report.md');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
