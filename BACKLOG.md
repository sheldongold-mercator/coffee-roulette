# Coffee Roulette - Backlog

This file tracks feature requests, enhancements, and bugs to be addressed.

## Status Legend
- [ ] Not started
- [x] Completed
- [~] In progress

---

## High Priority

### 2. Log Communications in User Details
- [~] **Type:** Bug
- **Description:** When emails are sent to users (welcome, matching, etc.), there is no log visible in their View Details page. Add a communications history tab/section.
- **Location:** `frontend/src/components/users/UserDetailModal.jsx`, `backend/src/controllers/`
- **Issues Found:**
  - Welcome emails are not appearing in the Comms tab at all
  - Need to verify logWelcomeEmail is being called and data is being saved to notification_queue table

### 20. Duplicate Pairing Notifications in Comms Tab
- [x] **Type:** Bug
- **Description:** In the Comms tab of the User Details screen, Pairing Notification emails appear twice, whereas the department added/welcome email only appears once. Investigate and fix duplicate entries.
- **Location:** `frontend/src/components/users/UserDetailModal.jsx`, `backend/src/` (notification logging)
- **Completed:** Pairing notifications now use `channel='both'` which creates a single entry displayed as "Email & Teams". Verified in logs: new notifications (IDs 5,6) created with channel='both'. Old data may still show separate Email/Teams entries but new notifications are correct.

### 21. Welcome Email for Users Synced to Active Department
- [x] **Type:** Enhancement
- **Description:** When a new user is synced from Microsoft and their department is already active, they should immediately receive the Welcome Email and be auto-opted-in (with grace period). Currently this may only happen when a department is first enabled.
- **Location:** `backend/src/jobs/dailyUserSync.js`, `backend/src/services/`
- **Completed:** Already implemented in adminUserController.syncUsers - new users in active departments are auto-opted-in with opted_in_at set and receive welcome emails immediately. Grace period applies (skip_grace_period defaults to false).

---

## Medium Priority

### 10. Fix Send Email Link in Portal
- [x] **Type:** Bug
- **Description:** The "Send Email" link in the user Portal opens a web browser but doesn't properly trigger the email client with subject and recipient address pre-filled.
- **Location:** `frontend/src/components/portal/PartnerCard.jsx`
- **Completed:** Added proper URL encoding with encodeURIComponent and a pre-filled email body with personalized greeting

### 11. Reminder Notifications for Pending Pairings
- [x] **Type:** Enhancement
- **Description:** In the View Details modal from Matching history, add ability to trigger reminder notifications for pending pairings. This should also happen automatically every week until the next matching round. Notifications should direct users to the portal to confirm meeting and leave feedback.
- **Location:** `backend/src/jobs/`, `frontend/src/components/matching/MatchingRoundModal.jsx`
- **Completed:** Added "Send Reminders" button in MatchingRoundModal for manual triggering, created weekly cron job (Mondays 9AM) that automatically sends reminders for all pending pairings, added sendRemindersForPendingPairings method to notificationService

### 12. Notify Partner When Meeting Confirmed
- [x] **Type:** Enhancement
- **Description:** When one person in a pairing clicks "We Had Our Coffee", the other person should be notified and given a link to provide their own feedback.
- **Location:** `backend/src/controllers/userController.js`, `backend/src/services/notificationService.js`
- **Completed:** Added notifyPartnerMeetingConfirmed method to notificationService that queues a feedback_request notification to the partner when meeting is confirmed. Updated confirmMeeting endpoint to call this method.

### 33. Department-Level Analytics Breakdown
- [x] **Type:** Feature
- **Description:** Add department-level analytics to the Analytics page showing metrics broken down by department: participation rates, meeting completion rates, average feedback scores, and cross-department connection counts per department.
- **Location:** `frontend/src/pages/Analytics.jsx`, `backend/src/services/analyticsService.js`, `backend/src/controllers/adminAnalyticsController.js`
- **Completed:** Added getDepartmentBreakdown method to analyticsService that computes per-department: participation rate, completion rate, cross-dept connections, avg feedback rating. Created new API endpoint /departments/breakdown. Added Department Analytics Breakdown table to Analytics page with color-coded badges for participation and completion rates.

