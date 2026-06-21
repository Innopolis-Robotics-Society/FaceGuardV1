# Customer Review Summary - Week 3

## Date and Format

June 21, 2026. Remote MVP v1 review meeting.

## Participants / Roles

- Artyom Tuzov - customer representative
- Danila Naboishchikov - Scrum Master / Developer, presenter
- Oleg Korchagin - Developer, MVP v1 implementation demonstration
- Eldar Bayazitov - Developer, joined during the meeting

## Permission Status

Permission to record the meeting, publish the sanitized English transcript in the public repository, and share the review materials privately with instructors was obtained.

## Artifacts Demonstrated

- MVP v1 administrator web interface
- Registration-protected admin panel
- Dashboard with database-backed events, statistics, and recent activity
- People list and person photo management
- Camera view and recognition test setup
- Simulated door-open event and recognition event flow
- Documented backlog scope and known recognition-model refresh bug

## Planned Scope

The planned MVP v1 scope covered four selected user stories:

- US-01: View all people with access
- US-02: Add a person to the access list
- US-03: View system dashboard
- US-11: View connected entrance camera

The supporting Sprint scope included persistent authorized-person storage, frontend/backend integration, camera and recognition integration, event storage, dashboard data, and end-to-end smoke verification.

## Implemented Increment

The demonstrated increment connected the administrator frontend, central backend, database, recognition agent, and camera flow. The dashboard displayed real data from the backend, including access history, statistics, and recent events. The People workflow supported adding users and storing test images. Camera and recognition behavior were shown through a test setup, with events reflected in the interface and dashboard.

## Planned vs Actual Differences

The core MVP v1 scope was accepted as implemented. The reviewed deployment model used locally available laptop-camera testing in development mode rather than a permanently installed Raspberry Pi and fixed entrance camera. This was accepted as the MVP v1 approach, with a plan to stabilize the system on Ubuntu first and move to Raspberry Pi afterward.

Two limitations were discussed:

- The recognition model does not fully refresh automatically after adding or removing an authorized person.
- The photo capture flow currently allows repeated captures without a strict limit.

The recognition refresh limitation is tracked as a post-MVP bug. The photo limit should be added as a follow-up improvement.

## Decisions

- MVP v1 is treated as a hardware-dependent runnable increment rather than a permanently hosted full deployment.
- Frontend and backend are runnable from the repository.
- The recognition agent runs locally on a team laptop with a built-in or USB camera using `HARDWARE_MODE=development`.
- GitHub Pages is kept only as a static frontend preview and is not presented as the complete MVP v1 deployment.
- Raspberry Pi and fixed entrance-camera deployment are planned after Ubuntu stabilization.

## Customer Feedback

The customer said the result was "more than enough" and that they "expected less". The customer confirmed that everything looked good and recommended continuing in the same direction.

The customer also recommended stabilizing and testing the system on Ubuntu before moving further toward Raspberry Pi deployment, because Windows and Ubuntu behavior can differ.

## Approval or Requested Changes

The customer accepted the demonstrated direction and MVP v1 scope. Requested follow-up actions:

- Add a practical limit to repeated user-photo capture.
- Stabilize and test the system properly on Ubuntu.
- Move to Raspberry Pi only after the Linux environment is reliable.

## Risks and Remaining Gaps

- Recognition data refresh currently requires a workaround or manual restart.
- Linux/Ubuntu behavior must be verified before Raspberry Pi deployment.
- Photo capture needs a limit to avoid unnecessary duplicate test images.
- Further backend functionality and website integration remain future work.

## Action Points

- Keep BUG-01 open for recognition-model refresh after authorized-person changes.
- Add a follow-up backlog item for limiting captured user photos.
- Prioritize Ubuntu stabilization and smoke testing before Raspberry Pi deployment.

## Resulting Backlog / Scope Changes

The MVP v1 scope remains US-01, US-02, US-03, and US-11. The next Sprint should include the recognition refresh bug, photo-capture limit, Ubuntu stabilization, and follow-up Raspberry Pi integration work.
