import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../../services/api.service";
import { Person, PersonCreate, PersonUpdate, PeopleQueryParams } from "../../types/api.types";
import { toast } from "sonner";

export function useGetPeople(params?: PeopleQueryParams) {
  return useQuery({
    queryKey: ["people", params],
    queryFn: () => apiService.getPeople(params),
  });
}

export function useGetPerson(personId: string) {
  return useQuery({
    queryKey: ["people", personId],
    queryFn: () => apiService.getPerson(personId),
    enabled: !!personId,
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PersonCreate) => apiService.createPerson(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      toast.success("Person created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to create person");
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ personId, data }: { personId: string; data: PersonUpdate }) =>
      apiService.updatePerson(personId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["people", variables.personId] });
      toast.success("Person updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to update person");
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ personId, permanent }: { personId: string; permanent?: boolean }) =>
      apiService.deletePerson(personId, permanent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      toast.success("Person deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to delete person");
    },
  });
}

export function useUploadPhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ personId, files }: { personId: string; files: File[] }) =>
      apiService.uploadPhotos(personId, files),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["people", variables.personId] });
      queryClient.invalidateQueries({ queryKey: ["photos", variables.personId] });
      toast.success("Photos uploaded successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to upload photos");
    },
  });
}

export function useGetPersonPhotos(personId: string) {
  return useQuery({
    queryKey: ["photos", personId],
    queryFn: () => apiService.getPersonPhotos(personId),
    enabled: !!personId,
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ personId, photoId }: { personId: string; photoId: string }) =>
      apiService.deletePhoto(personId, photoId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["photos", variables.personId] });
      queryClient.invalidateQueries({ queryKey: ["people", variables.personId] });
      toast.success("Photo deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to delete photo");
    },
  });
}
