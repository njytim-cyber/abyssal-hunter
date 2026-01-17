import { exec } from 'child_process';
import { promisify } from 'util';
import { CommandParser } from './parser';
import { WorkflowRunner } from './workflow-runner';
import { SecurityValidator } from './security-validator';
import { ESMValidator } from './esm-validator';
import { TestRunner } from './test-runner';
import type {
  OrchestratorConfig,
  ExecutionResult,
  AnalysisResult,
  ExecutionOptions,
} from './types';

const execAsync = promisify(exec);

export class Orchestrator {
  private parser: CommandParser;
  private workflowRunner: WorkflowRunner;
  private securityValidator: SecurityValidator;
  private esmValidator: ESMValidator;
  private testRunner: TestRunner;

  constructor(private config: OrchestratorConfig) {
    this.parser = new CommandParser();
    this.workflowRunner = new WorkflowRunner(config);
    this.securityValidator = new SecurityValidator();
    this.esmValidator = new ESMValidator();
    this.testRunner = new TestRunner();
  }

  async execute(command: string, options: ExecutionOptions): Promise<ExecutionResult> {
    const result: ExecutionResult = {
      success: false,
      errors: [],
      warnings: [],
    };

    try {
      // 1. Parse the natural language command
      const parsedCommand = this.parser.parse(command);

      if (options.verbose) {
        console.log('📝 Parsed command:', parsedCommand);
      }

      // 2. Pre-execution validation
      if (!options.skipSecurity) {
        const securityCheck = await this.securityValidator.validate();
        if (!securityCheck.passed) {
          result.errors.push(...securityCheck.issues);
          return result;
        }
        result.warnings.push(...securityCheck.warnings);
      }

      // 3. Validate ESM structure
      const esmCheck = await this.esmValidator.validate();
      if (!esmCheck.passed) {
        result.errors.push(...esmCheck.issues);
        return result;
      }

      // 4. Run baseline tests (before changes)
      if (!options.skipTests) {
        console.log('🧪 Running baseline tests...');
        const baselineTests = await this.testRunner.runAll();
        if (!baselineTests.passed) {
          result.errors.push('Baseline tests failed. Fix existing issues before making changes.');
          return result;
        }
      }

      // 5. Execute the workflow (this is where the actual code changes happen)
      if (!options.dryRun) {
        console.log('🔧 Executing workflow...');
        const workflowResult = await this.workflowRunner.run(parsedCommand);
        if (!workflowResult.success) {
          result.errors.push(...workflowResult.errors);
          return result;
        }
      } else {
        console.log('🔍 Dry run - would execute:', parsedCommand.workflow);
      }

      // 6. Post-execution validation
      if (!options.dryRun) {
        console.log('✓ Running post-execution checks...');

        // 6a. Lint and format
        console.log('  - Linting...');
        await this.runCommand('npm run lint:fix');

        console.log('  - Formatting...');
        await this.runCommand('npm run format');

        // 6b. Type check
        console.log('  - Type checking...');
        const typeCheck = await this.runCommand('npm run type-check', true);
        if (typeCheck.exitCode !== 0) {
          result.errors.push('Type check failed after changes');
          return result;
        }

        // 6c. Re-validate ESM
        const esmRecheck = await this.esmValidator.validate();
        if (!esmRecheck.passed) {
          result.errors.push('ESM validation failed after changes', ...esmRecheck.issues);
          return result;
        }

        // 6d. Re-run tests
        if (!options.skipTests) {
          console.log('  - Running tests...');
          const testResult = await this.testRunner.runAll();
          if (!testResult.passed) {
            result.errors.push(
              'Tests failed after changes. Changes may have broken existing functionality.'
            );
            return result;
          }
        }

        // 6e. Security re-check
        if (!options.skipSecurity) {
          console.log('  - Security scan...');
          const securityRecheck = await this.securityValidator.validate();
          if (!securityRecheck.passed) {
            result.errors.push('Security issues introduced by changes', ...securityRecheck.issues);
            return result;
          }
        }
      }

      result.success = true;
      return result;
    } catch (error) {
      result.errors.push(
        `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      );
      return result;
    }
  }

  async analyze(command: string): Promise<AnalysisResult> {
    const parsedCommand = this.parser.parse(command);

    return {
      type: parsedCommand.type,
      intent: parsedCommand.intent,
      confidence: parsedCommand.confidence,
      workflow: parsedCommand.workflow.map(step => step.description),
      risks: parsedCommand.risks,
    };
  }

  async validateCodebase(fix: boolean = false): Promise<ExecutionResult> {
    const result: ExecutionResult = {
      success: false,
      errors: [],
      warnings: [],
    };

    try {
      console.log('🔍 Validating codebase...');

      // 1. ESM validation
      console.log('  - Checking ESM structure...');
      const esmCheck = await this.esmValidator.validate();
      if (!esmCheck.passed) {
        result.errors.push(...esmCheck.issues);
      }

      // 2. Security check
      console.log('  - Running security audit...');
      const securityCheck = await this.securityValidator.validate();
      if (!securityCheck.passed) {
        result.errors.push(...securityCheck.issues);
      }
      result.warnings.push(...securityCheck.warnings);

      // 3. Linting
      console.log('  - Linting...');
      const lintCommand = fix ? 'npm run lint:fix' : 'npm run lint';
      const lintResult = await this.runCommand(lintCommand, true);
      if (lintResult.exitCode !== 0 && !fix) {
        result.errors.push('Linting issues found. Run with --fix to auto-fix.');
      }

      // 4. Format check
      console.log('  - Checking formatting...');
      const formatCommand = fix ? 'npm run format' : 'npm run format:check';
      const formatResult = await this.runCommand(formatCommand, true);
      if (formatResult.exitCode !== 0 && !fix) {
        result.errors.push('Formatting issues found. Run with --fix to auto-fix.');
      }

      // 5. Type check
      console.log('  - Type checking...');
      const typeResult = await this.runCommand('npm run type-check', true);
      if (typeResult.exitCode !== 0) {
        result.errors.push('Type check failed');
      }

      // 6. Tests
      console.log('  - Running tests...');
      const testResult = await this.testRunner.runAll();
      if (!testResult.passed) {
        result.errors.push('Tests failed');
      }

      result.success = result.errors.length === 0;
      return result;
    } catch (error) {
      result.errors.push(
        `Validation error: ${error instanceof Error ? error.message : String(error)}`
      );
      return result;
    }
  }

  private async runCommand(
    command: string,
    captureOutput = false
  ): Promise<{ exitCode: number; stdout?: string; stderr?: string }> {
    try {
      const { stdout, stderr } = await execAsync(command);
      if (!captureOutput) {
        if (stdout) {
          console.log(stdout);
        }
        if (stderr) {
          console.error(stderr);
        }
      }
      return { exitCode: 0, stdout, stderr };
    } catch (error: any) {
      if (!captureOutput && error.stdout) {
        console.log(error.stdout);
      }
      if (!captureOutput && error.stderr) {
        console.error(error.stderr);
      }
      return {
        exitCode: error.code || 1,
        stdout: error.stdout,
        stderr: error.stderr,
      };
    }
  }
}
