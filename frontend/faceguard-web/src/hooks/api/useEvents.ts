import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../../services/api.service";
import { EventsQueryParams } from "../../types/api.types";
import { toast } from "sonner";

export function useGetEvents(params?: EventsQueryParams) {
  return useQuery({
    queryKey: ["events", params],
    queryFn: () => apiService.getEvents(params),
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });
}

export function useGetEvent(eventId: string) {
  return useQuery({
    queryKey: ["events", eventId],
    queryFn: () => apiService.getEvent(eventId),
    enabled: !!eventId,
  });
}

export function useGetEventStats(days: number = 7) {
  return useQuery({
    queryKey: ["events", "stats", days],
    queryFn: () => apiService.getEventStats(days),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => apiService.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to delete event");
    },
  });
}

export function useCleanupEvents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (minDays: number = 30) => apiService.cleanupEvents(minDays),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success(`${data.deleted_events} events cleaned up`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to cleanup events");
    },
  });
}
