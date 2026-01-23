# Coffee Roulette - Backlog

This file tracks feature requests, enhancements, and bugs to be addressed.

## Status Legend
- [ ] Not started
- [x] Completed
- [~] In progress

---

## High Priority

### 48. SECURITY: Remove JWT Secret Fallback Default
- [ ] **Type:** Security (Critical)
- **Description:** Both `passport.js` and `jwt.js` have fallback JWT secrets (`'your-secret-key-change-in-production'`). If `JWT_SECRET` env var is not set, the app uses this default instead of failing. Attackers who know this string can forge valid JWT tokens. Remove all fallback defaults and require explicit environment variable, throwing error at startup if not configured.
- **Location:** `backend/src/config/passport.js`, `backend/src/utils/jwt.js`
- **Note:** Use ULTRATHINK when implementing

### 49. SECURITY: Add Rate Limiting to Public Opt-Out Endpoints
- [ ] **Type:** Security (Critical)
- **Description:** The `/api/public/opt-out/:token`, `/api/public/opt-in/:token`, and `/api/public/status/:token` endpoints have no rate limiting. Attackers can enumerate valid user tokens through brute force. Add strict rate limiting (max 3-5 attempts per IP per day), add CAPTCHA after failed attempts, log all access attempts, and consider token expiration.
- **Location:** `backend/src/routes/public.js`, `backend/src/middleware/`
- **Note:** Use ULTRATHINK when implementing

### 50. SECURITY: Fix Iframe Sandbox and innerHTML XSS Risks
- [ ] **Type:** Security (High)
- **Description:** Email template previews use `sandbox="allow-same-origin"` which is too permissive - allows iframe to access parent window. Also, `innerHTML` is used with error messages in TemplatePreview.jsx which could lead to XSS. Change sandbox to `sandbox=""` (fully restricted), replace `innerHTML` with `textContent` for error messages.
- **Location:** `frontend/src/components/templates/TemplatePreview.jsx`, `frontend/src/components/templates/TemplatePreviewConfirmModal.jsx`
- **Note:** Use ULTRATHINK when implementing

### 51. SECURITY: Migrate JWT from localStorage to Secure Storage
- [ ] **Type:** Security (High)
- **Description:** JWT tokens stored in `localStorage` are vulnerable to XSS attacks. Migrate to httpOnly cookies (requires backend coordination) or implement strict CSP headers to mitigate XSS. Add token expiration validation on each API call.
- **Location:** `frontend/src/contexts/AuthContext.jsx`, `frontend/src/services/api.js`, `backend/src/middleware/`
- **Note:** Use ULTRATHINK when implementing

### 52. SECURITY: Add Input Validation Whitelist for Sort/Search Parameters
- [ ] **Type:** Security (High)
- **Description:** Sort parameters (`sortBy`, `sortOrder`) are passed directly to Sequelize without whitelist validation. Implement strict whitelist of allowed sort columns (id, created_at, email, first_name, last_name). Also add max length validation (100 chars) to search parameters to prevent ReDoS/database DoS.
- **Location:** `backend/src/controllers/adminUserController.js`, `backend/src/controllers/adminMatchingController.js`
- **Note:** Use ULTRATHINK when implementing

### 20. Revert Pairing Notifications to Separate Entries
- [~] **Type:** Enhancement
- **Description:** Revert the pairing notification logging to create separate Email and Teams entries instead of a combined "Email & Teams" entry. The separate logs provide better visibility into which channel was used.
- **Location:** `backend/src/services/notificationService.js`
- **Issues Found:**
  - Only one channel (Email or Teams) is showing in the Comms tab, not both
  - Need to verify that both 'email' and 'teams' entries are being created and displayed

### 21. Welcome Email for Users Synced to Active Department
- [~] **Type:** Enhancement
- **Description:** When a new user is synced from Microsoft and their department is already active, they should immediately receive the Welcome Email and be auto-opted-in (with grace period). Currently this may only happen when a department is first enabled.
- **Location:** `backend/src/jobs/dailyUserSync.js`, `backend/src/services/`
- **Issues Found:**
  - Users receive the welcome email but do NOT receive a Teams message
  - Need to add Teams notification to the welcome flow for new synced users

