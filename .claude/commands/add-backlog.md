---
argument-hint: [brief description]
description: Add a new item to the project backlog
---

# Add Backlog Item

Help me add a new item to the project backlog at @BACKLOG.md

The user wants to add: $ARGUMENTS

## Your Task

Step through this process interactively using AskUserQuestion to gather all needed information before adding the item.

### Step 1: Gather Information

Ask the user for the following details (you can ask multiple in one question set):

1. **Type** - What type of item is this?
   - Bug (something broken)
   - Enhancement (improvement to existing feature)
   - Feature (new functionality)
   - Bug/Verification (needs investigation)

2. **Priority** - Which section should this go in?
   - High Priority (blocking issues, critical bugs, urgent features)
   - Medium Priority (important but not blocking)
   - Lower Priority (nice to have, can wait)

3. **Description** - A clear description of what needs to be done. If $ARGUMENTS was provided, confirm or refine it.

4. **Location** - Which files/areas of the codebase are likely involved? (e.g., `frontend/src/pages/Users.jsx`, `backend/src/controllers/`)

5. **Additional Notes** - Any special instructions, related items, or context?

### Step 2: Determine Item Number

Read the BACKLOG.md file to find the highest existing item number, then use the next number.

### Step 3: Add the Item

Add the new item to the correct priority section in BACKLOG.md following this format:

```markdown
### [NUMBER]. [Title]
- [ ] **Type:** [Bug/Enhancement/Feature/Bug/Verification]
- **Description:** [Clear description of what needs to be done]
- **Location:** `[file/folder paths]`
```

### Important Rules

- Always use the next sequential item number (don't reuse numbers)
- Place the item at the END of the appropriate priority section
- Match the existing formatting style exactly
- Use checkbox `- [ ]` for the Type line (not started)
- Keep descriptions concise but complete
- If the item relates to an existing completed item, note that relationship
