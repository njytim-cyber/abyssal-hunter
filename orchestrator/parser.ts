import type { CommandType, ParsedCommand } from './types';

export class CommandParser {
  private patterns = {
    feature: [
      /add (a |an |the )?(.+)/i,
      /create (a |an |the )?(.+)/i,
      /implement (.+)/i,
      /build (.+)/i,
      /new (.+)/i,
    ],
    bugfix: [/fix (.+)/i, /repair (.+)/i, /resolve (.+)/i, /correct (.+)/i, /bug (.+)/i],
    refactor: [
      /refactor (.+)/i,
      /restructure (.+)/i,
      /reorganize (.+)/i,
      /improve (.+)/i,
      /clean up (.+)/i,
      /simplify (.+)/i,
    ],
    test: [/test (.+)/i, /add tests? (for |to )?(.+)/i, /write tests? (for |to )?(.+)/i],
    performance: [
      /optimize (.+)/i,
      /improve performance (.+)/i,
      /speed up (.+)/i,
      /make (.+) faster/i,
    ],
    security: [/secure (.+)/i, /fix security (.+)/i, /add security (.+)/i, /protect (.+)/i],
    style: [/format (.+)/i, /style (.+)/i, /beautify (.+)/i],
    docs: [
      /document (.+)/i,
      /add docs? (for |to )?(.+)/i,
      /write docs? (for |to )?(.+)/i,
      /add comments? (to |for )?(.+)/i,
    ],
  };

  parse(command: string): ParsedCommand {
    const normalizedCommand = command.trim().toLowerCase();

    // Detect command type
    let type: CommandType = 'unknown';
    let confidence = 0;
    let extractedIntent = command;

    for (const [commandType, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        const match = normalizedCommand.match(pattern);
        if (match) {
          type = commandType as CommandType;
          confidence = 0.8;
          extractedIntent = match[match.length - 1] || match[1] || command;
          break;
        }
      }
      if (type !== 'unknown') {
        break;
      }
    }

    // Generate workflow based on command type
    const workflow = this.generateWorkflow(type, extractedIntent);

    // Identify potential risks
    const risks = this.identifyRisks(type, normalizedCommand);

    // Extract target files/modules
    const targets = this.extractTargets(normalizedCommand);

    return {
      type,
      intent: extractedIntent,
      confidence,
      workflow,
      risks,
      targets,
    };
  }

  private generateWorkflow(type: CommandType, intent: string): ParsedCommand['workflow'] {
    const baseWorkflow = {
      feature: [
        {
          type: 'analyze' as const,
          description: 'Analyze codebase structure',
          action: async () => {},
        },
        {
          type: 'modify' as const,
          description: 'Implement new feature',
          action: async () => {},
        },
        {
          type: 'test' as const,
          description: 'Write unit and integration tests',
          action: async () => {},
        },
        {
          type: 'validate' as const,
          description: 'Run all validation checks',
          action: async () => {},
        },
        {
          type: 'document' as const,
          description: 'Update documentation',
          action: async () => {},
        },
      ],
      bugfix: [
        {
          type: 'analyze' as const,
          description: 'Identify bug location',
          action: async () => {},
        },
        {
          type: 'test' as const,
          description: 'Write failing test case',
          action: async () => {},
        },
        {
          type: 'modify' as const,
          description: 'Fix the bug',
          action: async () => {},
        },
        {
          type: 'validate' as const,
          description: 'Verify fix works',
          action: async () => {},
        },
      ],
      refactor: [
        {
          type: 'analyze' as const,
          description: 'Understand current implementation',
          action: async () => {},
        },
        {
          type: 'test' as const,
          description: 'Ensure test coverage exists',
          action: async () => {},
        },
        {
          type: 'modify' as const,
          description: 'Refactor code',
          action: async () => {},
        },
        {
          type: 'validate' as const,
          description: 'Verify behavior unchanged',
          action: async () => {},
        },
      ],
      test: [
        {
          type: 'analyze' as const,
          description: 'Identify code to test',
          action: async () => {},
        },
        {
          type: 'modify' as const,
          description: 'Write test cases',
          action: async () => {},
        },
        {
          type: 'validate' as const,
          description: 'Run new tests',
          action: async () => {},
        },
      ],
      performance: [
        {
          type: 'analyze' as const,
          description: 'Profile current performance',
          action: async () => {},
        },
        {
          type: 'modify' as const,
          description: 'Optimize code',
          action: async () => {},
        },
        {
          type: 'test' as const,
          description: 'Benchmark improvements',
          action: async () => {},
        },
        {
          type: 'validate' as const,
          description: 'Verify no regressions',
          action: async () => {},
        },
      ],
      security: [
        {
          type: 'analyze' as const,
          description: 'Identify security vulnerabilities',
          action: async () => {},
        },
        {
          type: 'modify' as const,
          description: 'Apply security fixes',
          action: async () => {},
        },
        {
          type: 'test' as const,
          description: 'Test security improvements',
          action: async () => {},
        },
        {
          type: 'validate' as const,
          description: 'Run security audit',
          action: async () => {},
        },
      ],
      style: [
        {
          type: 'modify' as const,
          description: 'Format code',
          action: async () => {},
        },
        {
          type: 'validate' as const,
          description: 'Verify formatting',
          action: async () => {},
        },
      ],
      docs: [
        {
          type: 'analyze' as const,
          description: 'Review code to document',
          action: async () => {},
        },
        {
          type: 'document' as const,
          description: 'Write documentation',
          action: async () => {},
        },
        {
          type: 'validate' as const,
          description: 'Verify documentation accuracy',
          action: async () => {},
        },
      ],
      unknown: [
        {
          type: 'analyze' as const,
          description: 'Analyze intent',
          action: async () => {},
        },
      ],
    };

    return baseWorkflow[type] || baseWorkflow.unknown;
  }

  private identifyRisks(type: CommandType, command: string): string[] {
    const risks: string[] = [];

    // Check for risky keywords
    if (command.includes('delete') || command.includes('remove')) {
      risks.push('Potential data loss - ensure proper backups');
    }

    if (command.includes('database') || command.includes('db')) {
      risks.push('Database changes - may require migration');
    }

    if (command.includes('auth') || command.includes('security')) {
      risks.push('Security-critical changes - extra validation required');
    }

    if (command.includes('api') || command.includes('endpoint')) {
      risks.push('API changes - may affect clients');
    }

    if (type === 'refactor') {
      risks.push('Refactoring - verify no behavior changes');
    }

    if (type === 'performance') {
      risks.push('Performance changes - benchmark before and after');
    }

    return risks;
  }

  private extractTargets(command: string): string[] {
    const targets: string[] = [];

    // Extract file patterns
    const filePatterns = [/in (\w+\.tsx?)/gi, /to (\w+\.tsx?)/gi, /(\w+\.tsx?)/gi];

    for (const pattern of filePatterns) {
      const matches = command.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !targets.includes(match[1])) {
          targets.push(match[1]);
        }
      }
    }

    // Extract module names
    const modulePattern = /(?:in|to|for) (?:the )?(\w+) (?:module|component|class|function)/gi;
    const moduleMatches = command.matchAll(modulePattern);
    for (const match of moduleMatches) {
      if (match[1] && !targets.includes(match[1])) {
        targets.push(match[1]);
      }
    }

    return targets;
  }
}
