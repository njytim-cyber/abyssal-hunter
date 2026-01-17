#!/usr/bin/env node
/**
 * Natural Language Code Orchestrator
 *
 * This orchestrator allows you to code in natural language by:
 * - Parsing natural language commands
 * - Validating ESM module boundaries
 * - Running security checks
 * - Ensuring tests pass
 * - Maintaining code quality
 * - Preventing breaking changes
 */

import { Command } from 'commander';
import { Orchestrator } from './orchestrator';
import { config } from './config';

const program = new Command();

program
  .name('orchestrator')
  .description('Natural language code orchestrator for safe development')
  .version('1.0.0');

program
  .command('execute')
  .description('Execute a natural language command')
  .argument('<command>', 'Natural language command to execute')
  .option('-d, --dry-run', 'Show what would be done without executing')
  .option('-v, --verbose', 'Verbose output')
  .option('--skip-tests', 'Skip running tests (not recommended)')
  .option('--skip-security', 'Skip security checks (not recommended)')
  .action(async (command: string, options) => {
    const orchestrator = new Orchestrator(config);

    try {
      const result = await orchestrator.execute(command, {
        dryRun: options.dryRun,
        verbose: options.verbose,
        skipTests: options.skipTests,
        skipSecurity: options.skipSecurity,
      });

      if (result.success) {
        console.log('✅ Command executed successfully');
        if (result.warnings.length > 0) {
          console.log('\n⚠️  Warnings:');
          result.warnings.forEach(w => console.log(`  - ${w}`));
        }
      } else {
        console.error('❌ Command failed');
        result.errors.forEach(e => console.error(`  - ${e}`));
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate the entire codebase')
  .option('-f, --fix', 'Automatically fix issues where possible')
  .action(async options => {
    const orchestrator = new Orchestrator(config);

    try {
      const result = await orchestrator.validateCodebase(options.fix);

      if (result.success) {
        console.log('✅ Codebase validation passed');
      } else {
        console.error('❌ Validation failed');
        result.errors.forEach(e => console.error(`  - ${e}`));
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Analyze a natural language command without executing')
  .argument('<command>', 'Natural language command to analyze')
  .action(async (command: string) => {
    const orchestrator = new Orchestrator(config);

    try {
      const analysis = await orchestrator.analyze(command);

      console.log('\n📋 Analysis:');
      console.log(`  Type: ${analysis.type}`);
      console.log(`  Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
      console.log(`\n  Detected intent: ${analysis.intent}`);
      console.log(`\n  Suggested workflow:`);
      analysis.workflow.forEach((step, i) => {
        console.log(`    ${i + 1}. ${step}`);
      });

      if (analysis.risks.length > 0) {
        console.log(`\n  ⚠️  Potential risks:`);
        analysis.risks.forEach(r => console.log(`    - ${r}`));
      }
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    }
  });

program.parse();
