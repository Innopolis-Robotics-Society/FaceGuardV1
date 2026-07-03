"""Recognition score helpers for OpenCV LBPH output."""


def is_distance_match(distance: float, threshold: float) -> bool:
    """Return True when an LBPH distance is accepted by the configured threshold.

    OpenCV LBPH returns a distance/error score where lower values are better.
    Equality is rejected to match the live recognizer boundary.
    """
    return distance < threshold
