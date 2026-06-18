export interface Person {
  id: string;
  display_name: string;
  photo_count: number;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  person_id?: string;
  person_name?: string;
  status: "granted" | "denied" | "unknown";
  confidence: number;
  timestamp: string;
  camera_id: string;
  door_opened: boolean;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  model_loaded: boolean;
  camera_online: boolean;
}

export interface TrainModelResponse {
  success: boolean;
  message: string;
  samples_processed: number;
}

export interface DoorResponse {
  success: boolean;
  message: string;
  door_id: string;
  timestamp: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}
