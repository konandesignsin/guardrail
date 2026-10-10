import type { Finding, Severity } from './types.js';

const SEVERITY_COLORS: Record<Severity, string> = {
  high: '\x1b[31m',
  medium: '\x1b[33m',
  low: '\x1b[36m',
};
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

function bySeverity(a: Finding, b: Finding): number {
  const order = { high: 0, medium: 1, low: 2 };
  return order[a.severity] - order[b.severity];
}

export function terminalReport(findings: Finding[], fileCount: number, score?: number): string {
  if (findings.length === 0) {
    const scoreNote = score !== undefined ? ` (score ${score}/100)` : '';
    return `\n${BOLD}guardrail${RESET} — scanned ${fileCount} files, no issues found${scoreNote}.\n`;
  }

  const header = score !== undefined
    ? `\n${BOLD}guardrail${RESET} — score ${BOLD}${score}/100${RESET} — ${findings.length} finding${findings.length === 1 ? '' : 's'} across ${fileCount} files\n`
    : `\n${BOLD}guardrail${RESET} — ${findings.length} finding${findings.length === 1 ? '' : 's'} across ${fileCount} files\n`;

  const sorted = [...findings].sort(bySeverity);

  const lines: string[] = [header];

  for (const f of sorted) {
    const color = SEVERITY_COLORS[f.severity];
    const tag = `${color}${BOLD}[${f.severity.toUpperCase()}]${RESET}`;
    const cat = `${DIM}(${f.check})${RESET}`;
    lines.push(`${tag} ${cat} ${f.title}`);
    lines.push(`     ${DIM}${f.file}:${f.line}${RESET}`);
    lines.push(`     ${f.explanation}`);
    lines.push(`     ${BOLD}Fix:${RESET} ${f.fix}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function markdownReport(findings: Finding[], fileCount: number, score?: number): string {
  const title = score !== undefined
    ? `## guardrail — score ${score}/100`
    : `## guardrail`;

  if (findings.length === 0) {
    return `${title}\n\nScanned ${fileCount} files — no issues found.`;
  }

  const lines: string[] = [
    title,
    ``,
    `Found **${findings.length}** issue${findings.length === 1 ? '' : 's'} across ${fileCount} files.`,
    ``,
    `| Severity | Check | File | Issue |`,
    `|----------|-------|------|-------|`,
  ];

  const sorted = [...findings].sort(bySeverity);

  for (const f of sorted) {
    const icon = f.severity === 'high' ? '🔴' : f.severity === 'medium' ? '🟡' : '🔵';
    const loc = `${f.file}:${f.line}`;
    lines.push(`| ${icon} ${f.severity} | ${f.check} | \`${loc}\` | ${f.title} |`);
  }

  lines.push('', '<details>', '<summary>Details & fixes</summary>', '');

  for (const f of sorted) {
    lines.push(`### ${f.title}`);
    lines.push(`- **File:** ${f.file}:${f.line}`);
    lines.push(`- **Severity:** ${f.severity} | **Check:** ${f.check}`);
    lines.push(`- **Why it matters:** ${f.explanation}`);
    lines.push(`- **Fix:** ${f.fix}`);
    lines.push('');
  }

  lines.push('</details>');
  return lines.join('\n');
}
