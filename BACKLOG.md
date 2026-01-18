# Coffee Roulette - Backlog

This file tracks feature requests, enhancements, and bugs to be addressed.

## Status Legend
- [ ] Not started
- [x] Completed
- [~] In progress

---

## High Priority

### 2. Log Communications in User Details
- [x] **Type:** Bug
- **Description:** When emails are sent to users (welcome, matching, etc.), there is no log visible in their View Details page. Add a communications history tab/section.
- **Location:** `frontend/src/components/users/UserDetailModal.jsx`, `backend/src/controllers/`
- **Completed:** Fixed notification query in getUserById to use `required: false` on Pairing include and nested User includes. This ensures notifications with NULL pairing_id (like welcome emails) are properly retrieved and displayed in the Comms tab.

### 20. Revert Pairing Notifications to Separate Entries
- [x] **Type:** Enhancement
- **Description:** Revert the pairing notification logging to create separate Email and Teams entries instead of a combined "Email & Teams" entry. The separate logs provide better visibility into which channel was used.
- **Location:** `backend/src/services/notificationService.js`
- **Completed:** Updated all notification queuing methods (queuePairingNotifications, queueReminderNotifications, queueFeedbackNotifications, notifyPartnerMeetingConfirmed, sendRemindersForPendingPairings) to create separate 'email' and 'teams' entries instead of combined 'both' entries. This provides better visibility into which channel was used for each notification.

### 21. Welcome Email for Users Synced to Active Department
- [x] **Type:** Enhancement
- **Description:** When a new user is synced from Microsoft and their department is already active, they should immediately receive the Welcome Email and be auto-opted-in (with grace period). Currently this may only happen when a department is first enabled.
- **Location:** `backend/src/jobs/dailyUserSync.js`, `backend/src/services/`
- **Completed:** Feature was already implemented correctly - welcome emails are sent and logged via logWelcomeEmail(). The display issue in the Comms tab was fixed as part of item #2 (notification query fix). New users synced to active departments will receive welcome emails which now appear correctly in the User Details Comms tab.

---

## Medium Priority

### 10. Fix Send Email Link in Portal
- [x] **Type:** Bug
- **Description:** The "Send Email" link in the user Portal opens a web browser but doesn't properly trigger the email client with subject and recipient address pre-filled.
- **Location:** `frontend/src/components/portal/PartnerCard.jsx`
- **Completed:** Changed the Send Email button from an `<a>` tag to a `<button>` with an onClick handler that uses `window.location.href` for the mailto URL. This approach has better cross-browser compatibility for triggering the email client with pre-filled subject and body.

### 12. Notify Partner When Meeting Confirmed
- [x] **Type:** Enhancement
- **Description:** When one person in a pairing clicks "We Had Our Coffee", the other person should be notified and given a link to provide their own feedback.
- **Location:** `backend/src/controllers/userController.js`, `backend/src/services/notificationService.js`
- **Completed:** Added notifyPartnerMeetingConfirmed method to notificationService that queues a feedback_request notification to the partner when meeting is confirmed. Updated confirmMeeting endpoint to call this method.

### 38. Matching Exclusion Rules
- [ ] **Type:** Feature
- **Description:** Allow admins to define exclusion rules preventing certain users from being paired together (e.g., manager/direct report, users who had conflicts). Add UI in User Details modal to manage exclusions and enforce in matching algorithm.
- **Location:** `backend/src/services/matchingService.js`, `backend/src/models/`, `frontend/src/components/users/UserDetailModal.jsx`

### 39. Icebreaker Questions in Pairing Notifications
- [~] **Type:** Enhancement
- **Description:** Include a random icebreaker question in the pairing notification emails and Teams messages to give participants a conversation starter for their coffee meeting.
- **Location:** `backend/src/templates/`, `backend/src/services/notificationService.js`
- **Issues Found:**
  - Icebreaker questions are not appearing in pairing notification emails or Teams messages at all
  - Need to investigate why icebreakers assigned by matchingService.assignIcebreakers() are not being included in the notifications

### 41. Auto-Schedule Meeting from Calendar Availability
- [ ] **Type:** Feature
- **Description:** When a pairing is created, use Microsoft Graph API to find the next mutually available calendar slot for both participants and automatically create a calendar event with meeting details and icebreaker suggestion.
- **Location:** `backend/src/services/`, `backend/src/config/graphClient.js`

### 42. Preview and Edit Templates Before Sending
- [ ] **Type:** Feature
- **Description:** Before admin actions that trigger notifications (department activation, matching round initiation, bulk welcome emails, etc.), show which email/Teams template will be used with a preview. Provide a link or inline option to edit the template before confirming the action. This gives admins visibility into what users will receive and the opportunity to customize messaging before sending.
- **Location:** `frontend/src/pages/Departments.jsx`, `frontend/src/pages/Matching.jsx`, `frontend/src/components/matching/ManualMatchingModal.jsx`, `frontend/src/components/templates/`

