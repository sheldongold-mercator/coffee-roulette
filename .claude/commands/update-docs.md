---
description: Review changes and update README.md and CLAUDE.md documentation
---

# Update Project Documentation

You are tasked with reviewing recent changes to the codebase and ensuring README.md and CLAUDE.md are kept up to date. Use ULTRATHINK mode for thorough analysis throughout this process.

## Step 1: Gather Change Information

Run these commands to understand what has changed:

```bash
# Recent commits (last 20)
git log --oneline -20

# Unstaged changes
git diff --stat

# Staged changes
git diff --cached --stat

# Current git status
git status
```

Also read:
- `BACKLOG.md` - Check for recently completed items that may indicate new features
- `CLAUDE.md` - Current state of Claude Code context
- `README.md` - Current state of user documentation

## Step 2: Analyze Changes for Documentation Impact

For each change identified, determine if it affects documentation:

### Changes that REQUIRE documentation updates:
- Tech stack changes (new dependencies, changed services)
- New environment variables
- Database schema changes (new tables, new columns)
- New API endpoints or changed endpoint behavior
- Architecture changes (new services, patterns)
- Changed commands or processes
- New features that change how the system works
- Security-related changes

### Changes that DO NOT require documentation updates:
- Bug fixes that don't change behavior
- UI tweaks and styling changes
- Performance optimizations
- Code refactoring that maintains same behavior
- Test additions
- Minor text/label changes

## Step 3: CLAUDE.md Guidelines

CLAUDE.md is for **Claude Code context** - information that helps Claude work effectively on the codebase. Follow these strict guidelines:

### INCLUDE in CLAUDE.md:
- Project overview (brief, 2-3 sentences max)
- Tech stack (runtime, framework, database, key libraries)
- Project structure (directory layout, file naming conventions)
- Key commands (dev, build, test, deploy)
- Coding conventions (naming, patterns, style)
- Database tables and key fields (especially non-obvious ones)
- Authentication/authorization approach
- Environment variables required
- Important architectural patterns
- Common gotchas and pitfalls
- File locations that are frequently needed

### DO NOT include in CLAUDE.md:
- Detailed feature descriptions (use README.md)
- Step-by-step setup instructions (use README.md)
- API endpoint documentation (use README.md)
- User-facing documentation
- Marketing or overview content
- Exhaustive lists of every feature
- Information easily discoverable from code
- Historical context or changelog items
- Screenshots or visual documentation

### CLAUDE.md Quality Checks:
- Is every item **actionable** for Claude when coding?
- Would removing this item make Claude's work harder?
- Is this information **not obvious** from reading the code?
- Is it **stable** (not changing frequently)?

## Step 4: README.md Guidelines

README.md is for **humans** - developers, administrators, and stakeholders who need to understand, set up, or use the project.

### INCLUDE in README.md:
- Project overview and purpose
- Complete tech stack
- Prerequisites and system requirements
- Step-by-step setup instructions
- Configuration options and environment variables
- API documentation
- Feature descriptions
- Deployment instructions
- Troubleshooting guide
- Security considerations
- Contributing guidelines

### When updating README.md:
- Keep setup instructions accurate and tested
- Update configuration tables when settings change
- Document new features comprehensively
- Update API endpoints when they change
- Ensure examples work with current code

## Step 5: Make Updates

For each documentation file that needs updates:

1. Read the current file completely
2. Identify specific sections that need changes
3. Make minimal, targeted edits (don't rewrite entire sections unnecessarily)
4. Ensure consistency in style and formatting
5. Verify technical accuracy against the actual code

## Step 6: Verification

After making updates:

1. Re-read both files to ensure coherence
2. Verify any commands or paths mentioned are correct
3. Check that environment variables match actual usage
4. Ensure no contradictions between CLAUDE.md and README.md

## Step 7: Summary

Provide a summary of:
- Changes reviewed (commits, unstaged changes, backlog items)
- Documentation updates made (with specific sections)
- Documentation confirmed as already current (no changes needed)
- Any items flagged for future documentation (if code is still in progress)

---

## Important Reminders

- **Use ULTRATHINK** for thorough analysis of each change
- **Be conservative** - only document stable, committed patterns
- **CLAUDE.md is for Claude** - focus on what helps with coding tasks
- **README.md is for humans** - focus on understanding and using the project
- **Don't duplicate** - if something is well-documented in one file, reference it don't copy it
- **Verify accuracy** - check code to confirm documentation matches reality
- **Maintain style** - match existing formatting and tone in each file

Begin by running the git commands to understand recent changes.
