"""MiniFASNet Anti-Spoofing Detector using Silent-Face Anti-Spoofing"""

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from typing import Dict, Any, Optional
from pathlib import Path

from core.logging import get_logger

logger = get_logger(__name__)


class MiniFASNetV2(torch.nn.Module):
    """
    MiniFASNet V2 architecture for face anti-spoofing
    Lightweight CNN model for presentation attack detection
    """

    def __init__(self, conv6_kernel=(5, 5), num_classes=3):
        super(MiniFASNetV2, self).__init__()

        self.conv1 = torch.nn.Conv2d(3, 64, kernel_size=3, stride=1, padding=1)
        self.bn1 = torch.nn.BatchNorm2d(64)

        self.conv2 = torch.nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1)
        self.bn2 = torch.nn.BatchNorm2d(128)

        self.conv3 = torch.nn.Conv2d(128, 196, kernel_size=3, stride=1, padding=1)
        self.bn3 = torch.nn.BatchNorm2d(196)

        self.conv4 = torch.nn.Conv2d(196, 128, kernel_size=3, stride=1, padding=1)
        self.bn4 = torch.nn.BatchNorm2d(128)

        self.conv5 = torch.nn.Conv2d(128, 128, kernel_size=3, stride=1, padding=1)
        self.bn5 = torch.nn.BatchNorm2d(128)

        self.conv6 = torch.nn.Conv2d(128, 128, kernel_size=conv6_kernel, stride=1, padding=0)
        self.bn6 = torch.nn.BatchNorm2d(128)

        self.fc = torch.nn.Linear(128, num_classes)

        self.pool = torch.nn.MaxPool2d(kernel_size=3, stride=2, padding=1)

    def forward(self, x):
        x = F.relu(self.bn1(self.conv1(x)))
        x = self.pool(x)

        x = F.relu(self.bn2(self.conv2(x)))
        x = self.pool(x)

        x = F.relu(self.bn3(self.conv3(x)))
        x = self.pool(x)

        x = F.relu(self.bn4(self.conv4(x)))

        x = F.relu(self.bn5(self.conv5(x)))

        x = F.relu(self.bn6(self.conv6(x)))

        x = x.view(x.size(0), -1)
        x = self.fc(x)

        return x


