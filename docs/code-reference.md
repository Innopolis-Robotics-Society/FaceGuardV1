# Code Reference

This page is a lightweight public code reference for the maintained FaceGuard
modules. It is intentionally limited to stable entry points that are useful for
handover, operation, and review.

## Backend Service

| Module | Public entry point | Responsibility |
| --- | --- | --- |
| `backend-service/app/main.py` | `app` | FastAPI application setup and API router registration |
| `backend-service/app/api/system.py` | health endpoints | Backend liveness and status contract used by UI, CI, and smoke checks |
| `backend-service/app/api/people.py` | people endpoints | Authorized-person CRUD workflow |
| `backend-service/app/api/photos.py` | photo endpoints | Reference-photo upload and retrieval |
| `backend-service/app/api/devices.py` | device endpoints | Raspberry Pi/edge-device registration and heartbeat |
| `backend-service/app/api/events.py` | event endpoints | Recognition/access-event history |
| `backend-service/app/api/commands.py` | command endpoints | Backend-to-agent command queue, including model rebuild and manual open |
| `backend-service/app/api/sync.py` | sync endpoints | Bulk upload of offline events and telemetry |
| `backend-service/app/core/security.py` | JWT helpers | Administrator authentication boundary |

## Recognition Agent

| Module | Class or function | Responsibility |
| --- | --- | --- |
| `agent/main.py` | `FaceGuardAgent.start()` | Starts camera, sync, command polling, recognition loop, telemetry, and stream server |
| `agent/main.py` | `FaceGuardAgent.stop()` | Gracefully stops background tasks, camera, backend client, and hardware resources |
| `agent/camera/camera_service.py` | `CameraService.get_frame()` | Returns the latest camera frame for recognition |
| `agent/camera/capture_service.py` | `CaptureService.capture_person_photos()` | Captures enrollment photos for an authorized person |
| `agent/recognition/recognizer.py` | `RecognitionService.train_model()` | Builds or rebuilds the local recognition model |
| `agent/recognition/recognizer.py` | `RecognitionService.recognize_face()` | Runs face detection and recognition against the current frame |
| `agent/recognition/recognition_loop.py` | `RecognitionLoop.start()` | Runs continuous recognition in a background thread |
| `agent/recognition/minifasnet_detector.py` | `MiniFASNetDetector.detect_spoofing()` | Optional CNN-based presentation-attack detection |
| `agent/door/door_controller.py` | `DoorController.show_granted()` | Emits the blue access-granted LED signal |
| `agent/door/door_controller.py` | `DoorController.show_calibrating()` | Emits the yellow calibration/operator-attention LED signal |
| `agent/door/door_controller.py` | `DoorController.show_denied()` | Emits the red denied/unknown LED signal |
| `agent/door/door_controller.py` | `DoorController.open_door()` | Backward-compatible command handler that now emits the granted LED signal |
| `agent/sync/sync_manager.py` | `SyncManager.add_event()` | Sends or buffers recognition/access events |
| `agent/commands/command_executor.py` | `CommandExecutor.execute_command()` | Dispatches backend commands to local agent services |

## Frontend

| Module | Responsibility |
| --- | --- |
| `frontend/faceguard-web/src/app/App.tsx` | Application shell and route rendering |
| `frontend/faceguard-web/src/app/routes.tsx` | Route definitions |
| `frontend/faceguard-web/src/app/components/pages/Dashboard.tsx` | Operator dashboard and metrics |
| `frontend/faceguard-web/src/app/components/pages/People.tsx` | Authorized-person management |
| `frontend/faceguard-web/src/app/components/pages/AccessLogs.tsx` | Recognition/access-event review |
| `frontend/faceguard-web/src/app/components/pages/LiveCamera.tsx` | Camera and device command UI |
| `frontend/faceguard-web/src/app/components/pages/System.tsx` | Service and device status view |
| `frontend/faceguard-web/src/services/api.service.ts` | Backend REST client |
| `frontend/faceguard-web/src/services/websocket.service.ts` | WebSocket integration |
| `frontend/faceguard-web/src/utils/recognitionScore.js` | Recognition-distance display helper |

## Maintenance Notes

- Keep docstrings and this reference synchronized when public module names or
  responsibilities change.
- Do not expose private credentials, biometric data, model weights, or customer
  evidence in generated documentation.
- Add a new row only for stable code that a customer, TA, or teammate can use
  as an entry point.
