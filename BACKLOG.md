# Coffee Roulette - Backlog

This file tracks feature requests, enhancements, and bugs to be addressed.

## Status Legend
- [ ] Not started
- [x] Completed
- [~] In progress

---

## High Priority

### 1. Department Enable Confirmation Modal
- [x] **Type:** Enhancement
- **Description:** When an admin enables a department, show a confirmation modal explaining what will happen (all users will be sent welcome emails, auto-opted in, etc.)
- **Location:** `frontend/src/pages/Departments.jsx`
- **Completed:** Modal shows user count, explains emails, opt-in, grace period, and opt-out option

### 2. Log Communications in User Details
- [ ] **Type:** Bug
- **Description:** When emails are sent to users (welcome, matching, etc.), there is no log visible in their View Details page. Add a communications history tab/section.
- **Location:** `frontend/src/components/users/UserDetailModal.jsx`, `backend/src/controllers/`

### 3. "Count Me In" Bypasses Grace Period
- [ ] **Type:** Enhancement
- **Description:** When a user visits the Portal from an email link and clicks "Count Me In", the 48-hour grace period should be overwritten so they can participate in the next matching round immediately.
- **Location:** `frontend/src/pages/portal/`, `backend/src/controllers/userController.js`

### 4. Remove Separate Profile Nav Item
- [x] **Type:** Enhancement
- **Description:** Remove the separate "Profile" navigation item in the Portal. Instead, users should access their profile by clicking their name in the top right corner.
- **Location:** `frontend/src/` (portal layout/navigation)
- **Completed:** Removed Profile from nav array, made user name/avatar in header clickable to navigate to profile

### 5. Auto Opt-In on Department Enable
- [ ] **Type:** Bug/Enhancement
- **Description:** When departments are enabled and welcome emails are sent, all users in that department should be automatically opted in and enter the grace period. Verify this is working correctly.
- **Location:** `backend/src/controllers/adminDepartmentController.js`, `backend/src/services/`

### 6. Close Modal on Save Changes
- [x] **Type:** Bug
- **Description:** When a user clicks "Save Changes" on the User Details modal in admin, the modal should automatically close.
- **Location:** `frontend/src/components/users/UserDetailModal.jsx`
- **Completed:** Added `onClose()` to updateMutation onSuccess callback

### 7. Reorder Matching Tab in User Details
- [x] **Type:** Enhancement
- **Description:** The "Opted into matching" checkbox in the User Details modal should be at the top of the Admin Overrides section on the Matching tab.
- **Location:** `frontend/src/components/users/UserDetailModal.jsx`
- **Completed:** Moved "Opted into Matching" checkbox to the top of Admin Overrides section in Matching tab with descriptive helper text

### 16. Participation Status Logic for Opted-In Users
- [ ] **Type:** Bug
- **Description:** On the Users page, the Participation status should show "Opted-In" for users that have opted-in manually, passed their Grace Period, or had their Grace Period skipped. Currently may not reflect all these cases correctly.
- **Location:** `frontend/src/pages/Users.jsx`, `backend/src/controllers/adminUserController.js`

### 17. Participation Status for Unassigned Departments
- [ ] **Type:** Bug
- **Description:** On the Users page, users whose departments are N/A (unassigned) should show "Dept Excluded" as their Participation status instead of other statuses.
- **Location:** `frontend/src/pages/Users.jsx`

### 18. Update Participation Filter Options
- [ ] **Type:** Enhancement
- **Description:** The Participation filter on the Users page should include all possible Participation tag options. Add "Dept Excluded" and remove "Opted in (Dept Excluded)" which doesn't make sense. Ensure filter options match actual status tags.
- **Location:** `frontend/src/pages/Users.jsx`

### 19. Temporary Opt-Out with Available From Date
- [ ] **Type:** Feature
- **Description:** Users should be able to temporarily opt out by setting an "Available from" date in their Portal Profile. When set to a future date, their Participation status should show "Temp Opted Out" instead of "Opted Out". Status returns to previous state when date is reached. This should also be editable in the Admin User Details modal. Add "Temp Opted Out" to the Participation filter.
- **Location:** `frontend/src/pages/portal/Profile.jsx`, `frontend/src/components/users/UserDetailModal.jsx`, `backend/src/controllers/userController.js`

### 20. Duplicate Pairing Notifications in Comms Tab
- [ ] **Type:** Bug
- **Description:** In the Comms tab of the User Details screen, Pairing Notification emails appear twice, whereas the department added/welcome email only appears once. Investigate and fix duplicate entries.
- **Location:** `frontend/src/components/users/UserDetailModal.jsx`, `backend/src/` (notification logging)

### 21. Welcome Email for Users Synced to Active Department
- [ ] **Type:** Enhancement
- **Description:** When a new user is synced from Microsoft and their department is already active, they should immediately receive the Welcome Email and be auto-opted-in (with grace period). Currently this may only happen when a department is first enabled.
- **Location:** `backend/src/jobs/dailyUserSync.js`, `backend/src/services/`

