export function formatRecognitionDistance(distance) {
  if (distance === null || distance === undefined || Number.isNaN(Number(distance))) {
    return "N/A";
  }

  return Number(distance).toFixed(2);
}

export function recognitionDistanceStrength(distance, threshold = 70) {
  if (distance === null || distance === undefined || Number.isNaN(Number(distance))) {
    return {
      label: "unknown",
      color: "#3a3a3a",
      barPercent: 0,
    };
  }

  const numericDistance = Number(distance);
  const numericThreshold = Number(threshold) > 0 ? Number(threshold) : 70;
  const barPercent = Math.max(0, Math.min(100, (1 - numericDistance / numericThreshold) * 100));

  if (numericDistance < numericThreshold * 0.7) {
    return { label: "strong", color: "#10b981", barPercent };
  }

  if (numericDistance < numericThreshold) {
    return { label: "borderline", color: "#f59e0b", barPercent };
  }

  return { label: "weak", color: "#ef4444", barPercent };
}

export function formatRecognitionDistanceSummary(distance, threshold = 70) {
  if (distance === null || distance === undefined || Number.isNaN(Number(distance))) {
    return "Distance: N/A";
  }

  const strength = recognitionDistanceStrength(distance, threshold);
  return `Distance: ${formatRecognitionDistance(distance)} (${strength.label})`;
}
