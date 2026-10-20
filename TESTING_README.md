# Testing Documentation — FIT2101 Team 7

## 1. Overview

This document outlines the testing strategy, tools, automated tests, coverage results, and remaining testing requirements for the FIT2101 Team 7 project management website.

The website is developed using React, Vite, JavaScript, and Supabase.

Our testing approach focuses on verifying application functionality, component behaviour, user interactions, service operations, and role-based access before the final release.

Automated unit tests have been implemented across the main application components, pages, services, utilities, and hooks.

The team has achieved its overall statement, branch, and function coverage targets. Additional integration, security, and end-to-end testing is required to verify the application in a deployed environment.

---

## 2. Testing Tools

The following tools are used for testing:

| Tool | Purpose |
|---|---|
| Vitest | Automated unit testing |
| React Testing Library | Testing React component rendering and behaviour |
| Jest DOM | Assertions for rendered HTML elements |
| User Event | Simulating user interactions |
| V8 Coverage | Measuring code coverage |
| Playwright | Browser-based end-to-end testing |

Unit tests use mocked dependencies where appropriate to isolate the functionality being tested.

Service tests mock Supabase operations and do not require production database credentials.

**Important:** Mocked unit tests do not verify real database persistence, Row Level Security (RLS), or production database permissions.

---

## 3. Installation and Running Tests

### Install dependencies

```bash
npm install
npx playwright install
```

### Run all unit tests

```bash
npm test
```

### Run tests with coverage

```bash
npm run test:coverage
```

### Run end-to-end tests

```bash
npm run test:e2e
```

### Run an individual test file

For example:

```bash
npx vitest run tests/unit/ClientProject.test.jsx
```

### Run the production build

```bash
npm run build
```

The commands should be executed from the project's root directory.

---

## 4. Unit Testing

Unit tests have been implemented for the application's major components, pages, services, utilities, and hooks.

### 4.1 Authentication and User Accounts

Tests cover:

- Login page rendering and user interactions
- Password field functionality
- Password visibility controls
- Password reset functionality
- Authentication layouts
- Authentication and session-related application behaviour
- Security settings
- Account creation interactions

Relevant test files include:

- `Login.test.jsx`
- `PasswordField.test.jsx`
- `ResetPassword.test.jsx`
- `AuthLayout.test.jsx`
- `SecurityTab.test.jsx`
- `PeopleTab.test.jsx`

### 4.2 Project Management

Tests cover:

- Project creation forms
- Project listing and navigation
- Project overview rendering
- Project-related service operations
- Project renaming and deletion handlers
- Project date utilities
- Project date hooks

Relevant test files include:

- `CreateProjectForm.test.jsx`
- `ProjectsLanding.test.jsx`
- `ProjectOverview.test.jsx`
- `ProjectsTab.test.jsx`
- `projectServices.test.js`
- `projectDates.test.js`
- `useProjectDates.test.jsx`

### 4.3 Task Management

Tests cover:

- Task creation form behaviour
- Task editing interactions
- Task status handling
- Task assignment behaviour
- Task comments
- Task-related service functions
- Role-dependent task controls
- Task movement through application handlers

Relevant test files include:

- `CreateTaskForm.test.jsx`
- `TaskComments.test.jsx`
- `taskServices.test.js`
- `App.test.jsx`

These tests verify application logic and interactions using mocked dependencies. They do not establish that all task operations persist correctly in the database.

### 4.4 Sprint Management

Tests cover:

- Sprint creation handlers
- Sprint updating and deletion handlers
- Sprint service functions
- Sprint ordering
- Sprint completion conditions
- Current sprint selection
- Sprint progress calculations

Relevant test files include:

- `sprintService.test.js`
- `ClientProject.test.jsx`
- `ProjectOverview.test.jsx`
- `App.test.jsx`

### 4.5 Client Functionality

Tests cover:

- Client landing page
- Client project page
- Client workspace shell
- Overall project progress
- Task status display
- Sprint progress display
- Client navigation
- Task comments in the client view

Relevant test files include:

- `ClientLanding.test.jsx`
- `ClientProject.test.jsx`
- `ClientShell.test.jsx`

