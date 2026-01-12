---
argument-hint: [commit message (optional)]
description: Commit all changes and push to GitHub
---

Commit and push all current changes to GitHub.

Steps:
1. Run `git status` to see all modified and untracked files
2. Run `git diff` to understand what changed
3. Run `git log --oneline -3` to see recent commit style
4. Stage all relevant files (exclude .env files, secrets, and build artifacts)
5. Create a descriptive commit message following the project's conventional commit style (feat:, fix:, docs:, etc.)
6. If argument provided, use it as the commit message: $ARGUMENTS
7. Push to the current branch

Important:
- Never commit .env files, credentials, or secrets
- Never commit node_modules, build folders, or .screenshots
- Use conventional commit format (feat:, fix:, docs:, chore:, refactor:)
- Include Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com> in commit message