---

## Medium Priority

### 10. Fix Send Email Link in Portal
- [x] **Type:** Bug
- **Description:** The "Send Email" link in the user Portal opens a web browser but doesn't properly trigger the email client with subject and recipient address pre-filled.
- **Location:** `frontend/src/components/portal/PartnerCard.jsx`
- **Completed:** Changed the Send Email button from an `<a>` tag to a `<button>` with an onClick handler that uses `window.location.href` for the mailto URL. This approach has better cross-browser compatibility for triggering the email client with pre-filled subject and body.

### 12. Notify Partner When Meeting Confirmed
- [~] **Type:** Enhancement
- **Description:** When one person in a pairing clicks "We Had Our Coffee", the other person should be notified and given a link to provide their own feedback.
- **Location:** `backend/src/controllers/userController.js`, `backend/src/services/notificationService.js`
- **Issues Found:**
  - Needs testing to verify notifications are sent
  - Ensure feedback_request notifications appear in Comms tab of User Details modal

### 38. Matching Exclusion Rules
- [x] **Type:** Feature
- **Description:** Allow admins to define exclusion rules preventing certain users from being paired together (e.g., manager/direct report, users who had conflicts). Add UI in User Details modal to manage exclusions and enforce in matching algorithm.
- **Location:** `backend/src/services/matchingService.js`, `backend/src/models/`, `frontend/src/components/users/UserDetailModal.jsx`
- **Completed:** Added MatchingExclusion model with bidirectional user pair storage (smaller ID first to avoid duplicates). Created adminExclusionController with CRUD operations. Added routes under /api/admin/users/:userId/exclusions. Updated matchingService.generatePairings() to load exclusions as a Set and skip excluded pairs during matching. Frontend UserDetailModal has new "Exclusions" tab with user search, add/remove functionality, and info note explaining bidirectional behavior.

### 39. Icebreaker Questions in Pairing Notifications
- [x] **Type:** Enhancement
- **Description:** Include a random icebreaker question in the pairing notification emails and Teams messages to give participants a conversation starter for their coffee meeting.
- **Location:** `backend/src/templates/`, `backend/src/services/notificationService.js`
- **Completed:** Fixed template to handle empty icebreakers array gracefully - icebreaker section is now conditional and only displays when icebreakers exist. Added defensive array handling in the email template. Added logging in notificationService.sendNotification to track icebreaker data for debugging. The notification flow is correctly set up - icebreakers are assigned in matchingService.assignIcebreakers(), included in processPendingNotifications query, and passed to templates. If icebreakers still don't appear, verify active icebreaker_topics exist in the database.

### 41. Auto-Schedule Meeting from Calendar Availability
- [ ] **Type:** Feature
- **Description:** When a pairing is created, use Microsoft Graph API to find the next mutually available calendar slot for both participants and automatically create a calendar event with meeting details and icebreaker suggestion.
- **Location:** `backend/src/services/`, `backend/src/config/graphClient.js`

### 53. SECURITY: Add CSRF Protection and Sanitize API Errors
- [ ] **Type:** Security (Medium)
- **Description:** No CSRF token handling for state-changing requests. Also, API errors expose backend infrastructure details to users. Implement CSRF token handling in axios interceptors, coordinate with backend for token validation, and sanitize error responses to return generic messages in production.
- **Location:** `frontend/src/services/api.js`, `backend/src/middleware/`, `backend/src/app.js`
- **Note:** Use ULTRATHINK when implementing

### 54. SECURITY: Remove Sensitive Console Logging
- [ ] **Type:** Security (Medium)
- **Description:** Extensive console logging includes user emails, authentication flow details, and account information that could be exploited. Remove or gate all console.log statements behind environment checks (only in development). Audit AuthContext.jsx and App.js specifically.
- **Location:** `frontend/src/contexts/AuthContext.jsx`, `frontend/src/App.js`
- **Note:** Use ULTRATHINK when implementing

### 55. SECURITY: Add Template HTML Sanitization
- [ ] **Type:** Security (Medium)
- **Description:** Email template HTML is stored directly without sanitization. Compromised or malicious admins could inject XSS payloads in emails. Implement HTML sanitization library (DOMPurify), validate that HTML only contains safe tags.
- **Location:** `backend/src/controllers/adminTemplateController.js`
- **Note:** Use ULTRATHINK when implementing

