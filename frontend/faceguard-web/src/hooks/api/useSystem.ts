import { useQuery } from "@tanstack/react-query";
import { apiService } from "../../services/api.service";

export function useGetSystemHealth() {
  return useQuery({
    queryKey: ["system", "health"],
    queryFn: () => apiService.getSystemHealth(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
}

export function useGetSystemReadiness() {
  return useQuery({
    queryKey: ["system", "readiness"],
    queryFn: () => apiService.getSystemReadiness(),
  });
}
