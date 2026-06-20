# MVP v1 Local Camera Demo

This is an isolated worktree for the local MVP v1 camera demo. The original checkout is:

```text
C:\Users\hitoe\PycharmProjects\FaceGuardV1
```

This demo checkout is:

```text
C:\Users\hitoe\PycharmProjects\FaceGuardV1-mvp1-camera
```

## What This Demo Does

- Runs the `agent` device agent from `privel/FaceGuardV1` locally on the laptop camera through a local API bridge.
- Shows the real MJPEG camera stream in the React site.
- Registers a person by capturing photos from the laptop camera.
- Creates the person record in the central `backend-service` database.
- Retrains the local OpenCV LBPH recognition model.
- Polls recognition events from the local agent.
- Reads the People and Profile screens from the central `backend-service` at `http://10.93.26.183:8000`.

The browser does not receive the local agent API key. Vite proxies `/agent/*` to `http://127.0.0.1:8081/*` and injects `X-Agent-Key` on the dev-server side. Vite also proxies `/backend/*` to `http://10.93.26.183:8000/*` so the browser talks to one local origin.

## Start the Local Camera Agent

Open PowerShell:

```powershell
cd C:\Users\hitoe\PycharmProjects\FaceGuardV1-mvp1-camera
PowerShell -ExecutionPolicy Bypass -File .\start-mvp1-agent.ps1
```

Check:

```text
http://127.0.0.1:8081/docs
http://127.0.0.1:8081/api/v1/health
```

If the real camera is not available, the agent may fall back to the simulated camera according to `agent/.env`.

## Start the Site

Open a second PowerShell:

```powershell
cd C:\Users\hitoe\PycharmProjects\FaceGuardV1-mvp1-camera
PowerShell -ExecutionPolicy Bypass -File .\start-mvp1-site.ps1
```

Open:

```text
http://localhost:5173/FaceGuardV1/camera
```

## Optional Environment Overrides

For the site:

```powershell
$env:VITE_FACEGUARD_API_URL="http://10.93.26.183:8000"
$env:FACEGUARD_BACKEND_URL="http://10.93.26.183:8000"
$env:FACEGUARD_AGENT_URL="http://127.0.0.1:8081"
$env:FACEGUARD_AGENT_KEY="change-me-agent-key"
npm run dev
```

For the agent, edit `agent/.env` after the first run creates it.

Useful values for local laptop testing:

```env
BACKEND_URL=http://10.93.26.183:8000
CAMERA_INDEX=0
HARDWARE_MODE=development
```

## Demo Flow

1. Start the local camera agent.
2. Start the site.
3. Open `/FaceGuardV1/camera`.
4. Confirm the live camera stream appears.
5. Enter a person name.
6. Keep one clear face in frame.
7. Click `Capture and Train`.
8. Wait for the success toast.
9. Stay in frame and watch recognition events appear.
10. Open `/FaceGuardV1/people` and confirm the person appears from the backend database.

## Rollback / Cleanup

The original repository checkout is not edited by this demo worktree.

To discard this demo copy:

```powershell
cd C:\Users\hitoe\PycharmProjects\FaceGuardV1
git worktree remove C:\Users\hitoe\PycharmProjects\FaceGuardV1-mvp1-camera
git branch -D mvp1-local-camera-demo
```

Backup patch directory:

```text
C:\Users\hitoe\PycharmProjects\FaceGuardV1-backups
```
