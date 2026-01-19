# PR Command

Create a pull request with full CI validation.

## Workflow

1. **Check for changes**
   - Run `git status` to see uncommitted changes
   - Run `git diff` to review changes

2. **Run all CI checks locally** (same as GitHub Actions)
   - `pnpm lint` - ESLint
   - `pnpm format:check` - Prettier formatting
   - `pnpm typecheck` - TypeScript type checking
   - `pnpm test` - Run tests
   - `pnpm build` - Build packages
   - If any check fails, fix the issues before proceeding

3. **Commit changes** (if there are uncommitted changes)
   - Stage all changes with `git add .`
   - Write a descriptive commit message following conventional commits
   - Commit the changes

4. **Create branch** (if on main)
   - If currently on main branch, create a new feature branch
   - Branch name format: `claude/<feature-description>-<random-5-chars>`

5. **Push and create PR**
   - Push the branch with `git push -u origin <branch>`
   - Create PR with `gh pr create --title "<title>" --body "<body>"`
   - PR body should include:
     - ## Summary (1-3 bullet points)
     - ## Test plan (checklist)
     - Footer: Generated with Claude Code

## Usage

```
/pr
```

This command will guide through the entire PR creation process, ensuring all CI checks pass before submitting.
