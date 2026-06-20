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

- Runs the existing `backend` device agent locally on the laptop camera.
- Shows the real MJPEG camera stream in the React site.
- Registers a person by capturing photos from the laptop camera.
- Retrains the local OpenCV LBPH recognition model.
- Polls recognition events from the local agent.
- Checks the central `backend-service` at `http://10.93.26.183:8000`.

The browser does not receive the local agent API key. Vite proxies `/agent/*` to `http://127.0.0.1:8081/*` and injects `X-Agent-Key` on the dev-server side.

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

If the real camera is not available, the agent may fall back to the simulated camera according to `backend/.env`.

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
$env:FACEGUARD_AGENT_URL="http://127.0.0.1:8081"
$env:FACEGUARD_AGENT_KEY="change-me-agent-key"
npm run dev
```

For the agent, edit `backend/.env` after the first run creates it.

Useful values for local laptop testing:

```env
CAMERA_INDEX=0
CAMERA_ALLOW_SIMULATION=true
API_KEY=change-me-agent-key
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
