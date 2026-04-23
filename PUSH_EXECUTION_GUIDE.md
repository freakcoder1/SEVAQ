# Push Execution Guide

## Final Push Execution Steps

This guide provides the exact commands to execute when you're ready to push your local fixes to GitHub.

## Pre-Execution Verification

Before executing any push commands, verify the following:

### 1. Check Git Status
```bash
cd /path/to/your/repository
git status
```
**Expected output:** Clean working directory or only staged changes ready to commit

### 2. Verify Remote Configuration
```bash
git remote -v
```
**Expected output:**
```
origin  https://github.com/username/repository.git (fetch)
origin  https://github.com/username/repository.git (push)
```

### 3. Review Your Changes
```bash
# View staged changes
git diff --cached

# View unstaged changes
git diff

# View commit history
git log --oneline -5
```

## Execution Commands by Strategy

### Strategy 1: Direct Push (Your Repository)

#### Step-by-Step Commands

```bash
# 1. Navigate to repository
cd /path/to/your/repository

# 2. Ensure you're on the correct base branch
git checkout main  # or develop, or your target branch

# 3. Pull latest changes to avoid conflicts
git pull origin main

# 4. Create a descriptive branch name
# Format: fix/issue-description or feature/feature-name
git checkout -b fix/login-validation-issue

# 5. Stage your changes
git add .

# 6. Verify what's staged
git status

# 7. Commit with a descriptive message
git commit -m "Fix: resolve login validation issue

- Validate user credentials properly
- Handle edge cases for empty inputs  
- Add proper error messages for invalid credentials

Fixes: #123"

# 8. Push to remote repository
git push origin fix/login-validation-issue

# 9. Verify push was successful
git log --oneline -3
```

#### Expected Output
```
[main 1234567] Fix: resolve login validation issue
 3 files changed, 45 insertions(+), 12 deletions(-)
Enumerating objects: 15, done.
Counting objects: 100% (15/15), done.
Delta compression using up to 8 threads
Compressing objects: 100% (10/10), done.
Writing objects: 100% (12/12), 1.23 KiB | 1.23 MiB/s, done.
Total 12 (delta 5), reused 0 (delta 0)
To https://github.com/username/repository.git
 * [new branch]      fix/login-validation-issue -> fix/login-validation-issue
```

#### After Push - Create PR
```bash
# Option A: Using GitHub CLI
gh pr create \
  --title "Fix: login validation issue" \
  --body "This PR fixes the login validation issue described in #123.\n\n- Properly validates user credentials\n- Handles edge cases\n- Adds appropriate error messages" \
  --base main \
  --head fix/login-validation-issue \
  --reviewer @team-member

# Option B: Manual via web interface
# 1. Navigate to repository on GitHub
# 2. Click "Compare & pull request" button
# 3. Fill in PR details
# 4. Submit for review
```

### Strategy 2: Fork + Pull Request

#### Step-by-Step Commands

```bash
# 1. Navigate to your fork
cd /path/to/your/fork

# 2. Ensure fork is up to date with upstream
git checkout main
git pull upstream main

# 3. Create feature branch
git checkout -b fix/issue-description

# 4. Make your changes
# (Your code changes go here)

# 5. Stage changes
git add .

# 6. Commit with proper message
git commit -m "Fix: [descriptive title]

[Detailed explanation of the fix]

Fixes: #issue-number"

# 7. Push to your fork
git push origin fix/issue-description

# 8. Create Pull Request
# Using GitHub CLI:
gh pr create \
  --title "Fix: [brief title]" \
  --body "[Detailed description]" \
  --base main \
  --head fix/issue-description \
  --reviewer @team-member

# Or manually via GitHub web interface:
# 1. Navigate to your fork on GitHub
# 2. Click green "Compare & pull request" button
# 3. Verify base is main and head is your branch
# 4. Fill in PR title and description
# 5. Click "Create pull request"
```

### Strategy 3: Hotfix Emergency Workflow

#### Step-by-Step Commands

```bash
# 1. Immediately switch to main and pull latest
git checkout main
git pull origin main

# 2. Create hotfix branch
git checkout -b hotfix/urgent-fix-123

# 3. Apply critical fix
# (Make emergency changes)

# 4. Stage and commit
git add .
git commit -m "Hotfix: [critical description]

[Urgent fix details]

Fixes: #123
Severity: Critical"

# 5. Push immediately
git push origin hotfix/urgent-fix-123

# 6. Create high-priority PR
gh pr create \
  --title "Hotfix: [critical issue]" \
  --body "**URGENT**: This fixes a critical production issue\n\n[Details]" \
  --base main \
  --head hotfix/urgent-fix-123 \
  --label "hotfix, priority:critical"

# 7. Notify team immediately
# Send Slack/email notification
```

## Common Commands Reference

### Information Commands
```bash
git status                    # Check working directory state
git log --oneline -5          # View recent commits
git diff                      # View unstaged changes
git diff --cached             # View staged changes
git branch -vv                # View branch status
```

### Branch Management
```bash
git checkout -b fix/name      # Create and switch branch
git checkout main             # Switch to main branch
git merge fix/name            # Merge branch into current
git branch -d fix/name        # Delete branch
```

### Remote Operations
```bash
git remote -v                 # Show remotes
git fetch                     # Download changes
git pull origin main          # Fetch and merge
git push origin fix/name      # Upload changes
```

## Post-Push Actions

### After Direct Push
```bash
# 1. Verify push succeeded
git log --oneline -3

# 2. Check CI/CD status
# (Monitor GitHub Actions/GitLab CI)

# 3. Verify tests pass in PR
# (Check PR status checks)

# 4. Request reviews if needed
gh pr edit <pr-number> --add-reviewer @reviewer
```

### After Fork + PR
```bash
# 1. Monitor PR for feedback
# (Check GitHub notifications)

# 2. Address review comments
# (Make changes, commit, push)
git add .
git commit -m "Address review comments"
git push origin fix/issue-description

# 3. Update PR if requested
# (Edit PR description or add screenshots)

# 4. Merge when approved
# (Via GitHub web interface or CLI)
gh pr merge <pr-number> --squash
```

## Troubleshooting

### Push Rejected
```bash
# Pull with rebase to maintain clean history
git pull --rebase origin main
git push origin fix/branch-name
```

### Force Push Needed
```bash
# WARNING: Only use if you're certain
git push --force origin fix/branch-name
```

### Authentication Issues
```bash
# Check remote URL
git remote -v

# Update credentials
git remote set-url origin https://github.com/username/repo.git

# Configure credential helper
git config --global credential.helper cache
```

## Quick Reference Card

```bash
# Most common workflow
cd /repo
git checkout -b fix/my-fix
git add .
git commit -m "Fix: description"
git push origin fix/my-fix
gh pr create --title "Fix: description" --base main --head fix/my-fix

# Emergency hotfix
git checkout main && git pull
git checkout -b hotfix/urgent
git add .
git commit -m "Hotfix: description"
git push origin hotfix/urgent
gh pr create --title "Hotfix: description" --base main --head hotfix/urgent --label "hotfix"
```

## Next Steps

1. **Choose your strategy** (direct push or fork + PR)
2. **Execute the commands** above
3. **Monitor the push** for success/failure
4. **Create PR if required**
5. **Address any feedback**
6. **Merge when approved**

## Verification Checklist

- [ ] Push completed successfully
- [ ] PR created (if required)
- [ ] CI/CD tests passing
- [ ] Reviewers notified
- [ ] Feedback addressed
- [ ] PR merged
- [ ] Changes deployed