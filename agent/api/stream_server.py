"""
HTTP server for camera streaming
"""

from fastapi import FastAPI, Query, Body
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import cv2
import asyncio
from contextlib import asynccontextmanager

from core.logging import get_logger
from core.config import Config

logger = get_logger(__name__)


class StreamServer:
    """HTTP server for camera streaming"""

    def __init__(self, camera_service):
        self.camera = camera_service
        self.app = None
        self.stream_fps = 30
        self.stream_quality = 85
        self.current_resolution = "720p"

    @asynccontextmanager
    async def lifespan(self, app: FastAPI):
        logger.info("Stream server starting")
        yield
        logger.info("Stream server shutting down")

    def create_app(self) -> FastAPI:
        """Create FastAPI application"""
        app = FastAPI(title="FaceGuard Stream Server", lifespan=self.lifespan)

        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        @app.get("/stream")
        async def stream(
            device_id: Optional[str] = Query(None),
            token: Optional[str] = Query(None)
        ):
            """Stream MJPEG video feed"""
            async def generate():
                frame_delay = 1.0 / self.stream_fps

                while True:
                    frame = self.camera.get_frame()

                    if frame is None:
                        await asyncio.sleep(frame_delay)
                        continue

                    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, self.stream_quality])
                    frame_bytes = buffer.tobytes()

                    yield (
                        b'--frame\r\n'
                        b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n'
                    )

                    await asyncio.sleep(frame_delay)

            return StreamingResponse(
                generate(),
                media_type="multipart/x-mixed-replace; boundary=frame"
            )

        @app.get("/settings")
        async def get_settings():
            """Get current stream settings"""
            camera_width = Config.CAMERA_WIDTH
            camera_height = Config.CAMERA_HEIGHT

            current_res = "360p"
            if camera_width >= 1920 and camera_height >= 1080:
                current_res = "1080p"
            elif camera_width >= 1280 and camera_height >= 720:
                current_res = "720p"
            elif camera_width >= 640 and camera_height >= 480:
                current_res = "480p"

            available_resolutions = ["360p", "480p"]
            if camera_width >= 1280 and camera_height >= 720:
                available_resolutions.append("720p")
            if camera_width >= 1920 and camera_height >= 1080:
                available_resolutions.append("1080p")

            return {
                "fps": self.stream_fps,
                "quality": self.stream_quality,
                "camera_fps": self.camera.get_fps(),
                "resolution": self.current_resolution,
                "current_resolution": current_res,
                "available_resolutions": available_resolutions,
                "camera_width": camera_width,
                "camera_height": camera_height
            }

        @app.post("/settings")
        async def update_settings(
            fps: Optional[int] = Body(None),
            quality: Optional[int] = Body(None),
            resolution: Optional[str] = Body(None)
        ):
            """Update stream settings"""
            if fps is not None and 1 <= fps <= 60:
                self.stream_fps = fps
                logger.info(f"Stream FPS updated to {fps}")

            if quality is not None and 1 <= quality <= 100:
                self.stream_quality = quality
                logger.info(f"Stream quality updated to {quality}")

            if resolution is not None and resolution in ["1080p", "720p", "480p", "360p"]:
                self.current_resolution = resolution
                logger.info(f"Stream resolution updated to {resolution}")

            return {
                "fps": self.stream_fps,
                "quality": self.stream_quality,
                "resolution": self.current_resolution
            }

        @app.get("/health")
        async def health():
            """Health check endpoint"""
            return {
                "status": "healthy",
                "camera_available": self.camera.is_available(),
                "camera_type": self.camera.camera_type
            }

        self.app = app
        return app
