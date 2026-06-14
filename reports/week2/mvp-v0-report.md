# MVP v0 Report — Face Guard

## Purpose and description

MVP v0 is a runnable frontend foundation for Face Guard. It demonstrates the main interface structure with mock data and prepares the project for future implementation.

## Deployment URL / runnable artifact

http://10.90.138.70:3000

If deployment is not ready, write that MVP v0 can be run locally.

## Public video demonstration

https://disk.yandex.ru/i/cgaJVBhka7gISw

## Relationship to prototype and MVP v1 stories

- US-01 — View all people with access
- US-03 — View system dashboard
- US-07 — Clean admin web UI panel
- US-08 — Remote access management via website

## Current limitations and mocks

- Face recognition is not production-ready.
- Camera input is mocked.
- People and events are static mock data.
- No production authentication is implemented yet.
- No database integration is implemented yet.

## Local setup

```bash
cd frontend/prototype
npm install
npm run dev
```

## Smoke-check scenario

1. Open the application.
2. Check that the dashboard is visible.
3. Open the people list page.
4. Delete any person
5. Check the access log
6. Export the access log to .csv
6. Go to system panel
7. Press the camera restart button and confirm
8. Go to settings panel
9. Try to edit settings and save them

## Expected result

The application opens successfully, navigation works, mock data is visible.