### 56. SECURITY: Implement Content Security Policy Headers
- [ ] **Type:** Security (Medium)
- **Description:** No CSP headers configured. Add CSP headers to restrict script sources to self and Microsoft OAuth endpoints, review frame-src and connect-src policies. Also add HSTS, X-Content-Type-Options, and verify Helmet configuration.
- **Location:** `backend/src/app.js`
- **Note:** Use ULTRATHINK when implementing

### 57. SECURITY: Add Audit Logging for Data Exports
- [ ] **Type:** Security (Medium)
- **Description:** Admin users can export all user data via CSV without audit tracking. Add audit logging for all data exports (who, what, when), implement data masking for sensitive fields in exports.
- **Location:** `backend/src/controllers/adminAnalyticsController.js`
- **Note:** Use ULTRATHINK when implementing

### 58. PERFORMANCE: Fix N+1 Queries in Analytics
- [ ] **Type:** Performance (High)
- **Description:** `getEngagementLeaderboard()` fetches all active users, then makes a separate `Pairing.count()` query for each user. With 200+ users, this creates 200+ database queries. `getDepartmentBreakdown()` has similar issues. Use single aggregated queries with `sequelize.fn('COUNT')` and `group by`.
- **Location:** `backend/src/services/analyticsService.js`
- **Note:** Use ULTRATHINK when implementing

### 59. REFACTOR: Extract Notification Queueing Utility
- [ ] **Type:** Code Quality (High)
- **Description:** Four nearly identical methods (`queuePairingNotifications`, `queueReminderNotifications`, `queueFeedbackNotifications`, `sendRemindersForPendingPairings`) all loop through user pairs and queue email/teams notifications separately. Extract a generic `queueNotificationsForUsers` utility function.
- **Location:** `backend/src/services/notificationService.js`
- **Note:** Use ULTRATHINK when implementing

### 60. REFACTOR: Create API Response Extraction Utility
- [ ] **Type:** Code Quality (High)
- **Description:** Multiple components duplicate the same axios response wrapper extraction logic (checking `.data?.data`, `.data`, etc.) 50+ times across the codebase. Create a utility function `extractApiData(response)` to normalize API responses.
- **Location:** `frontend/src/services/api.js`, `frontend/src/pages/*.jsx`
- **Note:** Use ULTRATHINK when implementing

### 61. REFACTOR: Split UserDetailModal into Sub-Components
- [ ] **Type:** Code Quality (High)
- **Description:** UserDetailModal is 1039 lines handling 6 tabs with 70+ state variables. Extract into smaller sub-components: UserProfileTab, UserMatchingTab, UserNotesTab, UserHistoryTab, UserCommunicationsTab, UserExclusionsTab.
- **Location:** `frontend/src/components/users/UserDetailModal.jsx`
- **Note:** Use ULTRATHINK when implementing

### 62. PERFORMANCE: Add Database Indexes for Common Queries
- [ ] **Type:** Performance (High)
- **Description:** Queries filter by `microsoft_id`, `email`, `department_id`, `matching_round_id`, `pairing_id`, `user1_id`, `user2_id` without index optimization. Add database migration to create indexes on frequently queried columns.
- **Location:** `backend/src/models/`, database migrations
- **Note:** Use ULTRATHINK when implementing

### 63. Add Error Boundaries to Prevent App Crashes
- [ ] **Type:** Code Quality (High)
- **Description:** No error boundary components exist. If any component throws an error, it crashes the entire app. Create ErrorBoundary.jsx component and wrap page-level components. Add fallback UI for component failures.
- **Location:** `frontend/src/components/`, `frontend/src/App.js`
- **Note:** Use ULTRATHINK when implementing