### 4.6 Notifications and Interface Components

Tests cover:

- Notification centre rendering and interactions
- Notification hooks
- Notification services
- Sidebar navigation
- Workspace shell
- Quantix logo
- Text size accessibility control
- Shared settings components

Relevant test files include:

- `NotificationCenter.test.jsx`
- `useNotifications.test.jsx`
- `notificationService.test.js`
- `Sidebar.test.jsx`
- `WorkspaceShell.test.jsx`
- `QuantixLogo.test.jsx`
- `TextSizeControl.test.jsx`
- `SettingsParts.test.jsx`

### 4.7 Services and Utilities

Tests cover:

- Project services
- Task services
- Sprint services
- Notification services
- Service helper functions
- Supabase client configuration
- Name utilities
- Project date utilities

Relevant test files include:

- `projectServices.test.js`
- `taskServices.test.js`
- `sprintService.test.js`
- `notificationService.test.js`
- `serviceHelpers.test.js`
- `supabaseClient.test.js`
- `nameUtils.test.js`
- `projectDates.test.js`

---

## 5. Unit Testing Results

The previous full test run recorded the following results:

| Metric | Result |
|---|---|
| Total test files | 32 |
| Total unit tests | 847 |
| Passing tests | 846 |
| Failing tests | 1 |
| Passing test files | 31 |

The single failing test was located in `ClientProject.test.jsx`.

The failure was caused by a React Testing Library query matching two elements displaying the same progress percentage.

The test was subsequently corrected to account for both progress indicators.

A later coverage report was generated, but the supplied output did not include its final test pass/fail summary. Therefore, the corrected test suite should be rerun to confirm the final passing count.

---

## 6. Test Coverage Results

Test coverage is measured using Vitest with the V8 coverage provider.

The team's coverage targets are:

- Statement coverage: 80%
- Branch coverage: 75%
- Function coverage: 80%

### 6.1 Overall Coverage

The latest coverage report recorded:

| Coverage metric | Target | Actual result | Status |
|---|---|---|---|
| Statement coverage | 80% | 84.13% | Met |
| Branch coverage | 75% | 76.97% | Met |
| Function coverage | 80% | 85.26% | Met |
| Line coverage | Not specified | 84.00% | Recorded |

**All three configured coverage targets have been achieved.**

### 6.2 Coverage by Application Area

| Application area | Statements | Branches | Functions |
|---|---|---|---|
| Main application (`src`) | 78.62% | 63.79% | 80.28% |
| ClientShell | 100% | 100% | 100% |
| CreateProjectForm | 100% | 100% | 100% |
| CreateTaskForm | 69.08% | 70.75% | 65.62% |
| NotificationCenter | 96.15% | 97.50% | 93.33% |
| QuantixLogo | 100% | 100% | 100% |
| Sidebar | 100% | 100% | 100% |
| TaskComments | 100% | 85.71% | 100% |
| TextSizeControl | 100% | 100% | 100% |
| WorkspaceShell | 100% | 100% | 100% |
| Hooks | 100% | 91.66% | 100% |
| ClientLanding | 100% | 100% | 100% |
| ClientProject | 100% | 93.93% | 100% |
| Login components | 100% | 100% | 100% |
| ProjectOverview | 76.26% | 68.04% | 76.62% |
| ProjectsLanding | 100% | 100% | 100% |
| Settings | 80.00% | 63.47% | 87.30% |
| Services | 91.45% | 83.25% | 96.15% |
| Utilities | 95.23% | 87.50% | 100% |

### 6.3 Coverage Highlights

Several application components achieved 100% statement, branch, and function coverage, including:

- ClientShell
- CreateProjectForm
- QuantixLogo
- Sidebar
- TextSizeControl
- WorkspaceShell
- ClientLanding
- Login
- PasswordField
- ResetPassword
- ProjectsLanding
- SecurityTab

The following service modules also achieved 100% coverage across these metrics:

- `notificationService.js`
- `projectServices.js`
- `serviceHelpers.js`
- `supabaseClient.js`

### 6.4 Areas Requiring Additional Coverage

The following files recorded 0% coverage:

