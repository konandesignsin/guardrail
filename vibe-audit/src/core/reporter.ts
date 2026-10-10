import type { Finding, Severity } from './types.js';

const SEVERITY_COLORS: Record<Severity, string> = {
  high: '\x1b[31m',
  medium: '\x1b[33m',
  low: '\x1b[36m',
};
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

export function terminalReport(findings: Finding[], fileCount: number): string {
  if (findings.length === 0) {
    return `\n${BOLD}vibe-audit${RESET} — scanned ${fileCount} files, no issues found.\n`;
  }

  const sorted = [...findings].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  const lines: string[] = [
    `\n${BOLD}vibe-audit${RESET} — ${findings.length} finding${findings.length === 1 ? '' : 's'} across ${fileCount} files\n`,
  ];

  for (const f of sorted) {
    const color = SEVERITY_COLORS[f.severity];
    const tag = `${color}${BOLD}[${f.severity.toUpperCase()}]${RESET}`;
    const cat = `${DIM}(${f.category})${RESET}`;
    lines.push(`${tag} ${cat} ${f.message}`);
    lines.push(`     ${DIM}${f.file}:${f.line}${RESET}`);
    lines.push(`     ${f.whyItMatters}`);
    lines.push(`     ${BOLD}Fix:${RESET} ${f.fix}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function markdownReport(findings: Finding[], fileCount: number): string {
  if (findings.length === 0) {
    return `## vibe-audit\n\nScanned ${fileCount} files — no issues found.`;
  }

  const lines: string[] = [
    `## vibe-audit`,
    ``,
    `Found **${findings.length}** issue${findings.length === 1 ? '' : 's'} across ${fileCount} files.`,
    ``,
    `| Severity | Category | File | Issue |`,
    `|----------|----------|------|-------|`,
  ];

  const sorted = [...findings].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  for (const f of sorted) {
    const icon = f.severity === 'high' ? '🔴' : f.severity === 'medium' ? '🟡' : '🔵';
    const loc = `${f.file}:${f.line}`;
    lines.push(`| ${icon} ${f.severity} | ${f.category} | \`${loc}\` | ${f.message} |`);
  }

  lines.push('', '<details>', '<summary>Details & fixes</summary>', '');

  for (const f of sorted) {
    lines.push(`### ${f.id} — ${f.message}`);
    lines.push(`- **File:** ${f.file}:${f.line}`);
    lines.push(`- **Severity:** ${f.severity} | **Category:** ${f.category}`);
    lines.push(`- **Why it matters:** ${f.whyItMatters}`);
    lines.push(`- **Fix:** ${f.fix}`);
    lines.push('');
  }

  lines.push('</details>');
  return lines.join('\n');
}
