import { Event } from "../api/types";

export interface LogEntry {
  id: string;
  name: string;
  initials: string;
  color: string;
  date: string;
  time: string;
  confidence: number;
  status: "granted" | "denied" | "unknown";
  action: string;
  doorOpened: boolean;
}

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#6366f1",
];

let colorIndex = 0;
const nameColorMap: Map<string, string> = new Map();

function getColorForName(name: string): string {
  if (!nameColorMap.has(name)) {
    nameColorMap.set(name, COLORS[colorIndex++ % COLORS.length]);
  }
  return nameColorMap.get(name)!;
}

export function transformEventToLog(event: Event): LogEntry {
  const name = event.person_name || "Unknown";
  const initials = name === "Unknown" ? "?" : name.split(" ").map((n) => n[0]).join("").toUpperCase();
  const timestamp = new Date(event.timestamp);
  const date = timestamp.toISOString().split("T")[0];
  const time = timestamp.toTimeString().split(" ")[0];

  const actionMap: Record<string, string> = {
    granted: "Door opened",
    denied: "Access denied",
    unknown: "Alert sent",
  };

  return {
    id: event.id,
    name,
    initials,
    color: getColorForName(name),
    date,
    time,
    confidence: event.confidence,
    status: event.status,
    action: actionMap[event.status],
    doorOpened: event.door_opened,
  };
}

export function getStatusConfig(status: "granted" | "denied" | "unknown") {
  const configs = {
    granted: {
      label: "Access Granted",
      color: "#10b981",
      bg: "rgba(16,185,129,0.1)",
    },
    denied: {
      label: "Access Denied",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.1)",
    },
    unknown: {
      label: "Unknown Person",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
    },
  };

  return configs[status];
}

export function generateInitials(name: string): string {
  if (name === "Unknown") return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function formatTime(isoString: string): { date: string; time: string } {
  const timestamp = new Date(isoString);
  const date = timestamp.toISOString().split("T")[0];
  const time = timestamp.toTimeString().split(" ")[0];
  return { date, time };
}
