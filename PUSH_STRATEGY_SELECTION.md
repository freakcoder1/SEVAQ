# Push Strategy Selection Guide

## Decision Framework

Choosing the right push strategy depends on several factors:

### 1. Repository Ownership
- **Your repository** → Direct push to branches
- **Someone else's repository** → Fork + Pull Request workflow

### 2. Your Access Level
- **Write access** → Direct push
- **Read-only access** → Fork + PR required

### 3. Fix Criticality
- **Critical production fixes** → Hotfix branch + immediate push
- **Feature development** → Feature branches + PR
- **Experimental changes** → Experimental branches

## Strategy Options

### Option 1: Direct Push (Recommended for Your Own Repos)

**When to use:**
- You own the repository
- You have write access
- Quick fixes needed
- Team collaboration with trust

**Steps:**
```bash
# 1. Ensure you're on the right branch
git checkout main  # or develop, or your target branch

# 2. Create a descriptive feature/fix branch
git checkout -b fix/login-validation-issue

# 3. Make your changes and test them
# (Make your code changes here)

# 4. Stage and commit
git add .
git commit -m "Fix: resolve login validation issue

- Validate user credentials properly
- Handle edge cases for empty inputs
- Add proper error messages

Fixes: #123"

# 5. Push directly to remote
git push origin fix/login-validation-issue

# 6. If PR needed, create it via GitHub web interface or CLI
gh pr create --title "Fix login validation" --body "See PR description" --base main --head fix/login-validation-issue
```

**Pros:**
- Fast and simple
- Direct control
- No fork maintenance

**Cons:**
- Requires write access
- Less formal review process

### Option 2: Fork + Pull Request (Recommended for Contributing)

**When to use:**
- Contributing to open source
- No direct write access
- Formal review required
- Large or complex changes

**Steps:**
```bash
# 1. Fork the repository on GitHub (web interface)

# 2. Clone your fork locally
git clone https://github.com/YOUR_USERNAME/repository.git
cd repository

# 3. Add original repository as upstream
git remote add upstream https://github.com/ORIGINAL_OWNER/repository.git

# 4. Keep your fork up to date
git checkout main
git pull upstream main

# 5. Create feature branch from main
git checkout -b fix/your-fix-description

# 6. Make your changes and test
# (Make your code changes here)

# 7. Stage and commit
git add .
git commit -m "Fix: [descriptive title]

[Detailed explanation]

Fixes: #issue-number"

# 8. Push to your fork
git push origin fix/your-fix-description

# 9. Create Pull Request
# Option A: Using GitHub CLI
gh pr create \
  --title "Fix: [brief title]" \
  --body "[Detailed description]" \
  --base main \
  --head fix/your-fix-description \
  --reviewer @team-member

# Option B: Using GitHub web interface
# Navigate to your fork on GitHub and click "Compare & pull request"
```

**Pros:**
- Formal review process
- No special access needed
- Fork is your playground

**Cons:**
- More steps
- Need to keep fork updated
- Slower process

### Option 3: Hotfix Emergency Workflow

**When to use:**
- Production-critical bugs
- Security vulnerabilities
- Data loss issues

**Steps:**
```bash
# 1. Immediately create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/urgent-fix-123

# 2. Apply critical fix
# (Make your emergency changes)

# 3. Test thoroughly
# (Run all critical tests)

# 4. Commit with urgency marker
git add .
git commit -m "Hotfix: [critical description]

[Urgent fix details]

Fixes: #123
Severity: Critical"

# 5. Push immediately
git push origin hotfix/urgent-fix-123

# 6. Create PR with high priority
gh pr create \
  --title "Hotfix: [critical issue]" \
  --body "**URGENT**: This fixes a critical production issue\n\n[Details]" \
  --base main \
  --head hotfix/urgent-fix-123 \
  --label "hotfix, priority:critical"

# 7. Notify team immediately
# (Slack, email, etc.)
```

## Access Level Decision Tree

```
Do you have write access to the repository?
  ├─ Yes → Do you own the repository?
  │        ├─ Yes → Direct push (Option 1)
  │        └─ No  → Direct push (Option 1) [if team policy allows]
  └─ No  → Fork + PR workflow (Option 2)
```

## Repository Type Decision Matrix

| Repository Type | Access Level | Fix Type | Recommended Strategy |
|-----------------|--------------|----------|---------------------|
| Personal/Own    | Write        | Any      | Direct Push (Option 1) |
| Team/Shared     | Write        | Any      | Direct Push (Option 1) |
| Team/Shared     | Read-only    | Any      | Fork + PR (Option 2) |
| Open Source     | None         | Any      | Fork + PR (Option 2) |
| Production Fix  | Any          | Critical | Hotfix + Direct Push (Option 3) |

## Verification Checklist Before Push

### Before Direct Push
- [ ] Git status is clean or changes are intentional
- [ ] Branch name follows naming conventions
- [ ] Commit messages are descriptive
- [ ] Tests pass locally
- [ ] Remote URL is correct

### Before Fork + PR
- [ ] Fork is up to date with upstream
- [ ] Branch is based on latest main/develop
- [ ] PR description is clear and complete
- [ ] Screenshots/demos included (if applicable)
- [ ] Related issues referenced

## Common Scenarios

### Scenario 1: Fixing a Bug in Your Project
```bash
# You own the project and have write access
git checkout -b fix/bug-description
git add .
git commit -m "Fix: [description]"
git push origin fix/bug-description
# Create PR if team requires review
```

### Scenario 2: Contributing to Open Source
```bash
# Fork on GitHub first, then:
git clone https://github.com/YOUR/fork.git
git remote add upstream https://github.com/ORIGINAL/repo.git
git checkout -b fix/issue-description
git add .
git commit -m "Fix: [description]"
git push origin fix/issue-description
# Create PR on GitHub
```

### Scenario 3: Emergency Production Fix
```bash
# Critical fix - act fast
git checkout main && git pull
git checkout -b hotfix/emergency-fix
git add .
git commit -m "Hotfix: [critical description]"
git push origin hotfix/emergency-fix
# Immediately notify team and create high-priority PR
```

## Post-Push Actions

### After Direct Push
- Monitor CI/CD pipeline
- Verify tests pass
- Deploy if automatic
- Notify team if needed

### After Fork + PR
- Respond to review comments
- Update PR if requested changes
- Ensure CI/CD passes
- Merge when approved

## Troubleshooting Push Issues

### Push Rejected
```bash
# Pull latest changes and rebase
git pull --rebase origin main
git push origin fix/branch-name
```

### Authentication Failed
```bash
# Check remote URL
git remote -v

# Update credentials if needed
git remote set-url origin https://github.com/username/repo.git
```

### Force Push Needed (Use with Caution)
```bash
# Only use if you're sure
git push --force origin fix/branch-name
```

## Best Practices Summary

1. **Always create a branch** - Never push directly to main/develop
2. **Descriptive commit messages** - Explain what and why
3. **Test before pushing** - Ensure code quality
4. **Keep branches focused** - One issue per branch
5. **Update regularly** - Keep your branch/main up to date
6. **Document changes** - Update relevant documentation
7. **Follow team conventions** - Adhere to project standards