| File | Statement coverage |
|---|---|
| `TaskCard.jsx` | 0% |
| `AuthContent.jsx` | 0% |
| `ProfileTab.jsx` | 0% |
| `SettingsPage.jsx` | 0% |
| `memberProvisioning.js` | 0% |

Other areas that could benefit from additional tests include:

| File | Statement coverage |
|---|---|
| `CreateTaskForm.jsx` | 69.08% |
| `ProjectOverview.jsx` | 76.26% |
| `App.jsx` | 78.22% |
| `taskServices.js` | 90.69% |

Although overall coverage targets have been met, additional testing should focus on important functionality, high-risk operations, and previously untested behaviour.

### 6.5 Generating Coverage Reports

Run:

```bash
npm run test:coverage
```

The coverage report provides statement, branch, function, and line coverage percentages.

The HTML report can normally be accessed at:

```text
coverage/index.html
```

Coverage percentages measure which parts of the code are exercised by tests. They do not independently guarantee correct functionality or release readiness.

---

## 7. End-to-End Testing

Playwright is used for browser-based end-to-end testing.

End-to-end testing should verify that the website functions correctly from a user's perspective.

### Authentication

- Log in using valid credentials
- Reject invalid credentials
- Log out successfully
- Handle expired sessions
- Verify navigation after authentication

### Admin Functionality

- Create projects
- Rename projects
- Delete projects
- Create and edit sprints
- Create and edit tasks
- Assign tasks to developers
- Manage task statuses and tags
- Manage project members where permitted

### Developer Functionality

- View assigned projects and tasks
- Update permitted task properties
- Update assigned task statuses
- Add and view task checklist items
- Verify restricted actions are unavailable

### Client Functionality

- View assigned projects
- View project progress
- View sprint progress
- View task statuses
- Access permitted task comments
- Verify administrative actions are restricted

### Task and Sprint Workflows

- Create a task
- Assign the task to a sprint
- Move the task to another sprint using drag and drop
- Update the task status
- Refresh the page
- Confirm the changes persist

These workflows are planned testing scenarios and should not be considered completed until corresponding Playwright tests have been implemented and successfully executed.

End-to-end tests should use a dedicated testing environment.

---

## 8. Integration and Database Testing

Integration testing should verify communication between the frontend and Supabase.

Important scenarios include:

- Project creation and database persistence
- Task creation and database persistence
- Sprint creation and database persistence
- Task assignment visibility
- Task status updates
- Checklist persistence
- Correct retrieval of project members
- Error handling when database requests fail

### Role-Based Permissions

The website supports three main roles:

**Admin**

- Manage projects and sprints
- Create and manage tasks
- Assign tasks
- Perform authorised administrative operations

**Developer**

- Access permitted projects and tasks
- Update permitted task information
- Change assigned task statuses
- Manage permitted checklist interactions

**Client**

- View permitted project information
- Monitor project and sprint progress
- Access permitted task information and comments
- Remain restricted from administrative operations

These permissions must be verified at both the frontend and database levels.

### Supabase Security

Security testing should verify:

- Row Level Security policies are enabled where required
- Unauthorized users cannot read private project information
- Unauthorized users cannot modify restricted records
- Developers cannot perform Admin-only database operations
- Clients cannot perform restricted modifications
- Direct unauthorized database requests are rejected

Frontend permission checks alone are not sufficient to establish database security.

Integration and security tests must use a dedicated test database rather than production.

---

## 9. Error and Edge Case Testing

Testing should include both successful operations and failure scenarios.

### Input Validation

- Missing required fields
- Empty inputs
- Invalid input formats
- Duplicate submissions
- Invalid dates
- Incorrect or missing task information

### Service Failures

- Failed Supabase requests
- Network connection failures
- Missing records
- Unauthorized operations
- Expired authentication sessions

### Project and Task Edge Cases

- Projects with no tasks
- Projects with no sprints
- Tasks without assigned statuses
- Tasks without assignees
- Sprints with no tasks
- Sprints with completed tasks
- Sprints with expired end dates
- Multiple sprints with the same start date

Several of these cases are already covered by unit tests. Others require additional integration or end-to-end testing.

---