### 34. User Satisfaction Trends Over Time
- [x] **Type:** Feature
- **Description:** Add a time-series chart to the Analytics page showing user satisfaction trends over time based on meeting feedback ratings. Include options to filter by time period (last 3 months, 6 months, year).
- **Location:** `frontend/src/pages/Analytics.jsx`, `backend/src/services/analyticsService.js`, `backend/src/controllers/adminAnalyticsController.js`
- **Completed:** Added getSatisfactionTrends method to analyticsService that aggregates feedback ratings by month. Created new API endpoint /trends/satisfaction with months parameter. Added User Satisfaction Trends line chart to Analytics page with time period selector (3/6/12 months) showing average rating and response count over time.

### 35. Bulk User Management
- [x] **Type:** Feature
- **Description:** Add ability to select multiple users on the Users page and perform batch actions: bulk opt-in, bulk opt-out, bulk send welcome email, bulk set available from date. Include select all/none and filter-aware selection.
- **Location:** `frontend/src/pages/Users.jsx`, `backend/src/controllers/adminUserController.js`
- **Completed:** Added comprehensive bulk user management:
  - Backend: New `/api/admin/users/bulk` endpoint supporting opt_in, opt_out, send_welcome_email, and set_available_from actions
  - Frontend: Checkbox selection column in users table with select all/none
  - Bulk action bar appears when users selected with 4 actions: Opt In (skips grace period), Opt Out, Send Welcome Email, Set Available From
  - Date picker modal for setting availability dates with option to clear
  - Selected rows are highlighted, shows count of selected users

### 38. Matching Exclusion Rules
- [ ] **Type:** Feature
- **Description:** Allow admins to define exclusion rules preventing certain users from being paired together (e.g., manager/direct report, users who had conflicts). Add UI in User Details modal to manage exclusions and enforce in matching algorithm.
- **Location:** `backend/src/services/matchingService.js`, `backend/src/models/`, `frontend/src/components/users/UserDetailModal.jsx`

### 39. Icebreaker Questions in Pairing Notifications
- [x] **Type:** Enhancement
- **Description:** Include a random icebreaker question in the pairing notification emails and Teams messages to give participants a conversation starter for their coffee meeting.
- **Location:** `backend/src/templates/`, `backend/src/services/notificationService.js`
- **Completed:** Already implemented - matchingService.assignIcebreakers() assigns 3 random icebreakers to each pairing, which are then included in both email templates (pairing_notification, meeting_reminder) and Teams adaptive cards.

### 41. Auto-Schedule Meeting from Calendar Availability
- [ ] **Type:** Feature
- **Description:** When a pairing is created, use Microsoft Graph API to find the next mutually available calendar slot for both participants and automatically create a calendar event with meeting details and icebreaker suggestion.
- **Location:** `backend/src/services/`, `backend/src/config/graphClient.js`

### 42. Preview and Edit Templates Before Sending
- [ ] **Type:** Feature
- **Description:** Before admin actions that trigger notifications (department activation, matching round initiation, bulk welcome emails, etc.), show which email/Teams template will be used with a preview. Provide a link or inline option to edit the template before confirming the action. This gives admins visibility into what users will receive and the opportunity to customize messaging before sending.
- **Location:** `frontend/src/pages/Departments.jsx`, `frontend/src/pages/Matching.jsx`, `frontend/src/components/matching/ManualMatchingModal.jsx`, `frontend/src/components/templates/`

---

## Lower Priority

