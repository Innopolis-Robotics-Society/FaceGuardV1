"""Download required models for FaceGuard Agent"""

import os
import sys
import urllib.request
import hashlib
from pathlib import Path

# Model configurations
MODELS = {
    "minifasnet": {
        "url": "https://github.com/minivision-ai/Silent-Face-Anti-Spoofing/raw/master/resources/anti_spoof_models/2.7_80x80_MiniFASNetV2.pth",
        "filename": "minifasnet_v2.pth",
        "dir": "antispoofing",
        "sha256": None,  # Optional: add checksum if known
        "size_mb": 2.5,
        "required": False  # Not strictly required, anti-spoofing is optional
    }
}


def get_data_dir() -> Path:
    """Get data directory path"""
    # Try to get from environment
    data_dir = os.getenv("DATA_DIR")
    if data_dir:
        return Path(data_dir)

    # Default: root project data directory (FaceGuardV1/data/)
    script_dir = Path(__file__).parent.parent  # agent/
    root_dir = script_dir.parent  # FaceGuardV1/
    return root_dir / "data"


def download_file(url: str, dest_path: Path, expected_size_mb: float = None):
    """Download file with progress bar"""
    print(f"Downloading: {url}")
    print(f"Destination: {dest_path}")

    try:
        # Create directory if needed
        dest_path.parent.mkdir(parents=True, exist_ok=True)

        # Download with progress
        def reporthook(blocknum, blocksize, totalsize):
            downloaded = blocknum * blocksize
            if totalsize > 0:
                percent = min(downloaded * 100.0 / totalsize, 100)
                mb_downloaded = downloaded / (1024 * 1024)
                mb_total = totalsize / (1024 * 1024)
                sys.stdout.write(f"\r  Progress: {percent:.1f}% ({mb_downloaded:.1f}/{mb_total:.1f} MB)")
                sys.stdout.flush()

        urllib.request.urlretrieve(url, dest_path, reporthook)
        print()  # New line after progress

        # Verify file size
        file_size_mb = dest_path.stat().st_size / (1024 * 1024)
        print(f"  Downloaded: {file_size_mb:.2f} MB")

        if expected_size_mb and abs(file_size_mb - expected_size_mb) > 0.5:
            print(f"  WARNING: Expected ~{expected_size_mb} MB, got {file_size_mb:.2f} MB")

        return True

    except Exception as e:
        print(f"  ERROR: Failed to download: {e}")
        return False


def verify_checksum(file_path: Path, expected_sha256: str) -> bool:
    """Verify file SHA256 checksum"""
    if not expected_sha256:
        return True

    print(f"  Verifying checksum...")
    sha256_hash = hashlib.sha256()

    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)

    actual = sha256_hash.hexdigest()

    if actual == expected_sha256:
        print(f"  Checksum OK")
        return True
    else:
        print(f"  Checksum FAILED")
        print(f"    Expected: {expected_sha256}")
        print(f"    Got:      {actual}")
        return False


def download_models(force: bool = False, skip_optional: bool = False):
    """Download all required models"""
    data_dir = get_data_dir()
    models_dir = data_dir / "models"

    print(f"FaceGuard Model Downloader")
    print(f"=" * 60)
    print(f"Data directory: {data_dir}")
    print(f"Models directory: {models_dir}")
    print()

    success_count = 0
    skip_count = 0
    fail_count = 0

    for model_name, config in MODELS.items():
        print(f"Model: {model_name}")
        print(f"-" * 60)

        # Check if optional and should skip
        if not config["required"] and skip_optional:
            print(f"  Skipped (optional)")
            skip_count += 1
            print()
            continue

        # Prepare destination path
        model_dir = models_dir / config["dir"]
        dest_path = model_dir / config["filename"]

        # Check if already exists
        if dest_path.exists() and not force:
            file_size_mb = dest_path.stat().st_size / (1024 * 1024)
            print(f"  Already exists: {dest_path}")
            print(f"  Size: {file_size_mb:.2f} MB")
            print(f"  Use --force to re-download")
            skip_count += 1
            print()
            continue

        # Download
        if download_file(config["url"], dest_path, config["size_mb"]):
            # Verify checksum if provided
            if config["sha256"]:
                if not verify_checksum(dest_path, config["sha256"]):
                    print(f"  Removing corrupted file...")
                    dest_path.unlink()
                    fail_count += 1
                    print()
                    continue

            print(f"  SUCCESS")
            success_count += 1
        else:
            fail_count += 1

        print()

    # Summary
    print(f"=" * 60)
    print(f"Summary:")
    print(f"  Downloaded: {success_count}")
    print(f"  Skipped: {skip_count}")
    print(f"  Failed: {fail_count}")
    print()

    if fail_count > 0:
        print(f"WARNING: {fail_count} model(s) failed to download")
        print(f"Some features may not be available")
        return 1

    print(f"All models ready!")
    return 0


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Download FaceGuard models")
    parser.add_argument("--force", action="store_true", help="Re-download existing models")
    parser.add_argument("--skip-optional", action="store_true", help="Skip optional models")

    args = parser.parse_args()

    sys.exit(download_models(force=args.force, skip_optional=args.skip_optional))