### 43. Users Table Shows Incorrect Total Pairings Count
- [x] **Type:** Bug
- **Description:** The Users table displays an incorrect count for Total Pairings, but the User Details modal shows the correct number. This suggests either the list endpoint returns different/stale data than the detail endpoint, or the frontend table is computing/displaying the value incorrectly.
- **Location:** `frontend/src/pages/Users.jsx`, `backend/src/controllers/adminUserController.js`
- **Completed:** The getUsers endpoint was not returning totalPairings field. Added pairing count query that fetches all pairings for users in the result set and counts them per user (handling both user1_id and user2_id). The count is now included in the API response.

### 45. Matching Preview Shows Stale Data After User Status Changes
- [ ] **Type:** Bug
- **Description:** The matching preview on the /admin/matching page doesn't reflect recent user status changes (opt-in/opt-out, availability, etc.) until the page is manually refreshed. The preview query should invalidate or refetch when relevant user data changes to ensure accurate matching results.
- **Location:** `frontend/src/pages/Matching.jsx`, `frontend/src/components/matching/ManualMatchingModal.jsx`

### 46. Matching History Shows Incorrect Status for Active Rounds
- [ ] **Type:** Bug
- **Description:** The Matching History table on the /admin/matching page displays all rounds as "Completed" even when rounds are still active with pending pairings. The status should show "In Progress" for rounds that have pairings awaiting confirmation/feedback.
- **Location:** `frontend/src/pages/Matching.jsx`, `backend/src/controllers/adminMatchingController.js`

---

## Lower Priority

### 36. Admin Notification When Scheduled Match Runs
- [~] **Type:** Enhancement
- **Description:** Send an email or Teams notification to admin users when a scheduled matching round executes, including summary of pairings created, any users who couldn't be matched, and link to view the round details.
- **Location:** `backend/src/jobs/`, `backend/src/services/notificationService.js`
- **Issues Found:**
  - Admin user (Sheldon) did not receive the notification email when scheduled match ran
  - Notification should also be logged in the admin's User Details Comms tab
  - Same notification email should also be sent when a matching round is triggered manually (not just scheduled)

### 44. Clickable User Names to Open User Details Modal
- [ ] **Type:** Enhancement
- **Description:** Make user names clickable throughout the application (e.g., in Matching View Details modal, Analytics leaderboard, etc.) to open the User Details modal. This provides quick access to user information without navigating to the Users page.
- **Location:** `frontend/src/components/matching/MatchingRoundModal.jsx`, `frontend/src/pages/Analytics.jsx`, `frontend/src/components/users/UserDetailModal.jsx`

---

## Completed

### 26. Users Page Not Refreshing After Department Activation
- [x] **Type:** Bug
- **Completed:** Added `queryClient.invalidateQueries('users')` to toggleMutation onSuccess in Departments.jsx

### 30. Update Schedule Dates After Match Runs
- [x] **Type:** Bug
- **Completed:** Fixed getScheduleConfig to use stored cron expression; next run date now correctly advances based on custom schedule

### 31. Scheduled Matches Not Running (CRITICAL)
- [x] **Type:** Bug (Critical)
- **Completed:** Fixed timezone conversion in calculateCronFromSchedule and getScheduleConfig; scheduled jobs now execute correctly

### 37. Pairing History Search/Filter
- [x] **Type:** Enhancement
- **Completed:** Added backend support for dateFrom, dateTo, and search query params; frontend has collapsible filter panel with search, status, and date range filters

### 40. Mobile-Responsive Portal Improvements
- [x] **Type:** Enhancement
- **Completed:** Added responsive improvements to all portal pages and components (text sizing, button stacking, touch targets, etc.)

### 32. Style Scheduled Source Badge in Matching History
- [x] **Type:** Enhancement
- **Description:** In the Matching History table, when a matching round was created by the scheduled job, the "Scheduled" source text should be styled as a badge similar to the "Manual" source badge, but with a different color to distinguish between the two trigger types.
- **Location:** `frontend/src/pages/Matching.jsx`
- **Completed:** Added `badge-secondary` CSS class (purple) to index.css. Matching.jsx already used this class - now it renders correctly with purple background to distinguish from blue "Manual" badge.

### 1. Department Enable Confirmation Modal
- [x] **Type:** Enhancement
- **Completed:** Modal shows user count, explains emails, opt-in, grace period, and opt-out option