### 26. Users Page Not Refreshing After Department Activation
- [x] **Type:** Bug
- **Description:** When a Department is activated, the Users screen does not automatically update to show the new Participation status for users in that department. Currently requires a manual page refresh. Should use React Query invalidation to refresh user data after department enable.
- **Location:** `frontend/src/pages/Departments.jsx`, `frontend/src/pages/Users.jsx`
- **Completed:** Added `queryClient.invalidateQueries('users')` to toggleMutation onSuccess in Departments.jsx to refresh Users page when department status changes

### 30. Update Schedule Dates After Match Runs
- [x] **Type:** Bug
- **Description:** After a scheduled matching round runs, the next run date/time should automatically update to the next occurrence based on the schedule frequency (weekly, bi-weekly, monthly). Currently the dates may not be advancing correctly after a match completes.
- **Location:** `backend/src/jobs/`, `backend/src/services/scheduleService.js`
- **Completed:** Fixed getScheduleConfig to use stored cron expression instead of defaulting to presets. Next run date now correctly advances to the next month/week based on the custom schedule.

### 31. Scheduled Matches Not Running (CRITICAL)
- [x] **Type:** Bug (Critical)
- **Description:** The automatic matching scheduled via the Matching Schedule does not appear to actually execute matches. Investigate the cron job, verify it's being triggered at the scheduled time, and ensure it calls the matching service correctly. Use ULTRATHINK for thorough investigation.
- **Location:** `backend/src/jobs/`, `backend/src/services/scheduleService.js`, `backend/src/services/matchingService.js`
- **Completed:** Fixed two issues: (1) calculateCronFromSchedule now converts UTC times to target timezone before extracting cron components, (2) getScheduleConfig now uses stored cron expression instead of presets. Verified scheduled job executed successfully and created matching round 8.

### 36. Admin Notification When Scheduled Match Runs
- [x] **Type:** Enhancement
- **Description:** Send an email or Teams notification to admin users when a scheduled matching round executes, including summary of pairings created, any users who couldn't be matched, and link to view the round details.
- **Location:** `backend/src/jobs/`, `backend/src/services/notificationService.js`
- **Completed:** Added notifyAdminsMatchingComplete method to notificationService that sends email to all admin users with round summary (round name, participants, pairings, unpaired user if any). Created admin_matching_complete.js email template. Updated monthlyMatching job to call the notification method after successful matching.

### 37. Pairing History Search/Filter
- [x] **Type:** Enhancement
- **Description:** Add search and filter capabilities to the Matching History on the Matching page. Allow filtering by date range, status (completed/pending), and searching by participant name.
- **Location:** `frontend/src/pages/Matching.jsx`, `backend/src/controllers/adminMatchingController.js`
- **Completed:** Added backend support for dateFrom, dateTo, and search query params in getMatchingRounds. Frontend Matching.jsx now has a collapsible filter panel with search by participant name, status filter, and date range filters. Filter badge shows count of active filters.

### 40. Mobile-Responsive Portal Improvements
- [x] **Type:** Enhancement
- **Description:** Improve the mobile responsiveness of the user portal pages (PortalHome, Profile, PairingHistory). Ensure cards, buttons, and forms are properly sized and usable on mobile devices.
- **Location:** `frontend/src/pages/portal/`, `frontend/src/components/portal/`
- **Completed:** Added comprehensive responsive improvements across all portal pages and components:
  - PortalHome: Responsive text sizes, hidden decorative blob on mobile, stacking meeting banner elements
  - PairingHistory: Responsive stat cards, improved timeline card layout with stacking status badges
  - Profile: Responsive profile card, status section, and schedule break form
  - PartnerCard: Stacking email/Teams buttons on mobile, responsive avatar sizing, text truncation
  - FeedbackForm: Improved modal sizing, larger touch targets for star ratings
  - EmptyState: Responsive sizing for all elements

---

## Completed

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

---

## Notes

- Use `feature-dev` skill for complex features
- Always use ULTRATHINK for implementation
- Test changes in both admin and portal interfaces
- Restart PM2 after backend changes: `pm2 restart coffee-roulette`
- Build frontend after changes: `cd frontend && npm run build`
