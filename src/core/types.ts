export type Severity = 'high' | 'medium' | 'low';
export type Category = 'security' | 'quality';

export interface Finding {
  id: string;
  severity: Severity;
  category: Category;
  file: string;
  line: number;
  message: string;
  whyItMatters: string;
  fix: string;
}

export interface Check {
  id: string;
  name: string;
  run(files: string[], rootDir: string): Finding[] | Promise<Finding[]>;
}

export interface ScanResult {
  files: string[];
  findings: Finding[];
}
