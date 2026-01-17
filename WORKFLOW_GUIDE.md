# Workflow Orchestrator Guide

## Overview

This project includes a comprehensive workflow orchestrator system that allows you to code in natural language while maintaining code quality, security, and preventing breaking changes.

## Features

- 🤖 **Natural Language Commands**: Write tasks in plain English
- 🔒 **Security Validation**: Automatic vulnerability scanning
- 📦 **ESM Enforcement**: Ensures proper module separation
- 🧪 **Test Protection**: Validates changes don't break existing functionality
- 🎨 **Code Quality**: Automatic linting and formatting
- 🔄 **Pre-commit Hooks**: Quality checks before every commit
- 🚀 **CI/CD Pipeline**: Automated testing and validation

## Quick Start

### Using the Orchestrator

The orchestrator can execute natural language commands while ensuring code quality:

```bash
# Execute a natural language command
npm run orchestrator:execute "add a new particle effect system"

# Analyze a command without executing
npm run orchestrator:analyze "fix the player collision bug"

# Validate entire codebase
npm run orchestrator:validate

# Validate and auto-fix issues
npm run orchestrator:validate -- --fix
```

### Natural Language Commands

The orchestrator understands various command types:

#### Adding Features

```bash
npm run orchestrator:execute "add a power-up system"
npm run orchestrator:execute "create a new enemy type with special abilities"
npm run orchestrator:execute "implement a scoring multiplier"
```

#### Fixing Bugs

```bash
npm run orchestrator:execute "fix the player respawn issue"
npm run orchestrator:execute "resolve the collision detection bug"
npm run orchestrator:execute "correct the audio timing problem"
```

#### Refactoring

```bash
npm run orchestrator:execute "refactor the entity spawning logic"
npm run orchestrator:execute "clean up the game loop"
npm run orchestrator:execute "simplify the particle system"
```

#### Performance Optimization

```bash
npm run orchestrator:execute "optimize the collision detection"
npm run orchestrator:execute "improve rendering performance"
npm run orchestrator:execute "speed up entity updates"
```

#### Testing

```bash
npm run orchestrator:execute "add tests for the player class"
npm run orchestrator:execute "write unit tests for collision detection"
```

## Workflow Process

When you execute a command, the orchestrator:

1. **Parses** the natural language command
2. **Validates** current codebase (security, ESM, tests)
3. **Generates** a workflow based on command type
4. **Executes** the workflow steps
5. **Validates** changes:
   - Runs linting and formatting
   - Performs type checking
   - Re-validates ESM structure
   - Runs all tests
   - Performs security scan
6. **Reports** success or failures

## Manual Workflow Commands

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Code Quality

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Format code
npm run format

# Type check
npm run type-check

# Run all validations
npm run validate
```

## Pre-commit Hooks

Pre-commit hooks are automatically configured via Husky and will run on every commit:

- **Lint** staged files and auto-fix issues
- **Format** staged files with Prettier
- **Run tests** related to changed files
- **Validate** commit message format (conventional commits)

### Commit Message Format

Follow the conventional commits format:

```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or tool changes
- `ci`: CI/CD changes

**Examples:**

```bash
git commit -m "feat: add new particle effect system"
git commit -m "fix: resolve player collision detection issue"
git commit -m "refactor: simplify entity spawning logic"
```

## CI/CD Pipeline

The GitHub Actions workflow automatically runs on push and pull requests:

1. **Security Audit**: npm audit for vulnerabilities
2. **Lint & Format**: ESLint and Prettier checks
3. **Type Check**: TypeScript validation
4. **Unit Tests**: Vitest tests with coverage
5. **E2E Tests**: Playwright tests
6. **Build**: Production build verification
7. **ESM Validation**: Module structure validation

## ESM Guidelines

This project uses ES Modules (ESM). Follow these rules:

### ✅ Do:

```typescript
// Use ES6 imports
import { Player } from './Player';
import type { Entity } from './Entity';

// Use ES6 exports
export class GameEngine {}
export default GameEngine;
```

