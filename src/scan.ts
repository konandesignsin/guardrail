import type { FileInput, ScanResult } from './core/types.js';
import { secretsCheck } from './checks/secrets.js';
import { supabaseCheck } from './checks/supabase.js';
import { qualityCheck } from './checks/quality.js';

export function scan(files: FileInput[]): ScanResult {
  const findings = [...secretsCheck(files), ...supabaseCheck(files), ...qualityCheck(files)];
  const high = findings.filter((f) => f.severity === 'high').length;
  const medium = findings.filter((f) => f.severity === 'medium').length;
  const low = findings.filter((f) => f.severity === 'low').length;
  const score = Math.max(0, 100 - high * 15 - medium * 5 - low * 1);
  return { score, findings };
}
