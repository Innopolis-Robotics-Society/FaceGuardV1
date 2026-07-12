import importlib.util
from pathlib import Path


def _load_score_module():
    module_path = Path(__file__).parents[3] / "agent" / "recognition" / "score.py"
    spec = importlib.util.spec_from_file_location("recognition_score", module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


score = _load_score_module()


def test_distance_below_threshold_is_match():
    assert score.is_distance_match(45.0, 70.0)


def test_distance_equal_threshold_uses_documented_boundary():
    assert not score.is_distance_match(70.0, 70.0)


def test_distance_above_threshold_is_not_match():
    assert not score.is_distance_match(85.0, 70.0)
