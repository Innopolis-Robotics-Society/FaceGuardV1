import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenUtils } from "../utils/token.utils";
import { AuthResponse, LoginRequest, RegisterRequest, User } from "../types/auth.types";
import {
  Person, PersonCreate, PersonUpdate, PeopleQueryParams,
  PersonPhoto, Device, DeviceCreate, DeviceUpdate, DeviceHeartbeat,
  AccessEvent, AccessEventCreate, EventsQueryParams, EventStats,
  Telemetry, TelemetryCreate, TelemetryQueryParams, TelemetryStats,
  DeviceCommand, DeviceCommandCreate, DeviceCommandUpdate,
  SystemHealth, SystemReadiness, SyncStatus, BulkSyncResponse, AuditLog, AuditQueryParams, AuditStats,
} from "../types/api.types";

const API_BASE_URL = "http://10.93.26.183:8000/api/v1";

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = tokenUtils.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          tokenUtils.removeToken();
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>("/auth/login", credentials);
    return data;
  }

  async register(registerData: RegisterRequest): Promise<User> {
    const { data } = await this.client.post<User>("/auth/register", registerData);
    return data;
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await this.client.get<User>("/auth/me");
    return data;
  }

  async getUsers(): Promise<User[]> {
    const { data } = await this.client.get<User[]>("/auth/users");
    return data;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.client.delete(`/auth/users/${userId}`);
  }

  // ============================================
  // People API
  // ============================================

  async getPeople(params?: PeopleQueryParams): Promise<Person[]> {
    const { data } = await this.client.get<Person[]>("/people/", { params });
    return data;
  }

  async getPerson(personId: string): Promise<Person> {
    const { data } = await this.client.get<Person>(`/people/${personId}`);
    return data;
  }

  async createPerson(personData: PersonCreate): Promise<Person> {
    const { data } = await this.client.post<Person>("/people/", personData);
    return data;
  }

  async updatePerson(personId: string, personData: PersonUpdate): Promise<Person> {
    const { data } = await this.client.patch<Person>(`/people/${personId}`, personData);
    return data;
  }

  async deletePerson(personId: string, permanent: boolean = false): Promise<void> {
    await this.client.delete(`/people/${personId}`, { params: { permanent } });
  }

  // ============================================
  // Photos API
  // ============================================

  async uploadPhotos(personId: string, files: File[]): Promise<PersonPhoto[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const { data } = await this.client.post<PersonPhoto[]>(
      `/people/${personId}/photos`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return data;
  }

  async getPersonPhotos(personId: string): Promise<PersonPhoto[]> {
    const { data } = await this.client.get<PersonPhoto[]>(`/people/${personId}/photos`);
    return data;
  }

  async getPhoto(personId: string, photoId: string): Promise<PersonPhoto> {
    const { data } = await this.client.get<PersonPhoto>(`/people/${personId}/photos/${photoId}`);
    return data;
  }

  getPhotoContentUrl(personId: string, photoId: string, type: "original" | "thumbnail" | "processed" = "thumbnail"): string {
    const token = tokenUtils.getToken();
    return `${API_BASE_URL}/people/${personId}/photos/${photoId}/content?type=${type}&token=${token}`;
  }

  async deletePhoto(personId: string, photoId: string): Promise<void> {
    await this.client.delete(`/people/${personId}/photos/${photoId}`);
  }

  // ============================================
  // Devices API
  // ============================================

  async getDevices(): Promise<Device[]> {
    const { data } = await this.client.get<Device[]>("/devices/");
    return data;
  }

  async getDevice(deviceId: string): Promise<Device> {
    const { data } = await this.client.get<Device>(`/devices/${deviceId}`);
    return data;
  }

  async createDevice(deviceData: DeviceCreate): Promise<Device> {
    const { data } = await this.client.post<Device>("/devices/", deviceData);
    return data;
  }

  async updateDevice(deviceId: string, deviceData: DeviceUpdate): Promise<Device> {
    const { data } = await this.client.patch<Device>(`/devices/${deviceId}`, deviceData);
    return data;
  }

  async deleteDevice(deviceId: string): Promise<void> {
    await this.client.delete(`/devices/${deviceId}`);
  }

  async sendHeartbeat(deviceId: string, heartbeatData: DeviceHeartbeat): Promise<Device> {
    const { data } = await this.client.post<Device>(`/devices/${deviceId}/heartbeat`, heartbeatData);
    return data;
  }

  async sendHeartbeatByCode(deviceCode: string, heartbeatData: DeviceHeartbeat): Promise<Device> {
    const { data } = await this.client.post<Device>(`/devices/by-code/${deviceCode}/heartbeat`, heartbeatData);
    return data;
  }

  // ============================================
  // Events API
  // ============================================

  async getEvents(params?: EventsQueryParams): Promise<AccessEvent[]> {
    const { data } = await this.client.get<AccessEvent[]>("/events/", { params });
    return data;
  }

  async getEvent(eventId: string): Promise<AccessEvent> {
    const { data } = await this.client.get<AccessEvent>(`/events/${eventId}`);
    return data;
  }

  async createEvent(eventData: AccessEventCreate): Promise<AccessEvent> {
    const { data } = await this.client.post<AccessEvent>("/events/", eventData);
    return data;
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.client.delete(`/events/${eventId}`);
  }

  async getEventStats(days: number = 7): Promise<EventStats> {
    const { data } = await this.client.get<EventStats>("/events/stats/summary", {
      params: { days },
    });
    return data;
  }

  async cleanupEvents(days: number = 30): Promise<{ deleted_events: number; deleted_files: number; cutoff_date: string }> {
    const { data } = await this.client.delete<{ deleted_events: number; deleted_files: number; cutoff_date: string }>("/events/cleanup", {
      params: { days },
    });
    return data;
  }

  // ============================================
  // Telemetry API
  // ============================================

  async createTelemetry(telemetryData: TelemetryCreate): Promise<Telemetry> {
    const { data } = await this.client.post<Telemetry>("/telemetry/", telemetryData);
    return data;
  }

  async getDeviceTelemetry(deviceId: string, params?: TelemetryQueryParams): Promise<Telemetry[]> {
    const { data } = await this.client.get<Telemetry[]>(`/telemetry/devices/${deviceId}`, {
      params,
    });
    return data;
  }

  async getLatestTelemetry(deviceId: string): Promise<Telemetry | null> {
    const { data } = await this.client.get<Telemetry | null>(`/telemetry/devices/${deviceId}/latest`);
    return data;
  }

  async getTelemetryStats(deviceId: string, hours: number = 24): Promise<TelemetryStats> {
    const { data } = await this.client.get<TelemetryStats>(`/telemetry/devices/${deviceId}/stats`, {
      params: { hours },
    });
    return data;
  }

  async cleanupTelemetry(deviceId: string, days: number = 7): Promise<{ deleted_count: number }> {
    const { data } = await this.client.delete<{ deleted_count: number }>(
      `/telemetry/devices/${deviceId}/cleanup`,
      {
        params: { days },
      }
    );
    return data;
  }

  // ============================================
  // Commands API
  // ============================================

  async getCommands(deviceId?: string, status?: string): Promise<DeviceCommand[]> {
    const params: any = {};
    if (deviceId) params.device_id = deviceId;
    if (status) params.status_filter = status;
    const { data } = await this.client.get<DeviceCommand[]>("/commands/", { params });
    return data;
  }

  async getPendingCommands(deviceId: string): Promise<DeviceCommand[]> {
    const { data } = await this.client.get<DeviceCommand[]>("/commands/pending", {
      params: { device_id: deviceId },
    });
    return data;
  }

  async getCommand(commandId: string): Promise<DeviceCommand> {
    const { data } = await this.client.get<DeviceCommand>(`/commands/${commandId}`);
    return data;
  }

  async createCommand(commandData: DeviceCommandCreate): Promise<DeviceCommand> {
    const { data } = await this.client.post<DeviceCommand>("/commands/", commandData);
    return data;
  }

  async updateCommand(commandId: string, commandData: DeviceCommandUpdate): Promise<DeviceCommand> {
    const { data } = await this.client.patch<DeviceCommand>(`/commands/${commandId}`, commandData);
    return data;
  }

  async deleteCommand(commandId: string): Promise<void> {
    await this.client.delete(`/commands/${commandId}`);
  }

  // Quick command shortcuts
  async capturePhotos(deviceId: string, personId: string, count: number = 15): Promise<DeviceCommand> {
    const { data } = await this.client.post<DeviceCommand>(
      `/commands/devices/${deviceId}/capture-photos`,
      null,
      {
        params: { person_id: personId, count },
      }
    );
    return data;
  }

  async rebuildModel(deviceId: string): Promise<DeviceCommand> {
    const { data } = await this.client.post<DeviceCommand>(`/commands/devices/${deviceId}/rebuild-model`);
    return data;
  }

  async openDoor(deviceId: string, duration: number = 5): Promise<DeviceCommand> {
    const { data } = await this.client.post<DeviceCommand>(
      `/commands/devices/${deviceId}/open-door`,
      null,
      {
        params: { duration },
      }
    );
    return data;
  }

  async rebootDevice(deviceId: string, delay: number = 10): Promise<DeviceCommand> {
    const { data } = await this.client.post<DeviceCommand>(
      `/commands/devices/${deviceId}/reboot`,
      null,
      {
        params: { delay },
      }
    );
    return data;
  }

  async restartRecognition(deviceId: string): Promise<DeviceCommand> {
    return this.createCommand({
      device_id: deviceId,
      command_type: "restart_recognition",
      parameters: null,
    });
  }

  async restartCamera(deviceId: string): Promise<DeviceCommand> {
    return this.createCommand({
      device_id: deviceId,
      command_type: "restart_camera",
      parameters: null,
    });
  }

  async restartAgent(deviceId: string): Promise<DeviceCommand> {
    return this.createCommand({
      device_id: deviceId,
      command_type: "restart_agent",
      parameters: null,
    });
  }

  async shutdownDevice(deviceId: string): Promise<DeviceCommand> {
    return this.createCommand({
      device_id: deviceId,
      command_type: "shutdown_device",
      parameters: null,
    });
  }

  // ============================================
  // Sync API
  // ============================================

  async getSyncStatus(deviceId: string): Promise<SyncStatus> {
    const { data } = await this.client.get<SyncStatus>(`/sync/status/${deviceId}`);
    return data;
  }

  async syncEventsBulk(deviceId: string, events: AccessEventCreate[]): Promise<BulkSyncResponse> {
    const { data } = await this.client.post<BulkSyncResponse>("/sync/events/bulk", events, {
      params: { device_id: deviceId },
    });
    return data;
  }

  async syncTelemetryBulk(deviceId: string, telemetry: TelemetryCreate[]): Promise<BulkSyncResponse> {
    const { data } = await this.client.post<BulkSyncResponse>("/sync/telemetry/bulk", telemetry, {
      params: { device_id: deviceId },
    });
    return data;
  }

  // ============================================
  // Audit API
  // ============================================

  async getAuditLogs(params?: AuditQueryParams): Promise<AuditLog[]> {
    const { data } = await this.client.get<AuditLog[]>("/audit/", { params });
    return data;
  }

  async getAuditLog(logId: string): Promise<AuditLog> {
    const { data } = await this.client.get<AuditLog>(`/audit/${logId}`);
    return data;
  }

  async createAuditLog(logData: {
    user_id?: string | null;
    action: string;
    entity_type?: string | null;
    entity_id?: string | null;
    old_value?: string | null;
    new_value?: string | null;
    ip_address?: string | null;
  }): Promise<{ id: string; created_at: string }> {
    const { data } = await this.client.post<{ id: string; created_at: string }>("/audit/", null, {
      params: logData,
    });
    return data;
  }

  async getAuditStats(days: number = 30): Promise<AuditStats> {
    const { data } = await this.client.get<AuditStats>("/audit/stats/summary", {
      params: { days },
    });
    return data;
  }

  async cleanupAuditLogs(days: number = 30): Promise<{ deleted_count?: number }> {
    const { data } = await this.client.delete<{ deleted_count?: number }>("/audit/cleanup", {
      params: { days },
    });
    return data;
  }

  // ============================================
  // System API
  // ============================================

  async getSystemHealth(): Promise<SystemHealth> {
    const { data } = await this.client.get<SystemHealth>("/system/health");
    return data;
  }

  async getSystemReadiness(): Promise<SystemReadiness> {
    const { data } = await this.client.get<SystemReadiness>("/system/readiness");
    return data;
  }

  // ============================================
  // Camera Stream API
  // ============================================

  getCameraStreamUrl(deviceId: string): string {
    const token = tokenUtils.getToken();
    // Agent runs on a different port (e.g., 8001)
    // This assumes agent exposes /api/v1/stream endpoint
    return `http://10.93.26.183:8001/api/v1/stream?device_id=${deviceId}&token=${token}`;
  }

  getWebSocketUrl(): string {
    // WebSocket endpoint for real-time events
    const token = tokenUtils.getToken();
    return `ws://10.93.26.183:8000/ws/events?token=${token}`;
  }
}

export const apiService = new ApiService();
