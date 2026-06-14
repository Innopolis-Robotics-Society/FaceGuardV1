# Face Guard

Face Guard is an access control system for managing entry to restricted rooms and protected areas. The system helps administrators manage people and permissions, view access events, and show a clear access decision after scanning.

## Project status

The current repository contains:

- a React frontend foundation in `frontend/faceguard-web`;
- early computer vision experiments in `CV`;
- Week 2 report files in `reports/week2`.

## Planned features

- Access management panel
- People access list
- Scanner demo with access granted / denied result
- Access event logs
- Future face recognition integration

## Local setup

```bash
cd frontend/faceguard-web
npm install
npm run dev
```

## MVP v0

MVP v0 is planned as a runnable frontend foundation with mock data and a scanner demo. Real face recognition, production authentication, camera input, and database integration are not part of MVP v0 yet.

[MVP v0 report](reports/week2/mvp-v0-report.md)

## Week 2 report

[Week 2 Report](reports/week2/README.md)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
