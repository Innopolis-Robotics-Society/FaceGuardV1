import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../../services/api.service";
import { DeviceCommandCreate } from "../../types/api.types";
import { toast } from "sonner";

export function useGetCommands(deviceId?: string, status?: string) {
  return useQuery({
    queryKey: ["commands", deviceId, status],
    queryFn: () => apiService.getCommands(deviceId, status),
  });
}

export function useSendCommand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeviceCommandCreate) => apiService.createCommand(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commands"] });
      toast.success("Command sent successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to send command");
    },
  });
}

export function useCapturePhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deviceId, personId, count }: { deviceId: string; personId: string; count?: number }) =>
      apiService.capturePhotos(deviceId, personId, count),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commands"] });
      toast.success("Photo capture command sent");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to capture photos");
    },
  });
}

export function useRebuildModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceId: string) => apiService.rebuildModel(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commands"] });
      toast.success("Model rebuild command sent");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to rebuild model");
    },
  });
}

export function useOpenDoor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deviceId, duration }: { deviceId: string; duration?: number }) =>
      apiService.openDoor(deviceId, duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commands"] });
      toast.success("Door opening...");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to open door");
    },
  });
}

export function useRebootDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deviceId, delay }: { deviceId: string; delay?: number }) =>
      apiService.rebootDevice(deviceId, delay),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commands"] });
      toast.success("Reboot command sent");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to reboot device");
    },
  });
}

export function useRestartRecognition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceId: string) => apiService.restartRecognition(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commands"] });
      toast.success("Recognition restart command sent");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to restart recognition");
    },
  });
}

export function useRestartCamera() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceId: string) => apiService.restartCamera(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commands"] });
      toast.success("Camera restart command sent");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to restart camera");
    },
  });
}

export function useRestartAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceId: string) => apiService.restartAgent(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commands"] });
      toast.success("Agent restart command sent");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to restart agent");
    },
  });
}
