import { exec } from 'child_process';
import { promisify } from 'util';
import type { TestResult } from './types';

const execAsync = promisify(exec);

export class TestRunner {
  async runAll(): Promise<TestResult> {
    const result: TestResult = {
      passed: false,
      total: 0,
      passed_count: 0,
      failed: 0,
      skipped: 0,
      failures: [],
    };

    try {
      // Run unit tests
      const unitTestResult = await this.runUnitTests();

      // Run E2E tests
      const e2eTestResult = await this.runE2ETests();

      // Combine results
      result.total = unitTestResult.total + e2eTestResult.total;
      result.passed_count = unitTestResult.passed_count + e2eTestResult.passed_count;
      result.failed = unitTestResult.failed + e2eTestResult.failed;
      result.skipped = unitTestResult.skipped + e2eTestResult.skipped;
      result.failures = [...unitTestResult.failures, ...e2eTestResult.failures];
      result.passed = result.failed === 0;
    } catch (error) {
      result.failures.push({
        test: 'Test execution',
        error: error instanceof Error ? error.message : String(error),
        file: 'unknown',
      });
    }

    return result;
  }

  async runUnitTests(): Promise<TestResult> {
    const result: TestResult = {
      passed: false,
      total: 0,
      passed_count: 0,
      failed: 0,
      skipped: 0,
      failures: [],
    };

    try {
      const { stdout } = await execAsync('npm run test -- --reporter=json');
      const testData = JSON.parse(stdout);

      // Parse Vitest JSON output
      if (testData.numTotalTests) {
        result.total = testData.numTotalTests;
        result.passed_count = testData.numPassedTests || 0;
        result.failed = testData.numFailedTests || 0;
        result.skipped = testData.numSkippedTests || 0;
        result.passed = result.failed === 0;
      }

      if (testData.testResults) {
        for (const testFile of testData.testResults) {
          if (testFile.assertionResults) {
            for (const assertion of testFile.assertionResults) {
              if (assertion.status === 'failed') {
                result.failures.push({
                  test: assertion.fullName || assertion.title,
                  error: assertion.failureMessages?.join('\n') || 'Unknown error',
                  file: testFile.name,
                });
              }
            }
          }
        }
      }
    } catch (error: any) {
      // Tests failed
      result.failed = 1;
      result.total = 1;
      result.failures.push({
        test: 'Unit tests',
        error: error.message || 'Unit tests failed',
        file: 'unknown',
      });
    }

    return result;
  }

  async runE2ETests(): Promise<TestResult> {
    const result: TestResult = {
      passed: false,
      total: 0,
      passed_count: 0,
      failed: 0,
      skipped: 0,
      failures: [],
    };

    try {
      const { stdout } = await execAsync('npm run test:e2e -- --reporter=json');
      const testData = JSON.parse(stdout);

      // Parse Playwright JSON output
      if (testData.suites) {
        for (const suite of testData.suites) {
          if (suite.specs) {
            for (const spec of suite.specs) {
              result.total++;
              if (spec.ok) {
                result.passed_count++;
              } else {
                result.failed++;
                result.failures.push({
                  test: spec.title,
                  error: spec.tests?.[0]?.results?.[0]?.error?.message || 'E2E test failed',
                  file: suite.file,
                });
              }
            }
          }
        }
      }

      result.passed = result.failed === 0;
    } catch (error: any) {
      // E2E tests failed or not configured
      result.failed = 1;
      result.total = 1;
      result.failures.push({
        test: 'E2E tests',
        error: error.message || 'E2E tests failed',
        file: 'unknown',
      });
    }

    return result;
  }

  async runSpecific(pattern: string): Promise<TestResult> {
    const result: TestResult = {
      passed: false,
      total: 0,
      passed_count: 0,
      failed: 0,
      skipped: 0,
      failures: [],
    };

    try {
      const { stdout } = await execAsync(`npm run test -- --reporter=json ${pattern}`);
      const testData = JSON.parse(stdout);

      if (testData.numTotalTests) {
        result.total = testData.numTotalTests;
        result.passed_count = testData.numPassedTests || 0;
        result.failed = testData.numFailedTests || 0;
        result.skipped = testData.numSkippedTests || 0;
        result.passed = result.failed === 0;
      }
    } catch (error: any) {
      result.failed = 1;
      result.total = 1;
      result.failures.push({
        test: pattern,
        error: error.message || 'Test failed',
        file: 'unknown',
      });
    }

    return result;
  }
}