### 76. User Details Modal Closes Parent Modal on Interaction
- [ ] **Type:** Bug
- **Description:** When viewing a matching round details modal and clicking a user name to open the User Details modal, any interaction with the User Details modal causes both modals to close. Expected behavior: User Details modal should be fully interactive as a stacked modal, and when closed should return to the Matching Round modal. This is likely caused by click event propagation or the backdrop click handler on the parent modal capturing clicks meant for the child modal.
- **Location:** `frontend/src/components/matching/MatchingRoundModal.jsx`, `frontend/src/components/users/UserDetailModal.jsx`
- **Note:** Use ULTRATHINK when implementing

### 77. Participation Trends Graph Not Displaying Data
- [ ] **Type:** Bug
- **Description:** On the /admin/dashboard screen, the Participation Trends graph is not showing any graphed details/lines. This could be caused by: (1) the API not returning trend data correctly, (2) the frontend not properly mapping the data to the chart component, or (3) the data format not matching what Recharts expects. Investigate both the API response and how the data is being passed to the AreaChart/LineChart component.
- **Location:** `frontend/src/pages/Dashboard.jsx`, `backend/src/services/analyticsService.js`, `backend/src/controllers/adminAnalyticsController.js`
- **Note:** Use ULTRATHINK when implementing

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
- [x] **Type:** Bug
- **Description:** The matching preview on the /admin/matching page doesn't reflect recent user status changes (opt-in/opt-out, availability, etc.) until the page is manually refreshed. The preview query should invalidate or refetch when relevant user data changes to ensure accurate matching results.
- **Location:** `frontend/src/pages/Matching.jsx`, `frontend/src/components/matching/ManualMatchingModal.jsx`
- **Completed:** Made the matching preview query always fetch fresh data by setting staleTime: 0 and cacheTime: 0, and added useEffect to invalidate the query when preview is toggled on. Also made the eligible count query refetch more frequently (30s staleTime, refetchOnWindowFocus).

### 46. Matching History Shows Incorrect Status for Active Rounds
- [x] **Type:** Bug
- **Description:** The Matching History table on the /admin/matching page displays all rounds as "Completed" even when rounds are still active with pending pairings. The status should show "In Progress" for rounds that have pairings awaiting confirmation/feedback.
- **Location:** `frontend/src/pages/Matching.jsx`, `backend/src/controllers/adminMatchingController.js`
- **Completed:** Fixed two issues: (1) Backend now computes effective status based on pairing completion - if any pairings have 'pending' or 'confirmed' status, the round shows as 'in_progress'. (2) Frontend was hardcoding "Completed" badge - now displays actual status from API (in_progress, scheduled, failed, completed).

### 80. Portal Home Page Not Showing Pending Pairings
- [ ] **Type:** Bug
- **Description:** When a user has pending/incomplete pairings (visible in the History page), the Portal Home page incorrectly displays the "waiting for next match" empty state instead of showing the active pairing(s). The Home page should display all incomplete/pending matches so users can take action on them.
- **Location:** `frontend/src/pages/portal/PortalHome.jsx`, `backend/src/controllers/userController.js`
- **Note:** Use ULTRATHINK when implementing

---

## Lower Priority

### 64. REFACTOR: Extract Status Badge Configuration
- [ ] **Type:** Code Quality (Medium)
- **Description:** Status badge configurations (colors, labels, icons) for participation status, notification status, and matching status are duplicated across UserDetailModal.jsx, Users.jsx, and Matching.jsx. Create shared config file `frontend/src/config/statusConfig.js`.
- **Location:** `frontend/src/components/users/UserDetailModal.jsx`, `frontend/src/pages/Users.jsx`, `frontend/src/pages/Matching.jsx`
- **Note:** Use ULTRATHINK when implementing

### 65. PERFORMANCE: Add React.memo and useMemo for Memoization
- [ ] **Type:** Performance (Medium)
- **Description:** Components receiving frequently-changing props (pairings arrays, stats) lack `React.memo` and re-render unnecessarily. Memoize StatCard, PartnerCard, FeedbackForm components. Use `useMemo` for expensive derived data in Analytics charts.
- **Location:** `frontend/src/pages/Dashboard.jsx`, `frontend/src/components/portal/PartnerCard.jsx`, `frontend/src/pages/Analytics.jsx`
- **Note:** Use ULTRATHINK when implementing

