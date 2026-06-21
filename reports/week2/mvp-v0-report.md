# MVP v0 Report - Face Guard

## Purpose and description

MVP v0 is a runnable frontend foundation for Face Guard. It demonstrates the administrator interface, navigation, representative data, and mock interactions before the recognition and backend integrations are complete.

## Deployment

- University VM deployment: <http://10.90.138.70:3000>
- Public GitHub Page: <https://innopolis-robotics-society.github.io/FaceGuardV1/>


## Public video demonstration

<https://disk.yandex.ru/i/cgaJVBhka7gISw>

## Relationship to the prototype and MVP v1 stories

The MVP v0 frontend implements the interface foundation used by the proposed MVP v1 scope:

- [US-01](./user-stories.md#us-01-view-all-people-with-access) - People list
- [US-02](./user-stories.md#us-02-add-a-person-to-the-access-list) - Add-person interaction
- [US-03](./user-stories.md#us-03-view-system-dashboard) - Dashboard and recent events

It also includes exploratory screens for service status, access logs, settings, and camera controls.

## Current limitations and mocks

- Face recognition is not production-ready.
- Camera input and door control are mocked.
- People, events, telemetry, and service states use demonstration data.
- Production authentication and authorization are not implemented.
- The frontend is not yet connected to persistent backend storage.
- GitHub Pages demonstrates only the static frontend; it does not expose the university VM backend.

## Local setup

Prerequisites: Node.js 20.19 or later and npm.

```bash
cd frontend/prototype
npm ci
npm run dev
```

Open the URL printed by Vite: `http://localhost:5173`.

## Repeatable smoke check

### Access instructions

Use the public GitHub Pages URL, connect to the university VPN and use the VM URL, or run the application locally. No credentials are required for MVP v0 because authentication is currently mocked.

### Steps and expected results

1. Open the application.
   - Expected: the Dashboard loads without an error and displays summary cards, charts, and recent events.
2. Select **People** in the navigation.
   - Expected: the authorized-person list opens and displays mock person records.
3. Open the add-person form and enter representative values.
   - Expected: the form accepts a name, notes, and image selection and provides visible save feedback.
4. Remove a mock person and confirm the action.
   - Expected: a confirmation is requested and the selected mock record disappears from the current interface state.
5. Select **Access Logs** and export the log.
   - Expected: the log table opens and the export action produces a CSV download or visible export confirmation.
6. Select **System**, choose the camera restart action, and confirm it.
   - Expected: the interface displays restart progress or a success notification; no real camera service is restarted in MVP v0.
7. Select **Settings**, change a value, and save.
   - Expected: the changed value remains visible during the session and a success notification is displayed.
8. Reload the application and repeat the main navigation.
   - Expected: the application still opens and all primary pages remain reachable.

## Smoke-check result

MVP v0 is successful when the application opens, the primary navigation works, the People and Dashboard flows are usable, mock actions provide clear feedback, and no page produces an unhandled error.
