export const CENTRAL_API =
  (import.meta.env.VITE_FACEGUARD_API_URL as string | undefined) ?? "/backend";
export const AGENT_API = "/agent/api/v1";

export type AgentHealth = {
  status: "ok" | "degraded";
  device_id: string;
  version: string;
  platform: string;
  camera_ready: boolean;
  camera_simulated: boolean;
  recognition_ready: boolean;
  hardware_mode: string;
  timestamp: string;
};

export type Telemetry = {
  device_id: string;
  timestamp: string;
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  uptime_seconds: number;
  cpu_temperature_c: number | null;
  camera_ready: boolean;
  camera_simulated: boolean;
  camera_fps: number;
  recognition_ready: boolean;
  model_people_count: number;
};

export type ApiPerson = {
  id: string;
  name: string;
  description: string | null;
  access_enabled: boolean;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  photo_count: number;
};

export type LocalPerson = {
  person_id: string;
  name: string;
  original_photos: number;
  processed_photos: number;
};

export type RecognitionEvent = {
  id: string;
  event_type: string;
  person_id: string | null;
  person_name: string | null;
  recognition_distance: number | null;
  door_opened: boolean;
  photo_path: string | null;
  created_at: string;
  synced: boolean;
};

export type AgentStats = {
  total_events: number;
  today_events: number;
  recognized_today: number;
  unknown_today: number;
  door_opened_today: number;
  recent_events: RecognitionEvent[];
  local_people_count: number;
  local_training_photos: number;
  recognition_ready: boolean;
  model_people_count: number;
  settings: AgentSettings;
};

export type AgentSettings = {
  recognition_threshold: number;
  recognition_consensus_frames: number;
  recognition_consensus_window: number;
  unknown_consensus_frames: number;
  recognition_process_interval_seconds: number;
  action_cooldown_seconds: number;
  door_open_duration: number;
  min_blur_score: number;
  min_brightness: number;
  max_brightness: number;
  camera_width: number;
  camera_height: number;
  camera_fps: number;
  camera_index: number;
  hardware_mode: string;
  backend_url: string;
};

export type CaptureSession = {
  session_id: string;
  person_id: string;
  display_name: string;
  status: "queued" | "running" | "training" | "completed" | "failed";
  current_index: number;
  total_steps: number;
  current_prompt: string;
  captured_count: number;
  skipped_count: number;
  steps: Array<{
    index: number;
    prompt: string;
    captured_count: number;
    skipped_count: number;
    skipped?: Array<{ index: number; reason: string }>;
  }>;
  last_result: unknown;
  training_result: null | {
    trained: boolean;
    people_count: number;
    image_count: number;
    skipped_count: number;
  };
  error: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6", "#f97316"];

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      message = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail ?? body);
    } catch {
      // Keep the HTTP status message.
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function agentJson<T>(path: string, init?: RequestInit) {
  return fetchJson<T>(`${AGENT_API}${path}`, init);
}

export function backendJson<T>(path: string, init?: RequestInit) {
  return fetchJson<T>(`${CENTRAL_API}${path}`, init);
}

export function initials(name: string | null | undefined) {
  if (!name) return "?";
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export function colorFor(value: string | null | undefined) {
  const source = value || "unknown";
  let hash = 0;
  for (const char of source) hash = (hash + char.charCodeAt(0)) % COLORS.length;
  return COLORS[hash];
}

export function formatTime(value: string | null | undefined) {
  if (!value) return "n/a";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString();
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "n/a";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "n/a";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function eventName(event: RecognitionEvent) {
  if (event.event_type === "recognized") return event.person_name ?? event.person_id ?? "Recognized";
  if (event.event_type === "manual_open") return "Manual door open";
  return "Unknown person";
}

export function eventStatus(event: RecognitionEvent): "granted" | "unknown" | "manual" {
  if (event.event_type === "recognized") return "granted";
  if (event.event_type === "manual_open") return "manual";
  return "unknown";
}

export function matchQuality(distance: number | null | undefined, threshold = 50) {
  if (distance == null) return 0;
  const ratio = Math.max(0, Math.min(1, (threshold * 1.6 - distance) / (threshold * 1.6)));
  return Math.round(ratio * 100);
}

export function formatUptime(seconds: number | null | undefined) {
  const value = Math.max(0, Math.floor(seconds ?? 0));
  const days = Math.floor(value / 86400);
  const hours = Math.floor((value % 86400) / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function eventSnapshotUrl(eventId: string | number) {
  return `${AGENT_API}/events/${eventId}/snapshot`;
}

export function groupEventsByDay(events: RecognitionEvent[]) {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    return {
      key: date.toISOString().slice(0, 10),
      day: date.toLocaleDateString(undefined, { weekday: "short" }),
      granted: 0,
      unknown: 0,
      manual: 0,
    };
  });
  for (const event of events) {
    const key = new Date(event.created_at).toISOString().slice(0, 10);
    const bucket = days.find((item) => item.key === key);
    if (!bucket) continue;
    const status = eventStatus(event);
    bucket[status] += 1;
  }
  return days;
}

export function groupEventsByHour(events: RecognitionEvent[]) {
  const buckets = Array.from({ length: 12 }, (_, index) => ({
    h: String(index * 2).padStart(2, "0"),
    v: 0,
  }));
  const today = new Date().toISOString().slice(0, 10);
  for (const event of events) {
    const date = new Date(event.created_at);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== today) continue;
    const bucket = buckets[Math.floor(date.getHours() / 2)];
    if (bucket) bucket.v += 1;
  }
  return buckets;
}
