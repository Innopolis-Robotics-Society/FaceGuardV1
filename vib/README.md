# Face Guard

Face Guard is an access-control system for restricted rooms and protected areas. It combines an administrator web interface, backend services, and a Raspberry Pi device agent.

## Project structure

- `frontend/prototype` - interactive MVP v0 administrator interface
- `backend` - Raspberry Pi/local access-control backend
- `backend-service` - central backend service and database API
- `raspberry-agent` - Raspberry Pi agent experiments
- `reports/week2` - Assignment 2 documentation

## Local MVP v0 setup

Prerequisites: Node.js 20.19 or later and npm.

```bash
cd frontend/prototype
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## Production-style frontend container

```bash
cd frontend/prototype
docker build -t faceguard-prototype .
docker run --rm -p 3000:80 faceguard-prototype
```

Open <http://localhost:3000>.

## Deployed MVP v0

- University VM: <http://10.90.138.70:3000> (university network or VPN)
- Public frontend demonstration: <https://innopolis-robotics-society.github.io/FaceGuardV1/>
- [MVP v0 report and smoke check](reports/week2/mvp-v0-report.md)

The public GitHub Pages site contains the static frontend demonstration. Real recognition, production authentication, camera input, and persistent backend integration remain outside MVP v0.

## Week 2 report

[Assignment 2 / Week 2 report](reports/week2/README.md)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
