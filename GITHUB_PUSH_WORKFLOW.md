# GitHub Push Workflow for Local Fixes

## Quick Reference Guide

This guide provides a concise workflow for pushing local fixes to GitHub repositories.

## Pre-Push Checklist

- [ ] Verify all changes are tested locally
- [ ] Ensure code follows project conventions
- [ ] Check for any sensitive data in changes
- [ ] Review git status
- [ ] Confirm remote repository URL

## Common Git Workflows

### Workflow 1: Direct Push (Personal Projects)

```bash
# 1. Check current state
git status
git log --oneline -5

# 2. Create feature branch
git checkout -b fix/issue-description

# 3. Make and stage changes
git add .
git status

# 4. Commit with proper message
git commit -m "Fix: [description]

[Detailed explanation]

Fixes: #issue-number"

# 5. Push to remote
git push origin fix/issue-description

# 6. Create PR on GitHub
# Navigate to repository and create pull request
```

### Workflow 2: Fork Workflow (Contributing to Others' Repos)

```bash
# 1. Fork repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/repository.git
cd repository

# 3. Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/repository.git

# 4. Create feature branch
git checkout -b fix/issue-description

# 5. Make and stage changes
git add .
git status

# 6. Commit changes
git commit -m "Fix: [description]

[Detailed explanation]

Fixes: #issue-number"

# 7. Push to your fork
git push origin fix/issue-description

# 8. Create PR from your fork to original repository
```

### Workflow 3: Hotfix to Main Branch

```bash
# 1. Ensure you're on main branch and it's up to date
git checkout main
git pull origin main

# 2. Create hotfix branch
git checkout -b hotfix/urgent-fix

# 3. Make and commit changes
git add .
git commit -m "Hotfix: [urgent description]

[Detailed explanation]

Fixes: #issue-number"

# 4. Push and create PR
git push origin hotfix/urgent-fix
```

## Push Commands Reference

### Basic Push
```bash
git push origin branch-name
```

### Push with Force (Use with Caution!)
```bash
# Only use if you're sure about overwriting
git push --force origin branch-name
```

### Push with Rebase
```bash
# Keep history linear
git push --rebase origin branch-name
```

### Push Multiple Branches
```bash
git push origin branch1 branch2 branch3
```

## Conflict Resolution

### Before Push
```bash
# Pull latest changes
git pull origin main

# If conflicts occur, resolve them manually
# Then stage resolved files
git add path/to/resolved-file

# Continue with merge
git commit
git push origin branch-name
```

### After Push Rejection
```bash
# If push is rejected due to non-fast-forward
git pull --rebase origin main
git push origin branch-name
```

## Verification Steps

After pushing, verify:

1. **PR Created**: Check GitHub for new pull request
2. **CI/CD Status**: Verify automated tests pass
3. **Reviewers**: Request reviews from team members
4. **Merge**: Monitor merge status
5. **Deployment**: Verify changes are deployed correctly

## Troubleshooting

### Issue: "Permission denied (publickey)"
**Solution**: Check SSH key configuration
```bash
ssh -T git@github.com
```

### Issue: "Authentication failed"
**Solution**: Use HTTPS with credentials or configure credential helper
```bash
git config --global credential.helper cache
```

### Issue: "Everything up-to-date" but changes not pushed
**Solution**: Check if you're on correct branch
```bash
git branch -vv
git status
```

### Issue: Large files rejected
**Solution**: Use Git LFS or remove large files
```bash
# Install Git LFS
git lfs install
git lfs track "*.largefile"
git add .gitattributes
```

## Best Practices

### Commit Messages
- Use present tense: "Fix bug" not "Fixed bug"
- Keep subject under 50 characters
- Use body for detailed explanation
- Reference issues: "Fixes #123"

### Branch Naming
- Prefix with type: `fix/`, `feature/`, `hotfix/`, `chore/`
- Include issue number when applicable
- Use lowercase and hyphens: `fix/login-validation-123`

### Code Review
- Keep PRs small and focused
- Include screenshots for UI changes
- Document breaking changes
- Update relevant documentation

## Security Guidelines

- Never commit credentials or API keys
- Use environment variables for sensitive data
- Review all changes before pushing
- Use signed commits for critical changes
- Regularly update dependencies

## Automation

### Git Hooks
```bash
# .git/hooks/pre-commit
#!/bin/bash
npm test
```

### CI/CD Integration
- GitHub Actions
- GitLab CI
- Jenkins
- CircleCI

## Related Commands

### Information Commands
- `git status` - Working directory state
- `git log` - Commit history
- `git diff` - Unstaged changes
- `git diff --cached` - Staged changes

### Branch Commands
- `git branch` - List branches
- `git checkout -b <name>` - Create and switch
- `git merge <branch>` - Merge branch
- `git branch -d <branch>` - Delete branch

### Remote Commands
- `git remote -v` - Show remotes
- `git fetch` - Download changes
- `git pull` - Fetch and merge
- `git push` - Upload changes