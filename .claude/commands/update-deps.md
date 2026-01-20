# Update Dependencies Command

Update project dependencies one by one, running tests after each update.

## Workflow

1. **Create update branch**
   - `git checkout -b chore/update-deps`

2. **Check for outdated packages**
   - Run `pnpm outdated` to see all outdated dependencies
   - Categorize updates by severity (patch, minor, major)

3. **Update dependencies incrementally**
   For each outdated package, in order of risk (patch -> minor -> major):

   a. **Update the package**
   - `pnpm update <package>@<version>` for specific version
   - Or edit package.json and run `pnpm install`

   b. **Run CI checks**
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm build`

   c. **If tests pass**: Commit the update
   - `git add .`
   - `git commit -m "chore(deps): update <package> to <version>"`

   d. **If tests fail**:
   - Investigate and fix compatibility issues
   - Or revert: `git checkout -- .`
   - Document the issue for manual review

4. **Create summary PR**
   - Push all commits: `git push -u origin chore/update-deps`
   - Create PR with summary of all updates:

     ```
     gh pr create --title "chore(deps): update dependencies" --body "
     ## Updated packages
     - package1: v1.0.0 -> v1.1.0
     - package2: v2.0.0 -> v2.1.0

     ## Skipped packages (breaking changes)
     - package3: requires manual migration

     ## Test plan
     - [x] All CI checks pass
     - [ ] Manual smoke test
     "
     ```

## Usage

```
/update-deps
```

This will check for outdated dependencies and update them one by one with test verification.
