import { useQuery } from "@tanstack/react-query";
import { apiService } from "../../services/api.service";
import { TelemetryQueryParams } from "../../types/api.types";

export function useGetDeviceTelemetry(deviceId: string, params?: TelemetryQueryParams) {
  return useQuery({
    queryKey: ["telemetry", deviceId, params],
    queryFn: () => apiService.getDeviceTelemetry(deviceId, params),
    enabled: !!deviceId,
  });
}

export function useGetLatestTelemetry(deviceId: string) {
  return useQuery({
    queryKey: ["telemetry", deviceId, "latest"],
    queryFn: () => apiService.getLatestTelemetry(deviceId),
    enabled: !!deviceId,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });
}

export function useGetTelemetryStats(deviceId: string, hours: number = 24) {
  return useQuery({
    queryKey: ["telemetry", deviceId, "stats", hours],
    queryFn: () => apiService.getTelemetryStats(deviceId, hours),
    enabled: !!deviceId,
  });
}
