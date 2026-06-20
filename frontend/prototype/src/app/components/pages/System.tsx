import { useEffect, useMemo, useState } from "react";
import { Activity, Camera, CheckCircle, Cpu, DoorOpen, HardDrive, Loader2, MemoryStick, RefreshCcw, Server, Terminal, Thermometer, Users, Wifi, XCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  type AgentHealth,
  type AgentStats,
  type RecognitionEvent,
  type Telemetry,
  agentJson,
  backendJson,
  eventName,
  formatDateTime,
  formatUptime,
} from "../../lib/faceguardApi";

const CARD = { background: "#111111", border: "1px solid rgba(255,255,255,0.06)" };

function ServiceCard({ icon: Icon, name, online, detail }: { icon: any; name: string; online: boolean; detail: string }) {
  const color = online ? "#10b981" : "#ef4444";
  const StatusIcon = online ? CheckCircle : XCircle;
  return (
    <div className="rounded-2xl p-4" style={CARD}>
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
          <span className="text-sm font-medium text-white">{name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
          <StatusIcon className="h-3.5 w-3.5" /> {online ? "Online" : "Offline"}
        </div>
      </div>
      <div className="text-xs" style={{ color: "#3a3a3a" }}>{detail}</div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, unit, color, max }: { icon: any; label: string; value: number | string; unit?: string; color: string; max?: number }) {
  const numeric = typeof value === "number";
  const pct = numeric && max ? Math.max(0, Math.min(100, (value / max) * 100)) : numeric ? Math.max(0, Math.min(100, value)) : 0;
  return (
    <div className="rounded-2xl p-4" style={CARD}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <span className="text-xs" style={{ color: "#3a3a3a" }}>{label}</span>
      </div>
      <div className="mb-2 text-xl font-semibold tracking-tight text-white">{numeric ? value.toFixed(Number.isInteger(value) ? 0 : 1) : value}{unit ?? ""}</div>
      {numeric && (
        <div className="h-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 85 ? "#ef4444" : pct > 70 ? "#f59e0b" : color }} />
        </div>
      )}
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, danger, disabled }: { icon: any; label: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-medium transition-all disabled:opacity-50"
      style={
        danger
          ? { background: "rgba(239,68,68,0.07)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }
          : { background: "#1a1a1a", color: "#a0a0a0", border: "1px solid rgba(255,255,255,0.06)" }
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}

function logLine(event: RecognitionEvent) {
  const label = event.event_type.toUpperCase();
  return `[${formatDateTime(event.created_at)}] ${label} ${eventName(event)} distance=${event.recognition_distance == null ? "manual" : event.recognition_distance.toFixed(1)} door=${event.door_opened ? "open" : "closed"}`;
}

function logColor(line: string) {
  if (line.includes("UNKNOWN")) return "#f59e0b";
  if (line.includes("RECOGNIZED") || line.includes("MANUAL")) return "#10b981";
  return "#3a3a3a";
}

export function System() {
  const [health, setHealth] = useState<AgentHealth | null>(null);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [events, setEvents] = useState<RecognitionEvent[]>([]);
  const [backendReady, setBackendReady] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load(showToast = false) {
    const results = await Promise.allSettled([
      agentJson<AgentHealth>("/health"),
      agentJson<Telemetry>("/telemetry"),
      agentJson<AgentStats>("/stats"),
      agentJson<RecognitionEvent[]>("/events?limit=30"),
      backendJson<{ status: string }>("/api/v1/system/readiness"),
    ]);
    if (results[0].status === "fulfilled") setHealth(results[0].value);
    if (results[1].status === "fulfilled") setTelemetry(results[1].value);
    if (results[2].status === "fulfilled") setStats(results[2].value);
    if (results[3].status === "fulfilled") setEvents(results[3].value);
    setBackendReady(results[4].status === "fulfilled" && results[4].value.status === "ready");
    if (showToast) toast.success("System status refreshed");
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const lines = useMemo(() => events.map(logLine), [events]);

  async function retrain() {
    setBusy(true);
    try {
      const result = await agentJson<{ trained: boolean; people_count: number; image_count: number }>("/recognition/train", { method: "POST" });
      toast.success(`Model trained: ${result.people_count} people, ${result.image_count} images`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function openDoor() {
    setBusy(true);
    try {
      await agentJson("/door/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration_seconds: stats?.settings.door_open_duration ?? 2, reason: "system-panel" }),
      });
      toast.success("Door command sent");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 text-xs font-semibold text-white">Service Status</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ServiceCard icon={Server} name="Local Agent" online={Boolean(health)} detail={health ? `${health.platform} · ${health.version}` : "port 8081 unavailable"} />
          <ServiceCard icon={Camera} name="Camera" online={Boolean(health?.camera_ready)} detail={health?.camera_simulated ? "simulated stream" : "laptop camera"} />
          <ServiceCard icon={Zap} name="Recognition AI" online={Boolean(health?.recognition_ready)} detail={`${stats?.model_people_count ?? 0} people · ${stats?.local_training_photos ?? 0} photos`} />
          <ServiceCard icon={Wifi} name="Backend DB" online={backendReady} detail={backendReady ? "backend-service connected" : "backend-service unavailable"} />
        </div>
      </div>

      <div>
        <div className="mb-3 text-xs font-semibold text-white">Hardware Metrics</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <MetricCard icon={Cpu} label="CPU" value={telemetry?.cpu_percent ?? 0} unit="%" max={100} color="#3b82f6" />
          <MetricCard icon={MemoryStick} label="RAM" value={telemetry?.memory_percent ?? 0} unit="%" max={100} color="#8b5cf6" />
          <MetricCard icon={HardDrive} label="Disk" value={telemetry?.disk_percent ?? 0} unit="%" max={100} color="#10b981" />
          <MetricCard icon={Camera} label="Camera FPS" value={telemetry?.camera_fps ?? 0} unit=" fps" max={30} color="#14b8a6" />
          <MetricCard icon={Thermometer} label="Temperature" value={telemetry?.cpu_temperature_c ?? "n/a"} unit={telemetry?.cpu_temperature_c == null ? "" : "°C"} color="#f59e0b" />
        </div>
      </div>

      <div>
        <div className="mb-3 text-xs font-semibold text-white">System Controls</div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <ActionButton icon={RefreshCcw} label="Refresh Status" onClick={() => void load(true)} disabled={busy} />
          <ActionButton icon={Activity} label="Retrain Recognition Model" onClick={() => void retrain()} disabled={busy} />
          <ActionButton icon={DoorOpen} label="Test Door Command" onClick={() => void openDoor()} disabled={busy} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <MetricCard icon={Users} label="Local People" value={stats?.local_people_count ?? 0} color="#10b981" />
        <MetricCard icon={CheckCircle} label="Recognized Today" value={stats?.recognized_today ?? 0} color="#10b981" />
        <MetricCard icon={DoorOpen} label="Door Opens Today" value={stats?.door_opened_today ?? 0} color="#3b82f6" />
        <MetricCard icon={Activity} label="Uptime" value={formatUptime(telemetry?.uptime_seconds)} color="#5a5a5a" />
      </div>

      <div className="overflow-hidden rounded-2xl" style={{ background: "#080808", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ background: "#0d0d0d", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5" style={{ color: "#10b981" }} />
            <span className="text-xs font-semibold text-white">Local Agent Events</span>
          </div>
          {busy && <Loader2 className="h-4 w-4 animate-spin text-white" />}
        </div>
        <div className="h-64 space-y-1 overflow-y-auto p-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {lines.length === 0 ? (
            <div className="text-xs" style={{ color: "#3a3a3a" }}>No local events yet</div>
          ) : (
            lines.map((line, index) => (
              <div key={`${line}-${index}`} className="text-xs leading-relaxed" style={{ color: logColor(line) }}>
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
