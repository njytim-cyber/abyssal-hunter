export interface OrchestratorConfig {
  projectRoot: string;
  testTimeout: number;
  securityLevel: 'strict' | 'moderate' | 'loose';
  enableAIAssist: boolean;
}

export interface ExecutionOptions {
  dryRun?: boolean;
  verbose?: boolean;
  skipTests?: boolean;
  skipSecurity?: boolean;
}

export interface ExecutionResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

export interface AnalysisResult {
  type: CommandType;
  intent: string;
  confidence: number;
  workflow: string[];
  risks: string[];
}

export type CommandType =
  | 'feature'
  | 'bugfix'
  | 'refactor'
  | 'test'
  | 'docs'
  | 'style'
  | 'performance'
  | 'security'
  | 'unknown';

export interface ParsedCommand {
  type: CommandType;
  intent: string;
  confidence: number;
  workflow: WorkflowStep[];
  risks: string[];
  targets: string[];
}

export interface WorkflowStep {
  type: 'analyze' | 'modify' | 'test' | 'validate' | 'document';
  description: string;
  action: () => Promise<void>;
}

export interface ValidationResult {
  passed: boolean;
  issues: string[];
  warnings: string[];
}

export interface TestResult {
  passed: boolean;
  total: number;
  passed_count: number;
  failed: number;
  skipped: number;
  failures: TestFailure[];
}

export interface TestFailure {
  test: string;
  error: string;
  file: string;
}