class MiniFASNetDetector:
    """
    Silent-Face Anti-Spoofing detector using MiniFASNet

    Detects presentation attacks:
    - Printed photos
    - Digital photos (phone screen)
    - Video replay attacks
    - 3D masks (basic)
    """

    def __init__(self, model_path: Optional[Path] = None, device: str = 'cpu'):
        self.device = torch.device('cpu')
        self.model = None
        self.is_loaded = False
        self.model_path = model_path

        # Image preprocessing params (based on Silent-Face Anti-Spoofing)
        self.input_size = (80, 80)  # MiniFASNet input size
        self.mean = [0.485, 0.456, 0.406]
        self.std = [0.229, 0.224, 0.225]

        # Try to load model if path provided
        if model_path and model_path.exists():
            try:
                self.load_model(model_path)
            except Exception as e:
                logger.warning(f"Failed to load MiniFASNet model: {e}")
                logger.info("MiniFASNet will be disabled. To enable, provide valid model weights.")

    def load_model(self, model_path: Path):
        """Load pre-trained MiniFASNet model"""
        try:
            self.model = MiniFASNetV2(conv6_kernel=(5, 5), num_classes=3)

            # Load weights
            state_dict = torch.load(str(model_path), map_location=self.device)

            # Handle different checkpoint formats
            if 'state_dict' in state_dict:
                state_dict = state_dict['state_dict']

            self.model.load_state_dict(state_dict, strict=False)
            self.model.to(self.device)
            self.model.eval()

            self.is_loaded = True
            logger.info(f"MiniFASNet model loaded successfully from {model_path}")

        except Exception as e:
            logger.error(f"Error loading MiniFASNet model: {e}")
            self.is_loaded = False
            raise

    def preprocess_face(self, face_img: np.ndarray) -> torch.Tensor:
        """
        Preprocess face image for MiniFASNet

        Args:
            face_img: Face image (BGR format)

        Returns:
            Preprocessed tensor ready for model
        """
        # Convert BGR to RGB
        face_rgb = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)

        # Resize to model input size
        face_resized = cv2.resize(face_rgb, self.input_size)

        # Normalize to [0, 1]
        face_normalized = face_resized.astype(np.float32) / 255.0

        # Apply ImageNet normalization
        for i in range(3):
            face_normalized[:, :, i] = (face_normalized[:, :, i] - self.mean[i]) / self.std[i]

        # Convert to tensor: (H, W, C) -> (C, H, W)
        face_tensor = torch.from_numpy(face_normalized.transpose(2, 0, 1))

        # Add batch dimension: (C, H, W) -> (1, C, H, W)
        face_tensor = face_tensor.unsqueeze(0)

        return face_tensor

    def detect_spoofing(
        self,
        frame: np.ndarray,
        face_bbox: Dict[str, int],
        threshold: float = 0.5
    ) -> Dict[str, Any]:
        """
        Detect if face is real or spoofed

        Args:
            frame: Full BGR image frame
            face_bbox: Face bounding box {"x", "y", "w", "h"}
            threshold: Confidence threshold (0-1, higher = stricter)

        Returns:
            {
                "is_real": bool,
                "confidence": float (0-1),
                "label": str ("real", "fake", "uncertain"),
                "scores": dict with class probabilities,
                "model_available": bool
            }
        """
        result = {
            "is_real": True,  # Default to real if model not loaded (fail-open)
            "confidence": 0.0,
            "label": "unknown",
            "scores": {},
            "model_available": self.is_loaded
        }

        if not self.is_loaded:
            logger.debug("MiniFASNet model not loaded, skipping anti-spoofing check")
            result["label"] = "model_not_loaded"
            result["confidence"] = 1.0  # High confidence in "don't know"
            return result

        try:
            # Extract face region with some padding
            x, y, w, h = face_bbox["x"], face_bbox["y"], face_bbox["w"], face_bbox["h"]

            # Add 30% padding around face
            pad_w = int(w * 0.3)
            pad_h = int(h * 0.3)

            x1 = max(0, x - pad_w)
            y1 = max(0, y - pad_h)
            x2 = min(frame.shape[1], x + w + pad_w)
            y2 = min(frame.shape[0], y + h + pad_h)

            face_region = frame[y1:y2, x1:x2]

            if face_region.size == 0:
                logger.warning("Empty face region after padding")
                return result

            # Preprocess
            face_tensor = self.preprocess_face(face_region)
            face_tensor = face_tensor.to(self.device)

            # Inference
            with torch.no_grad():
                logits = self.model(face_tensor)
                probs = F.softmax(logits, dim=1)
                probs = probs.cpu().numpy()[0]

            # Class mapping: 0 = real, 1 = fake (print), 2 = fake (replay)
            # We combine fake classes
            real_score = float(probs[0])
            fake_score = float(probs[1] + probs[2])

            result["scores"] = {
                "real": real_score,
                "fake_print": float(probs[1]),
                "fake_replay": float(probs[2]),
                "fake_combined": fake_score
            }

            # Determine if real based on threshold
            result["is_real"] = real_score > threshold
            result["confidence"] = real_score if result["is_real"] else fake_score
            result["label"] = "real" if result["is_real"] else "fake"

            logger.debug(
                f"MiniFASNet result: {result['label']} "
                f"(real: {real_score:.3f}, fake: {fake_score:.3f})"
            )

            return result

        except Exception as e:
            logger.error(f"Error in MiniFASNet detection: {e}", exc_info=True)
            result["label"] = "error"
            result["is_real"] = True  # Fail-open on error
            return result

    def get_status(self) -> Dict[str, Any]:
        """Get detector status"""
        return {
            "model_loaded": self.is_loaded,
            "model_path": str(self.model_path) if self.model_path else None,
            "device": str(self.device),
            "input_size": self.input_size
        }
