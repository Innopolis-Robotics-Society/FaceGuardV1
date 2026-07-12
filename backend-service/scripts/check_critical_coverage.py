from __future__ import annotations

import json
import sys
from pathlib import PurePosixPath


CRITICAL_MODULES = {
    "app/api/system.py": 30.0,
    "app/core/security.py": 30.0,
    "app/schemas/schemas.py": 30.0,
}


def _normalise_path(path: str) -> str:
    return PurePosixPath(path.replace("\\", "/")).as_posix()


def _load_coverage(path: str) -> dict:
    try:
        with open(path, encoding="utf-8") as coverage_file:
            return json.load(coverage_file)
    except (OSError, json.JSONDecodeError) as error:
        print(f"ERROR: unable to read coverage report {path}: {error}")
        raise SystemExit(2) from error


def _find_file_entry(files: dict, suffix: str) -> dict | None:
    normalised_suffix = _normalise_path(suffix)
    for file_path, file_data in files.items():
        if _normalise_path(file_path).endswith(normalised_suffix):
            return file_data
    return None


def _line_coverage_percent(file_data: dict) -> float:
    try:
        return float(file_data["summary"]["percent_covered"])
    except (KeyError, TypeError, ValueError) as error:
        print(f"ERROR: malformed file coverage entry: {error}")
        raise SystemExit(2) from error


def main() -> int:
    report_path = sys.argv[1] if len(sys.argv) > 1 else "coverage.json"
    coverage = _load_coverage(report_path)
    files = coverage.get("files")
    if not isinstance(files, dict):
        print("ERROR: coverage report does not contain a valid files mapping")
        return 2

    failed = False
    for module_path, minimum in CRITICAL_MODULES.items():
        file_data = _find_file_entry(files, module_path)
        if file_data is None:
            print(f"FAIL {module_path}: missing from coverage report")
            failed = True
            continue

        coverage_percent = _line_coverage_percent(file_data)
        if coverage_percent >= minimum:
            print(f"PASS {module_path}: {coverage_percent:.2f}% >= {minimum:.2f}%")
        else:
            print(f"FAIL {module_path}: {coverage_percent:.2f}% < {minimum:.2f}%")
            failed = True

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
