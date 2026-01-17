import { exec } from 'child_process';
import { promisify } from 'util';
import type { ValidationResult } from './types';

const execAsync = promisify(exec);

export class SecurityValidator {
  async validate(): Promise<ValidationResult> {
    const result: ValidationResult = {
      passed: true,
      issues: [],
      warnings: [],
    };

    try {
      // Run npm audit
      const auditResult = await this.runNpmAudit();
      result.issues.push(...auditResult.issues);
      result.warnings.push(...auditResult.warnings);

      // Check for common security issues in code
      const codeSecurityResult = await this.checkCodeSecurity();
      result.issues.push(...codeSecurityResult.issues);
      result.warnings.push(...codeSecurityResult.warnings);

      result.passed = result.issues.length === 0;
    } catch (error) {
      result.issues.push(
        `Security validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
      result.passed = false;
    }

    return result;
  }

  private async runNpmAudit(): Promise<{ issues: string[]; warnings: string[] }> {
    const issues: string[] = [];
    const warnings: string[] = [];

    try {
      // Run npm audit with production flag (ignore dev dependencies)
      const { stdout } = await execAsync('npm audit --production --json');
      const auditData = JSON.parse(stdout);

      if (auditData.metadata) {
        const { vulnerabilities } = auditData.metadata;

        if (vulnerabilities.critical > 0) {
          issues.push(`Found ${vulnerabilities.critical} critical security vulnerabilities`);
        }
        if (vulnerabilities.high > 0) {
          issues.push(`Found ${vulnerabilities.high} high security vulnerabilities`);
        }
        if (vulnerabilities.moderate > 0) {
          warnings.push(`Found ${vulnerabilities.moderate} moderate security vulnerabilities`);
        }
        if (vulnerabilities.low > 0) {
          warnings.push(`Found ${vulnerabilities.low} low security vulnerabilities`);
        }
      }
    } catch (error: any) {
      // npm audit returns non-zero exit code if vulnerabilities found
      if (error.stdout) {
        try {
          const auditData = JSON.parse(error.stdout);
          if (auditData.metadata?.vulnerabilities) {
            const { vulnerabilities } = auditData.metadata;
            if (vulnerabilities.critical > 0 || vulnerabilities.high > 0) {
              issues.push(`Security vulnerabilities detected. Run 'npm audit' for details.`);
            }
          }
        } catch {
          warnings.push('Could not parse npm audit output');
        }
      }
    }

    return { issues, warnings };
  }

  private async checkCodeSecurity(): Promise<{ issues: string[]; warnings: string[] }> {
    const issues: string[] = [];
    const warnings: string[] = [];

    try {
      // Check for dangerous patterns using grep
      const dangerousPatterns = [
        { pattern: 'eval\\(', message: 'Use of eval() detected - potential security risk' },
        { pattern: 'innerHTML', message: 'Use of innerHTML detected - potential XSS risk' },
        { pattern: 'dangerouslySetInnerHTML', message: 'Use of dangerouslySetInnerHTML detected' },
        { pattern: 'new Function\\(', message: 'Dynamic function creation detected' },
      ];

      for (const { pattern, message } of dangerousPatterns) {
        try {
          const { stdout } = await execAsync(
            `grep -r "${pattern}" src/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules || exit 0`
          );
          if (stdout.trim()) {
            warnings.push(message);
          }
        } catch {
          // Grep not found or pattern not found - that's okay
        }
      }
    } catch (error) {
      // Non-critical - just skip code security checks
    }

    return { issues, warnings };
  }
}
