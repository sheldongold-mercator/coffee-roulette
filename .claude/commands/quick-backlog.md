---
argument-hint: [list of issues]
description: Quickly add multiple items to the backlog from a bulleted list
---

# Quick Backlog Entry

Help me quickly add multiple items to the project backlog at @BACKLOG.md

The user's issues: $ARGUMENTS

## Your Task

This is a streamlined backlog entry process. The user provides a quick list of issues and you assess and categorize them automatically.

### Step 1: Get the Issues

If $ARGUMENTS is empty or unclear, ask the user to provide a bulleted list of issues they've found. They can be brief - you'll flesh them out.

Example input:
```
- Users page shows wrong status after opt-in
- Need a button to export analytics data
- Profile page crashes when no department assigned
```

### Step 2: Analyze and Categorize

For each issue, determine:

1. **Type** - Based on the description:
   - Bug: Something broken, crashes, wrong behavior, errors
   - Enhancement: Improvement to existing feature, UX tweaks, better handling
   - Feature: New functionality that doesn't exist yet
   - Bug/Verification: Unclear if bug or expected behavior, needs investigation

2. **Priority** - Based on severity and impact:
   - High Priority: Crashes, data issues, blocking workflows, security concerns
   - Medium Priority: Incorrect behavior, missing validation, UX problems
   - Lower Priority: Nice-to-have, cosmetic issues, minor improvements

3. **Location** - Infer from the description:
   - Frontend pages: `frontend/src/pages/`
   - Frontend components: `frontend/src/components/`
   - Backend controllers: `backend/src/controllers/`
   - Backend services: `backend/src/services/`
   - Backend jobs: `backend/src/jobs/`

4. **Title** - Create a clear, concise title from the description

### Step 3: Present for Confirmation

Show the user your categorization in a summary table before adding:

| # | Title | Type | Priority | Location |
|---|-------|------|----------|----------|
| 32 | Fix Status Display After Opt-In | Bug | High | frontend/src/pages/Users.jsx |
| 33 | Add Analytics Export Button | Feature | Medium | frontend/src/pages/Analytics.jsx |

Ask if they want to proceed or adjust any categorizations.

### Step 4: Determine Item Numbers

Read the BACKLOG.md file to find the highest existing item number, then assign sequential numbers starting from there.

### Step 5: Add All Items

Add each item to BACKLOG.md in the correct priority section using this format:

```markdown
### [NUMBER]. [Title]
- [ ] **Type:** [Bug/Enhancement/Feature/Bug/Verification]
- **Description:** [Clear description of what needs to be done]
- **Location:** `[file/folder paths]`
```

### Important Rules

- Always use sequential item numbers (don't reuse numbers from completed items)
- Place items at the END of their respective priority sections
- Match the existing formatting style exactly
- Use checkbox `- [ ]` for the Type line (not started)
- Keep descriptions concise but complete
- If an item clearly relates to an existing backlog item, note that relationship
- Group related issues together in the same priority section when possible