## 10. Defect Tracking

Defects discovered during testing should be recorded and classified by severity.

| Severity | Description |
|---|---|
| Critical | Prevents core application functionality or creates a serious security issue |
| High | Major functionality is broken or important permissions are incorrect |
| Medium | Functionality is partially affected but a workaround may exist |
| Low | Minor visual, usability, or non-critical issue |

### Release Targets

| Quality metric | Target |
|---|---|
| Critical defects remaining | 0 |
| High-severity defects remaining | 0 |
| Statement coverage | At least 80% |
| Branch coverage | At least 75% |
| Function coverage | At least 80% |
| Overall defect count | Recorded and reviewed before release |

The team should resolve all critical and high-severity defects before releasing the final product.

The overall defect count should be reviewed alongside severity and impact.

---

## 11. Continuous Integration

Automated testing should be included in the team's development and integration workflow.

The recommended CI process is:

1. Install dependencies.
2. Run automated unit tests.
3. Generate coverage results.
4. Build the production application.
5. Run Playwright smoke tests when a suitable environment is available.
6. Report failures before merging changes.

Recommended commands:

```bash
npm ci
npm test
npm run test:coverage
npm run build
```

Once dedicated test accounts and a testing environment are available, Playwright tests can be incorporated into CI.

The existence of these commands does not establish that the entire recommended CI workflow has already been configured.

---

## 12. Test Environment and Credentials

Tests involving authentication or database operations must use dedicated test accounts.

Test credentials should be provided through environment variables.

Do not commit:

- `.env` files containing credentials
- Supabase service-role or secret keys
- Real user passwords
- Production database credentials

Destructive tests must never run against the production database.

The unit test suite mocks Supabase where appropriate, allowing tests to run without using real production credentials.

---

## 13. Known Issues and Remaining Testing

The following items should be reviewed before final release:

### Unit Testing

- Confirm the corrected `ClientProject.test.jsx` test passes.
- Resolve the React `act(...)` warning in `useProjectDates.test.jsx`.
- Add tests for important uncovered components.
- Improve coverage of high-risk application logic.

### Additional Coverage

Prioritise testing for:

- `SettingsPage.jsx`
- `ProfileTab.jsx`
- `memberProvisioning.js`
- `AuthContent.jsx`
- `TaskCard.jsx`

### Service Review

A previously identified possible issue in `volunteerForBacklogTask` in `src/services/taskServices.js` should be reviewed.

The function may reference `data` without declaring it. A regression test should be added if the issue is confirmed.

### Integration and Security

- Verify actual database persistence.
- Verify role-based permissions using real test accounts.
- Verify Supabase Row Level Security.
- Verify task checklist visibility between users.
- Verify unauthorized database operations are rejected.

### End-to-End Testing

- Complete Playwright tests for major workflows.
- Test drag-and-drop task movement.
- Test persistence after refreshing the page.
- Test authentication and navigation for each role.
- Confirm the deployed website works in supported browsers.

---

## 14. Release Readiness

Before the final release, the team should confirm that:

- Automated unit tests pass.
- Coverage targets are achieved.
- Critical and high-severity defects are resolved.
- Important end-to-end workflows have been tested.
- Database persistence has been verified.
- Role-based permissions have been verified.
- The production build completes successfully.
- The deployed website is accessible and functional.
- User and technical documentation are available.

Source code and passing unit tests alone do not establish that the application is release-ready.

---

## 15. Testing Summary

The FIT2101 Team 7 project has an extensive automated unit testing suite covering major frontend components, pages, hooks, services, and utility functions.

The latest coverage report achieved:

| Metric | Result |
|---|---|
| Statement coverage | 84.13% |
| Branch coverage | 76.97% |
| Function coverage | 85.26% |
| Line coverage | 84.00% |

**All three configured code coverage targets have been achieved.**

The previously recorded test run included 847 tests across 32 test files, with one test failure that was subsequently corrected. A final passing count should be confirmed from the latest full test run.

Remaining testing should focus on uncovered high-risk functionality, database integration, role-based security, end-to-end workflows, and deployment verification.

The testing documentation should be updated as additional tests are completed and final release results become available.