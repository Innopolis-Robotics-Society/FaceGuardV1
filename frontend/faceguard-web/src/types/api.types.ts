// API Response types matching backend schemas

export interface User {
  id: string;
  username: string;
  role: "admin" | "superadmin";
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface Person {
  id: string;
  name: string;
  description: string | null;
  access_enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  deleted_at: string | null;
  photo_count: number;
}

export interface PersonCreate {
  name: string;
  description?: string | null;
  access_enabled?: boolean;
}

export interface PersonUpdate {
  name?: string;
  description?: string | null;
  access_enabled?: boolean;
}

export interface PersonPhoto {
  id: string;
  person_id: string;
  original_path: string;
  processed_path: string | null;
  thumbnail_path: string | null;
  quality_score: number | null;
  face_detected: boolean;
  width: number | null;
  height: number | null;
  blur_score: number | null;
  brightness_score: number | null;
  file_hash: string | null;
  is_primary: boolean;
  created_at: string;
  created_by: string | null;
  deleted_at: string | null;
}

export interface Device {
  id: string;
  name: string;
  device_code: string;
  status: string;
  ip_address: string | null;
  last_seen_at: string | null;
  software_version: string | null;
  camera_status: string | null;
  recognition_status: string | null;
  created_at: string;
}

export interface DeviceCreate {
  name: string;
  device_code: string;
}

export interface DeviceUpdate {
  name?: string;
  status?: string;
  ip_address?: string;
  software_version?: string;
  camera_status?: string;
  recognition_status?: string;
}

export interface DeviceHeartbeat {
  ip_address?: string;
  software_version?: string;
  camera_status?: string;
  recognition_status?: string;
}

export interface AccessEvent {
  id: string;
  device_id: string;
  person_id: string | null;
  event_type: string;
  confidence: number | null;
  door_opened: boolean;
  photo_path: string | null;
  video_path: string | null;
  created_at: string;
}

export interface AccessEventCreate {
  device_id: string;
  person_id?: string | null;
  event_type: string;
  confidence?: number | null;
  door_opened?: boolean;
  photo_path?: string | null;
  video_path?: string | null;
}

export interface EventStats {
  period_days?: number;
  total_events: number;
  events_by_type?: Record<string, number>;
  unique_people_recognized?: number;
  average_confidence: number | null;
  total_doors_opened?: number;
}

export interface Telemetry {
  id: string;
  device_id: string;
  cpu_usage: number | null;
  cpu_temperature: number | null;
  ram_usage: number | null;
  disk_usage: number | null;
  uptime: number | null;
  camera_fps: number | null;
  network_status: string | null;
  created_at: string;
}

export interface TelemetryCreate {
  device_id: string;
  cpu_usage?: number | null;
  cpu_temperature?: number | null;
  ram_usage?: number | null;
  disk_usage?: number | null;
  uptime?: number | null;
  camera_fps?: number | null;
  network_status?: string | null;
}

export interface TelemetryStats {
  device_id: string;
  period_hours?: number;
  cpu?: {
    average: number | null;
    max: number | null;
    min: number | null;
  };
  temperature?: {
    average: number | null;
    max: number | null;
  };
  ram?: {
    average: number | null;
    max: number | null;
  };
  disk?: {
    average: number | null;
    max: number | null;
  };
  camera_fps?: {
    average: number | null;
  };
}

export interface SyncStatus {
  device_id: string;
  device_status?: string;
  last_seen?: string | null;
  latest_event_at?: string | null;
  latest_telemetry_at?: string | null;
  pending_commands_count?: number;
  needs_sync?: boolean;
}

export interface BulkSyncResponse {
  success: boolean;
  created_count: number;
  total_received: number;
  errors_count: number;
  errors: Array<{ index: number; error: string }> | null;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  username?: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_value?: string | null;
  new_value?: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditQueryParams {
  days?: number;
  user_id?: string;
  action?: string;
  entity_type?: string;
  skip?: number;
  limit?: number;
}

export interface AuditStats {
  period_days?: number;
  total_actions?: number;
  actions_by_type?: Record<string, number>;
  top_users?: Array<{
    user_id: string;
    username: string;
    actions_count: number;
  }>;
}

export interface DeviceCommand {
  id: string;
  device_id: string;
  command_type: string;
  parameters: Record<string, any> | null;
  status: string;
  created_by: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  result: Record<string, any> | null;
  error_message: string | null;
}

export interface DeviceCommandCreate {
  device_id: string;
  command_type: string;
  parameters?: Record<string, any> | null;
}

export interface DeviceCommandUpdate {
  status?: string;
  started_at?: string | null;
  completed_at?: string | null;
  result?: Record<string, any> | null;
  error_message?: string | null;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  version: string;
  database: {
    connected: boolean;
    pool_size?: number;
  };
}

export interface SystemReadiness {
  ready: boolean;
  checks: {
    database: boolean;
    migrations: boolean;
  };
}

// Query parameters
export interface PeopleQueryParams {
  skip?: number;
  limit?: number;
  search?: string;
  access_enabled_only?: boolean;
}

export interface EventsQueryParams {
  days?: number;
  device_id?: string;
  person_id?: string;
  event_type?: string;
  skip?: number;
  limit?: number;
}

export interface TelemetryQueryParams {
  hours?: number;
  limit?: number;
}