---

## Medium Priority

### 8. Allow Today's Date in Schedule
- [x] **Type:** Bug
- **Description:** In the Matching Schedule screen, users cannot select today's date. The validation should allow today's date as long as the time is later than the current time.
- **Location:** `frontend/src/components/matching/ScheduleConfig.jsx`
- **Completed:** Added improved validation that allows today's date when time is in future, with helpful error messages

### 9. Fix Email Button Colors
- [x] **Type:** Bug
- **Description:** In both the department welcome email and matching email, the main CTA button has blue background with blue text, making it hard to read. Change text to white.
- **Location:** `backend/src/templates/emails/`
- **Completed:** Added inline styles with `color: #ffffff !important` to all CTA buttons in all 4 email templates (welcome, pairing_notification, feedback_request, meeting_reminder)

### 10. Fix Send Email Link in Portal
- [x] **Type:** Bug
- **Description:** The "Send Email" link in the user Portal opens a web browser but doesn't properly trigger the email client with subject and recipient address pre-filled.
- **Location:** `frontend/src/components/portal/PartnerCard.jsx`
- **Completed:** Added proper URL encoding with encodeURIComponent and a pre-filled email body with personalized greeting

### 11. Reminder Notifications for Pending Pairings
- [ ] **Type:** Enhancement
- **Description:** In the View Details modal from Matching history, add ability to trigger reminder notifications for pending pairings. This should also happen automatically every week until the next matching round. Notifications should direct users to the portal to confirm meeting and leave feedback.
- **Location:** `backend/src/jobs/`, `frontend/src/components/matching/MatchingRoundModal.jsx`

### 12. Notify Partner When Meeting Confirmed
- [ ] **Type:** Enhancement
- **Description:** When one person in a pairing clicks "We Had Our Coffee", the other person should be notified and given a link to provide their own feedback.
- **Location:** `backend/src/controllers/userController.js`, `backend/src/services/notificationService.js`

### 22. Remove Experience Level Self-Service for Users
- [ ] **Type:** Enhancement
- **Description:** Non-admin users should not be able to set their own Experience Level (seniority) in the Portal. This should only be editable by admins in the User Details modal.
- **Location:** `frontend/src/pages/portal/Profile.jsx`

### 23. Move "How Coffee Roulette Works" Section
- [ ] **Type:** Enhancement
- **Description:** Remove the "How Coffee Roulette Works" section from the Profile page in the Portal. Add this information to the card on the Portal Home page instead.
- **Location:** `frontend/src/pages/portal/Profile.jsx`, `frontend/src/pages/portal/PortalHome.jsx`

### 24. Replace Total Users with Eligible Users on Dashboard
- [ ] **Type:** Enhancement
- **Description:** On the admin Dashboard page, replace the "Total Users" stat with "Eligible Users" (users who are opted-in, past grace period, and in active departments).
- **Location:** `frontend/src/pages/Dashboard.jsx`, `backend/src/controllers/adminAnalyticsController.js`

---

## Lower Priority

### 13. View Feedback Details
- [ ] **Type:** Enhancement
- **Description:**
  - In the Portal history page, add option to view details showing feedback from both parties
  - In Admin Matching history View Details modal, show ratings and feedback provided by users
- **Location:** `frontend/src/pages/portal/PairingHistory.jsx`, `frontend/src/components/matching/MatchingRoundModal.jsx`

### 14. Verify Engagement Leaderboard
- [ ] **Type:** Bug/Verification
- **Description:** In the analytics dashboard, the Engagement Leaderboard shows "1 Pairings". Verify this is calculating correctly - may be correct after only one pairing, but needs verification.
- **Location:** `backend/src/controllers/adminAnalyticsController.js`, `frontend/src/pages/Dashboard.jsx`

### 15. Add Cross-Seniority Connections Panel
- [ ] **Type:** Enhancement
- **Description:** In the analytics dashboard, there is a panel for cross-department connections. Add a similar panel for cross-seniority connections.
- **Location:** `backend/src/controllers/adminAnalyticsController.js`, `frontend/src/pages/Dashboard.jsx`

### 25. Rename Seniority Level Labels
- [ ] **Type:** Enhancement
- **Description:** In the User Details modal Seniority Level dropdown, rename "Junior" to "Apprentice" and "Mid-Level" to "Practitioner". Update both frontend labels and backend enum values if needed.
- **Location:** `frontend/src/components/users/UserDetailModal.jsx`, `backend/src/models/User.js`

---

## Completed

_Items will be moved here when completed._

---

## Notes

- Use `feature-dev` skill for complex features
- Always use ULTRATHINK for implementation
- Test changes in both admin and portal interfaces
- Restart PM2 after backend changes: `pm2 restart coffee-roulette`
- Build frontend after changes: `cd frontend && npm run build`