### 66. Fix useEffect Dependency Issues
- [ ] **Type:** Code Quality (High)
- **Description:** Several useEffect hooks have missing or incorrect dependencies: App.js effect runs once but calls `msalInstance.initialize()` without it in deps; ScheduleConfig.jsx has 4 overlapping useEffects with potential infinite loops; AuthContext has incomplete deps. Audit and fix all useEffect dependencies.
- **Location:** `frontend/src/App.js`, `frontend/src/contexts/AuthContext.jsx`, `frontend/src/components/matching/ScheduleConfig.jsx`
- **Note:** Use ULTRATHINK when implementing

### 67. ACCESSIBILITY: Add ARIA Labels and Keyboard Navigation
- [ ] **Type:** Accessibility (Medium)
- **Description:** Missing `aria-label` on icon-only buttons (email, Teams chat), table selections lack `aria-selected`, modals lack `role="dialog"`, toggle switches need proper ARIA. Also add keyboard navigation (Enter/Space) for clickable table rows and modal navigation.
- **Location:** `frontend/src/components/portal/PartnerCard.jsx`, `frontend/src/pages/Users.jsx`, `frontend/src/components/matching/ScheduleConfig.jsx`
- **Note:** Use ULTRATHINK when implementing

### 68. REFACTOR: Consolidate Participation Status Logic
- [ ] **Type:** Code Quality (Medium)
- **Description:** Identical logic to calculate participation status (opted in, grace period, excluded, etc.) is duplicated in Users.jsx and UserDetailModal.jsx. Extract to shared utility `utils/participationStatus.js`.
- **Location:** `frontend/src/pages/Users.jsx`, `frontend/src/components/users/UserDetailModal.jsx`
- **Note:** Use ULTRATHINK when implementing

### 69. REFACTOR: Create React Query Key Factory
- [ ] **Type:** Code Quality (Medium)
- **Description:** Inconsistent React Query cache strategies - some queries use `staleTime: 0`, others default 5min. Manual cache invalidations scattered. Create `queryKeys.js` factory for consistent query key management and cache strategies.
- **Location:** `frontend/src/pages/*.jsx`, `frontend/src/services/`
- **Note:** Use ULTRATHINK when implementing

### 70. BACKEND: Improve Error Handling in Sync and Bulk Operations
- [ ] **Type:** Code Quality (Medium)
- **Description:** In `syncUsers()` and `bulkAction()`, errors in welcome email sending are caught but flow continues silently. Accumulate errors and return detailed error report showing which users succeeded/failed with reasons.
- **Location:** `backend/src/controllers/adminUserController.js`
- **Note:** Use ULTRATHINK when implementing

### 71. BACKEND: Refactor runMatchingAlgorithm into Smaller Methods
- [ ] **Type:** Code Quality (Medium)
- **Description:** `runMatchingAlgorithm()` is 195 lines combining eligibility filtering, scoring, VIP handling, and icebreaker assignment. Split into smaller methods: `filterEligibleParticipants()`, `scoreAndPairParticipants()`, `handleOddPersonOut()`.
- **Location:** `backend/src/services/matchingService.js`
- **Note:** Use ULTRATHINK when implementing

### 72. BACKEND: Batch Insert Icebreaker Assignments
- [ ] **Type:** Performance (Medium)
- **Description:** `assignIcebreakers()` creates `PairingIcebreaker` records one per icebreaker in a loop with `await`. Collect all records and do `bulkCreate()` in a single database operation.
- **Location:** `backend/src/services/matchingService.js`
- **Note:** Use ULTRATHINK when implementing

### 73. BACKEND: Standardize Logging Levels and Add Context
- [ ] **Type:** Code Quality (Low)
- **Description:** Inconsistent logging levels - some recoverable errors logged as `warn`, critical ones as `error`. Simple error logs don't show operation context. Establish logging level guidelines and add structured logging with operation context.
- **Location:** `backend/src/services/*.js`, `backend/src/controllers/*.js`
- **Note:** Use ULTRATHINK when implementing

### 74. FRONTEND: Add Unhandled Promise Rejection Handler
- [ ] **Type:** Error Handling (Medium)
- **Description:** No global handler for unhandled promise rejections. API failures in background requests could silently fail. Add global error handler in App.js using `window.addEventListener('unhandledrejection', ...)`.
- **Location:** `frontend/src/App.js`
- **Note:** Use ULTRATHINK when implementing

