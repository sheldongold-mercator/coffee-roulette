# Test Completed Backlog Items

You are tasked with testing completed backlog items one-by-one and gathering user feedback. Follow this process carefully.

## Step 1: Read and Identify Completed Items

Read the `/var/www/coffee-roulette/BACKLOG.md` file and identify items marked as `[x]` (completed) that are NOT yet in the `## Completed` section at the bottom of the file.

These are items that have been implemented but need user verification before being officially marked as done.

## Step 2: Create Testing Queue

For each completed item found, prepare:
1. A clear description of what to test
2. Step-by-step testing instructions
3. Expected behavior
4. A link to the relevant page/URL if applicable (e.g., `/admin/users`, `/portal/profile`)

## Step 3: Test Items One-by-One

For EACH completed item, present the test to the user using this format:

```
## Test #[NUMBER]: [ITEM TITLE]

**What to test:**
[Brief description of the feature/fix]

**Steps:**
1. [Step 1]
2. [Step 2]
...

**Expected behavior:**
[What should happen if working correctly]

**Link:** [URL path if applicable]
```

Then use **AskUserQuestion** to get feedback with these FOUR options:

1. **Working correctly** - The feature works as expected
2. **Has issues** - Something is wrong (will ask for details)
3. **Can't test (verify via code)** - User cannot test this; Claude should attempt to verify by reading the relevant code files
4. **Can't test now (skip)** - User cannot test right now; leave item for future testing session

## Step 4: Handle Each Response

### If "Working correctly":
- Move the item to the `## Completed` section of BACKLOG.md
- Remove it from its original location
- Keep a condensed version with just Type and Completed note

### If "Has issues":
- Ask follow-up questions to understand the specific issue
- Check for screenshots in `.screenshots/` folder if user mentions them
- Update the item in BACKLOG.md:
  - Change status from `[x]` to `[~]` (in progress)
  - Add an `**Issues Found:**` section with bullet points describing the problems
  - Remove the `**Completed:**` line
- **DO NOT attempt to fix the issue** - just document it and move to the next item
- The fix will be addressed in a separate `/work-backlog` session
- Continue to the next item immediately after updating BACKLOG.md

### If "Can't test (verify via code)":
- Attempt to verify the implementation by:
  - Reading the relevant source files mentioned in the item's Location
  - Checking that the described changes are present in the code
  - Looking for obvious issues or missing implementations
- If code looks correct: Report findings and ask user if they want to mark as verified
- If code has issues: Update the item with issues found, change to `[~]`

### If "Can't test now (skip)":
- Leave the item exactly as-is (keep `[x]` status)
- Move to the next item
- This item will appear in the next test session

## Step 5: Continue Until Complete

After handling each item, immediately proceed to the next completed item. Continue until all completed items have been tested.

## Step 6: Summary

After all items have been reviewed, provide a summary:

```
## Testing Session Summary

### Verified & Moved to Completed ([X] items)
- #[N] - [Title]
...

### Issues Found - Needs Rework ([X] items)
- #[N] - [Title]: [Brief issue description]
...

### Verified via Code ([X] items)
- #[N] - [Title]
...

### Skipped for Future Testing ([X] items)
- #[N] - [Title]
...
```

---

## Important Reminders

- **Always use AskUserQuestion** for each item - don't batch them
- **Provide clear test instructions** with URLs/paths where possible
- **Update BACKLOG.md immediately** after each item is reviewed
- **Ask follow-up questions** when user reports issues - get specific details
- **When verifying via code**, read the actual files and check for the implementation
- **Keep the Completed section organized** - use condensed format for moved items

Begin by reading the BACKLOG.md file now.
