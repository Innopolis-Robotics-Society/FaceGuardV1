import test from "node:test";
import assert from "node:assert/strict";

import {
  formatRecognitionDistanceSummary,
  recognitionDistanceStrength,
} from "./recognitionScore.js";

test("test_good_match_has_positive_display", () => {
  const display = recognitionDistanceStrength(35, 70);

  assert.equal(display.label, "strong");
  assert.equal(display.color, "#10b981");
  assert.ok(display.barPercent > 0);
  assert.match(formatRecognitionDistanceSummary(35, 70), /strong/);
});

test("test_bad_match_has_negative_display", () => {
  const display = recognitionDistanceStrength(90, 70);

  assert.equal(display.label, "weak");
  assert.equal(display.color, "#ef4444");
  assert.equal(display.barPercent, 0);
  assert.match(formatRecognitionDistanceSummary(90, 70), /weak/);
});
