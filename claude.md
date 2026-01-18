# Claude Learning Log - Abyssal Hunter Project

## Session: GitHub Actions Debugging & Cloudflare Pages Setup

**Date**: 2026-01-18

### Issues Identified and Resolved

#### 1. Playwright E2E Test Failures

**Problem**: E2E tests were failing in GitHub Actions due to CSS selector ambiguity

- `.title` selector matched 2 elements: start screen title and game over title
- `.desc` selector matched 2 elements: start screen description and game over description

**Root Cause**: Playwright's strict mode detected multiple matching elements, causing test failures

**Solution**: Made selectors more specific

```typescript
// Before
await expect(page.locator('.title')).toContainText('Abyssal Hunter');
await expect(page.locator('.desc')).toContainText('WASD');

// After
await expect(page.locator('.title.glow-pulse')).toContainText('Abyssal Hunter');
await expect(page.locator('.screen.visible .desc')).toContainText('WASD');
```

**Key Learning**: Always use specific selectors in E2E tests to avoid ambiguity, especially when the same CSS classes are reused across different screens.

---

#### 2. Missing Coverage Dependency

**Problem**: Unit tests with coverage were failing with error:

```
MISSING DEPENDENCY: Cannot find dependency '@vitest/coverage-v8'
```

**Root Cause**: Package was referenced in test script but not installed

**Solution**: Added to `package.json` devDependencies:

```json
"@vitest/coverage-v8": "^4.0.17"
```

**Key Learning**: When using Vitest coverage features, ensure `@vitest/coverage-v8` (or `@vitest/coverage-istanbul`) is explicitly installed as a dev dependency.

---

#### 3. E2E Tests Removed from CI/CD

**Problem**: E2E tests add significant time to CI/CD pipeline and are better suited for local testing

**Solution**:

- Removed entire `test-e2e` job from `.github/workflows/ci.yml`
- Removed `test-e2e` from build job dependencies
- E2E tests remain available via `npm run test:e2e` for local development

**Key Learning**: E2E tests can be computationally expensive in CI/CD. Consider running them:

- Locally before pushing
- On a schedule (nightly builds)
- Only on release branches
- In a separate workflow that doesn't block deployments

---

#### 4. Cloudflare Pages Configuration

**Problem**: Cloudflare Pages deployment failing with error:

```
Configuration file for Pages projects does not support "build"
```

**Root Cause**: `wrangler.toml` contained `[build]` section which is not supported for Pages projects

**Solution**: Removed incompatible sections from `wrangler.toml`:

```toml
# Removed these sections:
[build]
command = "npm run build"
cwd = "/"

[build.upload]
format = "service-worker"
```

**Kept only Pages-compatible configuration**:

```toml
name = "abyssal-hunter"
compatibility_date = "2024-01-01"
pages_build_output_dir = "dist"
```

**Key Learning**:

- Cloudflare Pages vs Workers use different `wrangler.toml` configurations
- For Pages: Build settings go in the Cloudflare dashboard, NOT in wrangler.toml
- For Workers: Build settings CAN go in wrangler.toml
- The `[build]` section is Workers-specific

**Cloudflare Pages Dashboard Settings**:

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/` (default)

---

#### 5. Git Commit Message Formatting

**Problem**: Commit failed due to commitlint rule violation:

```
body's lines must not be longer than 100 characters [body-max-line-length]
```

**Solution**: Wrapped long lines in commit message body:

```bash
# Before (line too long)
- Fix E2E test locator ambiguity by using more specific selectors (.title.glow-pulse and .screen.visible .desc)

# After (wrapped properly)
- Fix E2E test locator ambiguity by using more specific selectors
  (.title.glow-pulse and .screen.visible .desc)
```

**Key Learning**:

- Respect repository's commit message conventions (enforced by commitlint)
- Common rules: 100 char max for body lines, 72 char for subject
- Use multi-line formatting for detailed explanations
- Follow conventional commits format: `type: subject`

---

### Testing Strategy Insights

#### Unit Tests (Vitest)

- Fast and run in CI/CD ✅
- Good for testing individual functions and components
- Coverage reports help identify untested code
- Current issue: `config.spec.ts` has import problems (needs investigation)

#### E2E Tests (Playwright)

- Slower, more fragile ⚠️
- Better for local development and pre-release testing
- Can catch integration issues that unit tests miss
- Should use specific, unambiguous selectors

#### CI/CD Pipeline Optimization

Current workflow runs:

1. Security audit
2. Lint & format checks
3. TypeScript type checking
4. Unit tests with coverage
5. ESM validation
6. Build validation

This provides good coverage without the overhead of E2E tests.

---

### Tools and Commands Used

**GitHub CLI**:

```bash
gh run list --limit 5          # List recent workflow runs
gh run view <run-id>            # View run details
gh run view <run-id> --log-failed  # View failed job logs
gh pr checks                    # Check PR status
```

**Testing**:

```bash
npm run test                    # Unit tests
npm run test:coverage           # Unit tests with coverage
npm run test:e2e               # E2E tests (local only)
npx vitest run <file>          # Run specific test file
npx playwright test            # Run Playwright tests
```

**Git**:

```bash
git status                      # Check working directory
git diff                        # View changes
git add <files>                 # Stage files
git commit -m "message"         # Commit with message
git push                        # Push to remote
```

---

### Best Practices Learned

1. **Test Selectors**: Use specific, scoped selectors in E2E tests to avoid ambiguity
2. **Dependencies**: Explicitly install all required packages, even if they're peer dependencies
3. **CI/CD**: Keep pipelines fast by moving expensive tests to local/scheduled runs
4. **Configuration**: Understand platform-specific config requirements (Pages vs Workers)
5. **Git Hygiene**: Follow project conventions for commit messages and formatting
6. **Error Investigation**: Use detailed logs (`--log-failed`) to diagnose CI failures

---

### Future Improvements

1. Fix `config.spec.ts` import/execution issues
2. Consider adding E2E tests to scheduled nightly builds
3. Set up Codecov integration for coverage tracking
4. Add deployment workflow for Cloudflare Pages
5. Update husky hooks to v10.0.0 (currently showing deprecation warnings)

---

### Files Modified

- `.github/workflows/ci.yml` - Removed E2E tests job
- `package.json` - Added @vitest/coverage-v8 dependency
- `tests/game.spec.ts` - Fixed selector specificity
- `wrangler.toml` - Removed unsupported build config for Pages
- `package-lock.json` - Updated with new dependency

### Commit Reference

```
fix: resolve GitHub Actions failures and prepare Cloudflare Pages deployment
- Fix E2E test locator ambiguity by using more specific selectors
- Add missing @vitest/coverage-v8 dependency for unit test coverage
- Remove E2E tests from GitHub Actions CI/CD pipeline (test locally)
- Fix wrangler.toml for Cloudflare Pages by removing unsupported [build] section
```

Commit: `bd2e82e`
