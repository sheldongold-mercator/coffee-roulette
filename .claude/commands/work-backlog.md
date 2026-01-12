# Work Through Backlog

You are tasked with systematically working through the project backlog. Work autonomously through all items - UI testing and verification will be handled separately via the `/test-backlog` command.

## Step 1: Read and Analyze the Backlog

Read the `/var/www/coffee-roulette/BACKLOG.md` file to understand all pending items.

## Step 2: Identify Incomplete Items

Find all items marked as:
- `- [ ]` - Not started
- `- [~]` - In progress (may have partial work or known issues)

## Step 3: Prioritize and Order Items

Determine the optimal order by considering:

1. **Priority Level** - High priority items first (check the section headers in BACKLOG.md)
2. **Dependencies** - Items that other items depend on should be done first
3. **Complexity** - Mix complex and simple items to maintain momentum
4. **Related Changes** - Group items that touch the same files/components
5. **Critical Bugs** - Any critical bugs should be addressed immediately

Present the numbered list of items in the order you'll tackle them, then begin working.

## Step 4: Work Through Items

For each item:

1. **Use TodoWrite** to track progress throughout
2. **Use ULTRATHINK** for all implementations - thorough analysis before coding
3. **Use the feature-dev skill** for complex features that need:
   - Codebase exploration
   - Architecture decisions
   - Multiple file changes
   - UI/UX considerations
4. **Follow existing patterns** in the codebase
5. **Test changes** appropriately:
   - Backend: Restart PM2 (`pm2 restart coffee-roulette`)
   - Frontend: Build (`cd /var/www/coffee-roulette/frontend && npm run build`)
6. **Update BACKLOG.md** after completing each item with a "Completed:" note
7. **Commit changes** if the user requests (don't commit automatically)

## Step 5: Handle Blockers

If you encounter a blocker:
- For ambiguous requirements: Make a reasonable decision based on context, document your choice in the completion note
- For technical issues: Document the issue and attempt alternative approaches
- For items needing credentials/access: Skip and note the blocker

## Step 6: Summary

After completing the session, provide a summary:
- Items completed
- Items partially completed (with status)
- Items skipped (with reason)
- Recommended next steps
- Any issues or concerns discovered

Remind the user they can run `/test-backlog` to verify completed items in the browser.

---

## Important Reminders

- **Work autonomously** - UI/browser testing is handled separately via `/test-backlog`
- **Never skip builds/restarts** - always verify backend restarts and frontend builds succeed
- **Always update BACKLOG.md** with completion notes
- **Use TodoWrite** to maintain visibility into progress
- **Prefer editing existing files** over creating new ones
- **Follow the project's coding conventions** (see CLAUDE.md)

Begin by reading the BACKLOG.md file now.
