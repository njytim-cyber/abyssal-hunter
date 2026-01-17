import type { ParsedCommand, OrchestratorConfig } from './types';

export class WorkflowRunner {
  constructor(private config: OrchestratorConfig) {}

  async run(command: ParsedCommand): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      console.log(`\n🚀 Running workflow for: ${command.intent}`);
      console.log(`   Type: ${command.type}`);
      console.log(`   Confidence: ${(command.confidence * 100).toFixed(1)}%\n`);

      for (let i = 0; i < command.workflow.length; i++) {
        const step = command.workflow[i];
        console.log(`   ${i + 1}/${command.workflow.length} ${step.description}...`);

        try {
          await step.action();
        } catch (error) {
          errors.push(
            `Step "${step.description}" failed: ${error instanceof Error ? error.message : String(error)}`
          );
          break;
        }
      }

      if (errors.length === 0) {
        console.log('\n✅ Workflow completed successfully');
      }

      return {
        success: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push(
        `Workflow execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        success: false,
        errors,
      };
    }
  }
}
