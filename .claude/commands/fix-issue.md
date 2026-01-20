# Fix Issue Command

Fix a GitHub issue and create a PR for it.

## Arguments

- `$ARGUMENTS` - The GitHub issue number (e.g., `128`)

## Workflow

1. **Fetch the issue**
   - Run `gh issue view $ARGUMENTS` to get issue details
   - Understand the problem description, expected behavior, and any reproduction steps

2. **Create a feature branch**
   - Create branch: `git checkout -b fix/issue-$ARGUMENTS`

3. **Locate related code**
   - Search the codebase for relevant files
   - Use grep/glob to find code related to the issue
   - Read and understand the relevant code

4. **Fix the issue**
   - Make the necessary code changes
   - Follow existing code patterns and conventions
   - Add tests if applicable

5. **Run all CI checks locally**
   - `pnpm lint` - ESLint
   - `pnpm format:check` - Prettier formatting
   - `pnpm typecheck` - TypeScript type checking
   - `pnpm test` - Run tests
   - `pnpm build` - Build packages
   - Fix any issues that arise

6. **Commit and create PR**
   - Stage changes: `git add .`
   - Commit with message: `fix: <description> (fixes #$ARGUMENTS)`
   - Push: `git push -u origin fix/issue-$ARGUMENTS`
   - Create PR linking to the issue:

     ```
     gh pr create --title "fix: <description>" --body "Fixes #$ARGUMENTS

     ## Summary
     <description of changes>

     ## Test plan
     - [ ] <test steps>
     "
     ```

## Usage

```
/fix-issue 128
```

This will fetch issue #128, analyze it, fix it, and create a PR.