### 4. Remove Separate Profile Nav Item
- [x] **Type:** Enhancement
- **Completed:** Removed Profile from nav array, made user name/avatar in header clickable to navigate to profile

### 6. Close Modal on Save Changes
- [x] **Type:** Bug
- **Completed:** Added `onClose()` to updateMutation onSuccess callback

### 8. Allow Today's Date in Schedule
- [x] **Type:** Bug
- **Completed:** Added improved validation that allows today's date when time is in future, with helpful error messages

### 9. Fix Email Button Colors
- [x] **Type:** Bug
- **Completed:** Added inline styles with `color: #ffffff !important` to all CTA buttons in all 4 email templates

### 17. Participation Status for Unassigned Departments
- [x] **Type:** Bug
- **Completed:** Added frontend logic to override status to "Dept Excluded" when department is N/A

### 18. Update Participation Filter Options
- [x] **Type:** Enhancement
- **Completed:** Updated filter options: added Opted In, Dept Excluded; removed Opted In (Dept Excluded)

### 22. Remove Experience Level Self-Service for Users
- [x] **Type:** Enhancement
- **Completed:** Removed seniority level selection section from Profile page entirely

### 25. Rename Seniority Level Labels
- [x] **Type:** Enhancement
- **Completed:** Updated labels in UserDetailModal and ManualMatchingModal (Apprentice, Practitioner)

### 3. "Count Me In" Bypasses Grace Period
- [x] **Type:** Enhancement
- **Completed:** optIn endpoint sets skip_grace_period=true so users can participate immediately (verified via code)

### 7. Reorder Matching Tab in User Details
- [x] **Type:** Enhancement
- **Completed:** "Opted Into Matching" checkbox moved to top of Admin Overrides section

### 16. Participation Status Logic for Opted-In Users
- [x] **Type:** Bug
- **Completed:** Users ready for matching show 'Opted In' instead of 'Eligible'

### 19. Temporary Opt-Out with Available From Date
- [x] **Type:** Feature
- **Completed:** Portal Profile has "Schedule a Break" section; status shows "Temp Opted Out" when future date set

### 23. Move "How Coffee Roulette Works" Section
- [x] **Type:** Enhancement
- **Completed:** HowItWorks component in EmptyState.jsx shows on Portal Home; Profile page does not have section (verified via code)

### 24. Replace Total Users with Eligible Users on Dashboard
- [x] **Type:** Enhancement
- **Completed:** Dashboard shows "Eligible Users" stat instead of "Total Users"

### 13. View Feedback Details
- [x] **Type:** Enhancement
- **Completed:** Star ratings and feedback visible in Portal history and Admin Matching modal

### 14. Verify Engagement Leaderboard
- [x] **Type:** Bug/Verification
- **Completed:** Leaderboard shows individual users with name, department, and pairing count

### 15. Add Cross-Seniority Connections Panel
- [x] **Type:** Enhancement
- **Completed:** Analytics page has cross-seniority connections panel with pairing stats

### 27. Participation Status Details in User Details Modal
- [x] **Type:** Enhancement
- **Completed:** Status card with badge and dates displayed prominently in User Details modal

### 28. Add "Next Round" Block to Matching Page
- [x] **Type:** Enhancement
- **Completed:** 4th stat card shows "Next Round" date or "Schedule not set"

### 29. Matching Schedule Save Button
- [x] **Type:** Enhancement
- **Completed:** Save/Discard buttons and unsaved changes indicator added to ScheduleConfig

### 5. Auto Opt-In on Department Enable
- [x] **Type:** Bug/Enhancement
- **Completed:** Department enable auto-opts-in users with Grace Period status

### 11. Reminder Notifications for Pending Pairings
- [x] **Type:** Enhancement
- **Completed:** Send Reminders button in MatchingRoundModal, weekly cron job (Mondays 9AM), notificationService method

### 33. Department-Level Analytics Breakdown
- [x] **Type:** Feature
- **Completed:** Department analytics table with participation/completion rates, cross-dept connections, avg feedback rating

### 34. User Satisfaction Trends Over Time
- [x] **Type:** Feature
- **Completed:** Line chart with time period selector (3/6/12 months) showing avg rating and response count

### 35. Bulk User Management
- [x] **Type:** Feature
- **Completed:** Checkbox selection, bulk action bar (Opt In, Opt Out, Send Welcome Email, Set Available From), date picker modal

---

## Notes

- Use `feature-dev` skill for complex features
- Always use ULTRATHINK for implementation
- Test changes in both admin and portal interfaces
- Restart PM2 after backend changes: `pm2 restart coffee-roulette`
- Build frontend after changes: `cd frontend && npm run build`