### 75. FRONTEND: Fix Race Condition in User Search
- [ ] **Type:** Bug (Medium)
- **Description:** User search for exclusions fetches on every keystroke but doesn't cancel previous requests. If slow request completes after newer one, results will be mismatched. Use `AbortController` or React Query's request cancellation.
- **Location:** `frontend/src/components/users/UserDetailModal.jsx`
- **Note:** Use ULTRATHINK when implementing

### 78. User Details Modal Not Closing on Outside Click (Analytics)
- [ ] **Type:** Bug
- **Description:** On the /admin/analytics page, when clicking a user name in the Engagement Leaderboard section, the User Details modal opens but does not close when clicking outside of it. The modal should close on backdrop click.
- **Location:** `frontend/src/pages/Analytics.jsx`
- **Note:** Use ULTRATHINK when implementing

### 79. Restyle Portal to Match Mercator Digital Branding
- [ ] **Type:** Enhancement
- **Description:** Restyle the user portal pages to reflect the style of the Mercator Digital website (https://mercatordigital.com/). Keep all existing page structure and functionality intact - only change colors, typography, and visual styling. Add a subtle nautical theme to align with the Mercator brand. Use the `frontend-design` skill for implementation.
- **Location:** `frontend/src/pages/portal/`, `frontend/src/components/portal/`, `frontend/src/index.css`
- **Note:** Use ULTRATHINK when implementing

### 81. Clickable User Names in Matching Preview
- [ ] **Type:** Enhancement
- **Description:** Make user names in the Matching Preview section of the /admin/matching page clickable to open the User Details modal. This extends the existing clickable user name functionality (completed in #44) to the preview section for consistency.
- **Location:** `frontend/src/pages/Matching.jsx`
- **Note:** Use ULTRATHINK when implementing

### 36. Admin Notification When Scheduled Match Runs
- [x] **Type:** Enhancement
- **Description:** Send an email or Teams notification to admin users when a scheduled matching round executes, including summary of pairings created, any users who couldn't be matched, and link to view the round details.
- **Location:** `backend/src/jobs/`, `backend/src/services/notificationService.js`
- **Completed:** Fixed admin notification logging. Added `logAdminNotification` method to notificationService that logs admin notifications to NotificationQueue (similar to logWelcomeEmail). Updated `notifyAdminsMatchingComplete` to log both successful and failed notification attempts. Added `admin_matching_complete` notification type to frontend UserDetailModal so notifications appear in the Comms tab. Manual matching trigger was already calling notifyAdminsMatchingComplete (verified in adminMatchingController.js:619).

### 44. Clickable User Names to Open User Details Modal
- [x] **Type:** Enhancement
- **Description:** Make user names clickable throughout the application (e.g., in Matching View Details modal, Analytics leaderboard, etc.) to open the User Details modal. This provides quick access to user information without navigating to the Users page.
- **Location:** `frontend/src/components/matching/MatchingRoundModal.jsx`, `frontend/src/pages/Analytics.jsx`, `frontend/src/components/users/UserDetailModal.jsx`
- **Completed:** Updated MatchingRoundModal.jsx to make user names in pairing list clickable (opens UserDetailModal). Updated Analytics.jsx to make user names in engagement leaderboard clickable. Added hover styles (text-primary-600, underline) for visual feedback. Both components now include UserDetailModal with state management for selectedUserId.

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

### 2. Log Communications in User Details
- [x] **Type:** Bug
- **Completed:** Fixed notification query to use `required: false` on Pairing include; welcome emails now appear in Comms tab

### 47. Users in Grace Period Unexpectedly Showing as Opted Out
- [x] **Type:** Bug (Critical)
- **Completed:** Changed opt-out/opt-in endpoints to require POST via confirmation page; email security scanners can no longer trigger auto-opt-outs

---

## Notes

- Use `feature-dev` skill for complex features
- Always use ULTRATHINK for implementation
- Test changes in both admin and portal interfaces
- Restart PM2 after backend changes: `pm2 restart coffee-roulette`
- Build frontend after changes: `cd frontend && npm run build`