### ❌ Don't:

```typescript
// Don't use CommonJS require
const Player = require('./Player');

// Don't use CommonJS exports
module.exports = GameEngine;
exports.GameEngine = GameEngine;
```

## Security Guidelines

The orchestrator automatically checks for:

- Vulnerable dependencies (npm audit)
- Unsafe code patterns:
  - `eval()` usage
  - `innerHTML` without sanitization
  - `dangerouslySetInnerHTML`
  - Dynamic function creation

### Security Best Practices:

1. **Always sanitize user input**
2. **Use textContent instead of innerHTML** when possible
3. **Keep dependencies updated**
4. **Review security warnings** from npm audit
5. **Avoid dynamic code execution**

## File Structure

```
abyssal-hunter/
├── src/                          # Source code
│   ├── components/               # React components
│   ├── game/                    # Game engine (ESM modules)
│   ├── styles/                  # CSS files
│   └── test/                    # Test utilities
├── tests/                       # E2E tests
├── orchestrator/                # Natural language orchestrator
│   ├── index.ts                # CLI entry point
│   ├── orchestrator.ts         # Main orchestrator logic
│   ├── parser.ts               # Natural language parser
│   ├── security-validator.ts   # Security checks
│   ├── esm-validator.ts        # ESM validation
│   ├── test-runner.ts          # Test execution
│   └── workflow-runner.ts      # Workflow execution
├── .github/workflows/          # CI/CD workflows
├── .husky/                     # Git hooks
├── .eslintrc.cjs              # ESLint configuration
├── .prettierrc.json           # Prettier configuration
├── commitlint.config.js       # Commit message validation
├── playwright.config.ts       # E2E test configuration
├── tsconfig.json              # TypeScript configuration
└── vite.config.ts             # Vite build configuration
```

## Troubleshooting

### Pre-commit Hook Failures

If pre-commit hooks fail:

```bash
# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Run tests to see failures
npm run test
```

### Test Failures

If tests fail:

```bash
# Run tests in watch mode to debug
npm run test:watch

# Run with UI for better debugging
npm run test:ui

# For E2E tests
npm run test:e2e:headed
```

### Build Errors

If build fails:

```bash
# Check TypeScript errors
npm run type-check

# Check for ESM issues
npm run orchestrator:validate
```

### Security Vulnerabilities

If security issues are found:

```bash
# View details
npm audit

# Try automatic fix
npm audit fix

# For breaking changes
npm audit fix --force
```

## Best Practices

1. **Always run tests before committing**
2. **Use the orchestrator for complex changes**
3. **Write tests for new features**
4. **Follow ESM module patterns**
5. **Keep dependencies updated**
6. **Use semantic commit messages**
7. **Review security warnings**
8. **Maintain code coverage**

## Advanced Configuration

### Orchestrator Options

```bash
# Dry run (show what would be done)
npm run orchestrator:execute "add feature" -- --dry-run

# Verbose output
npm run orchestrator:execute "add feature" -- --verbose

# Skip tests (not recommended)
npm run orchestrator:execute "add feature" -- --skip-tests

# Skip security checks (not recommended)
npm run orchestrator:execute "add feature" -- --skip-security
```

### Customizing Linting Rules

Edit [.eslintrc.cjs](.eslintrc.cjs) to customize linting rules.

### Customizing Formatting

Edit [.prettierrc.json](.prettierrc.json) to customize code formatting.

### Customizing Test Configuration

- Unit tests: [vite.config.ts](vite.config.ts)
- E2E tests: [playwright.config.ts](playwright.config.ts)

## Getting Help

- Check this guide for workflow information
- Review [package.json](package.json) scripts for available commands
- Examine test files for examples
- Check CI/CD logs for detailed error information

## Contributing

When contributing:

1. Create a feature branch
2. Use the orchestrator or manual workflow
3. Ensure all tests pass
4. Follow commit message conventions
5. Create a pull request
6. Wait for CI/CD checks to pass
