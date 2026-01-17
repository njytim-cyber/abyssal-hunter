import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import type { ValidationResult } from './types';

export class ESMValidator {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async validate(): Promise<ValidationResult> {
    const result: ValidationResult = {
      passed: true,
      issues: [],
      warnings: [],
    };

    try {
      // 1. Check package.json has type: "module"
      const packageJsonCheck = await this.validatePackageJson();
      result.issues.push(...packageJsonCheck.issues);
      result.warnings.push(...packageJsonCheck.warnings);

      // 2. Check for CommonJS patterns in source files
      const commonJsCheck = await this.checkForCommonJS();
      result.issues.push(...commonJsCheck.issues);
      result.warnings.push(...commonJsCheck.warnings);

      // 3. Check import/export statements
      const importExportCheck = await this.validateImportExport();
      result.issues.push(...importExportCheck.issues);
      result.warnings.push(...importExportCheck.warnings);

      // 4. Check for circular dependencies
      const circularCheck = await this.checkCircularDependencies();
      result.issues.push(...circularCheck.issues);
      result.warnings.push(...circularCheck.warnings);

      result.passed = result.issues.length === 0;
    } catch (error) {
      result.issues.push(
        `ESM validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
      result.passed = false;
    }

    return result;
  }

  private async validatePackageJson(): Promise<{ issues: string[]; warnings: string[] }> {
    const issues: string[] = [];
    const warnings: string[] = [];

    try {
      const packageJsonPath = join(this.projectRoot, 'package.json');
      const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);

      if (packageJson.type !== 'module') {
        issues.push('package.json must have "type": "module" for ESM support');
      }

      // Check for conflicting settings
      if (packageJson.main && !packageJson.main.endsWith('.js')) {
        warnings.push('package.json "main" field should point to .js file for ESM');
      }
    } catch (error) {
      issues.push('Could not read or parse package.json');
    }

    return { issues, warnings };
  }

  private async checkForCommonJS(): Promise<{ issues: string[]; warnings: string[] }> {
    const issues: string[] = [];
    const warnings: string[] = [];

    try {
      const srcFiles = await this.getAllSourceFiles(join(this.projectRoot, 'src'));

      for (const file of srcFiles) {
        const content = await readFile(file, 'utf-8');

        // Check for require()
        if (
          /\brequire\s*\(/.test(content) &&
          !file.includes('.spec.') &&
          !file.includes('setup.ts')
        ) {
          issues.push(`Found CommonJS require() in ${file}`);
        }

        // Check for module.exports
        if (/\bmodule\.exports\s*=/.test(content)) {
          issues.push(`Found CommonJS module.exports in ${file}`);
        }

        // Check for exports. pattern
        if (/\bexports\.\w+\s*=/.test(content)) {
          issues.push(`Found CommonJS exports assignment in ${file}`);
        }
      }
    } catch (error) {
      warnings.push('Could not check for CommonJS patterns');
    }

    return { issues, warnings };
  }

  private async validateImportExport(): Promise<{ issues: string[]; warnings: string[] }> {
    const issues: string[] = [];
    const warnings: string[] = [];

    try {
      const srcFiles = await this.getAllSourceFiles(join(this.projectRoot, 'src'));

      for (const file of srcFiles) {
        const content = await readFile(file, 'utf-8');

        // Check for relative imports without extensions (should have .js in ESM)
        const relativeImportPattern = /import\s+.*\s+from\s+['"]\.\//g;
        const matches = content.match(relativeImportPattern);

        if (matches) {
          for (const match of matches) {
            // In TypeScript with bundler, this is actually okay
            // But we'll warn if not using a bundler
            // For now, just skip this check since we're using Vite
          }
        }

        // Check for dynamic imports without await
        if (/import\(/.test(content) && !/await\s+import\(/.test(content)) {
          warnings.push(`Dynamic import without await in ${file}`);
        }
      }
    } catch (error) {
      warnings.push('Could not validate import/export statements');
    }

    return { issues, warnings };
  }

  private async checkCircularDependencies(): Promise<{ issues: string[]; warnings: string[] }> {
    const issues: string[] = [];
    const warnings: string[] = [];

    // This would require a more sophisticated dependency graph analysis
    // For now, we'll rely on ESLint's import/no-cycle rule
    warnings.push('Circular dependency check delegated to ESLint');

    return { issues, warnings };
  }

  private async getAllSourceFiles(dir: string, fileList: string[] = []): Promise<string[]> {
    try {
      const files = await readdir(dir, { withFileTypes: true });

      for (const file of files) {
        const filePath = join(dir, file.name);

        if (file.isDirectory()) {
          await this.getAllSourceFiles(filePath, fileList);
        } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
          fileList.push(filePath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or is not readable
    }

    return fileList;
  }
}
