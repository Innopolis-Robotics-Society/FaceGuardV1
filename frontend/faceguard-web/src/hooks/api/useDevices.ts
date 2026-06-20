import { useQuery } from "@tanstack/react-query";
import { apiService } from "../../services/api.service";

export function useGetDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: () => apiService.getDevices(),
  });
}

export function useGetDevice(deviceId: string) {
  return useQuery({
    queryKey: ["devices", deviceId],
    queryFn: () => apiService.getDevice(deviceId),
    enabled: !!deviceId,
  });
}
