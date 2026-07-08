import { useMemo, useState } from "react";
import {
  Cpu, HardDrive, Thermometer, Clock, Wifi, Camera, Zap, Server,
  RotateCcw, PowerOff, AlertTriangle, CheckCircle, XCircle,
  MemoryStick, Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { useGetDevices } from "../../../hooks/api/useDevices";
import { useGetLatestTelemetry } from "../../../hooks/api/useTelemetry";
import {
  useGetCommands,
  useRebootDevice,
  useRebuildModel,
  useRestartAgent,
  useRestartCamera,
  useRestartRecognition,
  useSendCommand,
} from "../../../hooks/api/useCommands";
import { useGetSystemHealth, useGetSystemReadiness } from "../../../hooks/api/useSystem";

const CARD = { background: "#111111", border: "1px solid rgba(255,255,255,0.06)" };

function ConfirmModal({
  title, message, onConfirm, onCancel, danger,
}: { title: string; message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onCancel} />
      <div className="relative rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: danger ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)" }}>
          <AlertTriangle className="w-5 h-5" style={{ color: danger ? "#ef4444" : "#f59e0b" }} />
        </div>
        <h3 className="text-sm font-semibold text-white text-center mb-2">{title}</h3>
        <p className="text-xs text-center mb-5 leading-relaxed" style={{ color: "#5a5a5a" }}>{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "#1a1a1a", color: "#a0a0a0" }}>Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: danger ? "#ef4444" : "#ffffff", color: danger ? "#fff" : "#080808" }}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ icon: Icon, name, status, uptime }: { icon: any; name: string; status: "online"|"offline"|"warning"; uptime?: string }) {
  const cfg = {
    online:  { color: "#10b981", bg: "rgba(16,185,129,0.1)",  label: "Online",  Icon: CheckCircle   },
    offline: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   label: "Offline", Icon: XCircle       },
    warning: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  label: "Warning", Icon: AlertTriangle },
  }[status];
  const SI = cfg.Icon;
  return (
    <div className="rounded-2xl p-4" style={CARD}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
          </div>
          <span className="text-sm font-medium text-white">{name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: cfg.color }}>
          <SI className="w-3.5 h-3.5" /> {cfg.label}
        </div>
      </div>
      {uptime && <div className="text-xs" style={{ color: "#3a3a3a" }}>Uptime: {uptime}</div>}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, unit, max, color }: { icon: any; label: string; value: number | null; unit: string; max?: number; color: string }) {
  const display = value === null ? "--" : Number.isInteger(value) ? value : value.toFixed(1);
  const pct = value === null ? 0 : max ? (value / max) * 100 : value;
  return (
    <div className="rounded-2xl p-4" style={CARD}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-xs" style={{ color: "#3a3a3a" }}>{label}</span>
      </div>
      <div className="text-xl font-semibold text-white mb-2 tracking-tight">{display}{value === null ? "" : unit}</div>
      {max && (
        <>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, pct)}%`, background: pct > 85 ? "#ef4444" : pct > 70 ? "#f59e0b" : color }} />
          </div>
          <div className="text-xs mt-1" style={{ color: "#3a3a3a" }}>{display} / {max}{value === null ? "" : unit}</div>
        </>
      )}
    </div>
  );
}

function logColor(line: string) {
  if (line.includes("failed") || line.includes("offline")) return "#ef4444";
  if (line.includes("pending") || line.includes("warning")) return "#f59e0b";
  return "#3a3a3a";
}

function formatUptime(seconds?: number | null) {
  if (!seconds) return undefined;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function serviceStatus(value?: string | null): "online" | "offline" | "warning" {
  if (!value) return "warning";
  const normalized = value.toLowerCase();
  if (["ok", "online", "running", "healthy"].includes(normalized)) return "online";
  if (["offline", "error", "failed"].includes(normalized)) return "offline";
  return "warning";
}

export function System() {
  const [confirm, setConfirm] = useState<{ title: string; message: string; action: () => void; danger: boolean } | null>(null);

  const { data: devices = [], isLoading: devicesLoading } = useGetDevices();
  const activeDevice = useMemo(
    () => devices.find((d) => d.status === "online") ?? devices[0],
    [devices]
  );
  const deviceId = activeDevice?.id ?? "";

  const { data: telemetry, isError: telemetryError } = useGetLatestTelemetry(deviceId);
  const { data: health } = useGetSystemHealth();
  const { data: readiness } = useGetSystemReadiness();
  const { data: commands = [] } = useGetCommands(deviceId || undefined);
  const restartRecognition = useRestartRecognition();
  const restartCamera = useRestartCamera();
  const restartAgent = useRestartAgent();
  const rebootDevice = useRebootDevice();
  const rebuildModel = useRebuildModel();
  const sendCommand = useSendCommand();

  const logs = useMemo(() => {
    const commandLines = commands.slice(0, 40).map((command) => {
      const ts = format(parseISO(command.created_at), "yyyy-MM-dd HH:mm:ss");
      return `[${ts}] ${command.status} ${command.command_type}`;
    });

    const baseLines = [
      `[${format(new Date(), "yyyy-MM-dd HH:mm:ss")}] ${health?.status ?? "warning"} Backend API health`,
      `[${format(new Date(), "yyyy-MM-dd HH:mm:ss")}] ${readiness?.ready ? "ready" : "warning"} Backend readiness`,
      activeDevice
        ? `[${format(new Date(), "yyyy-MM-dd HH:mm:ss")}] ${activeDevice.status} Device ${activeDevice.name}`
        : `[${format(new Date(), "yyyy-MM-dd HH:mm:ss")}] offline No registered device`,
    ];

    return [...baseLines, ...commandLines].slice(0, 50);
  }, [activeDevice, commands, health?.status, readiness?.ready]);

  function ask(title: string, message: string, action: () => void, danger = false) {
    setConfirm({ title, message, action, danger });
  }

  function requireDevice(action: () => void) {
    if (!deviceId) {
      toast.error("No device available");
      setConfirm(null);
      return;
    }
    action();
    setConfirm(null);
  }

  const CONTROLS = [
    {
      label: "Rebuild Recognition Model",
      icon: Zap,
      danger: false,
      msg: "This will retrain the AI model with all current photos. Recognition will be unavailable during training.",
      action: () => requireDevice(() => rebuildModel.mutate(deviceId)),
    },
    {
      label: "Restart Recognition Service",
      icon: Zap,
      danger: false,
      msg: "AI will be offline for a short time.",
      action: () => requireDevice(() => restartRecognition.mutate(deviceId)),
    },
    {
      label: "Restart Camera",
      icon: Camera,
      danger: false,
      msg: "Camera stream will interrupt briefly.",
      action: () => requireDevice(() => restartCamera.mutate(deviceId)),
    },
    {
      label: "Restart Backend",
      icon: Server,
      danger: false,
      msg: "A restart agent command will be sent to the device.",
      action: () => requireDevice(() => restartAgent.mutate(deviceId)),
    },
    {
      label: "Reboot Raspberry Pi",
      icon: RotateCcw,
      danger: true,
      msg: "System reboots and will be offline for about a minute.",
      action: () => requireDevice(() => rebootDevice.mutate({ deviceId, delay: 10 })),
    },
    {
      label: "Shutdown Raspberry Pi",
      icon: PowerOff,
      danger: true,
      msg: "A shutdown command will be queued for the device.",
      action: () => requireDevice(() => sendCommand.mutate({ device_id: deviceId, command_type: "shutdown_device", parameters: null })),
    },
  ];

  const cpu = telemetry?.cpu_usage ?? null;
  const ram = telemetry?.ram_usage ?? null;
  const temp = telemetry?.cpu_temperature ?? null;
  const disk = telemetry?.disk_usage ?? null;
  const fps = telemetry?.camera_fps ?? null;
  const uptime = formatUptime(telemetry?.uptime);

  return (
    <div className="space-y-6">
      {devicesLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Services */}
      <div>
        <div className="text-xs font-semibold text-white mb-3">Service Status</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ServiceCard icon={Server} name={activeDevice?.name ?? "Raspberry Pi"} status={serviceStatus(activeDevice?.status)} uptime={uptime} />
          <ServiceCard icon={Camera} name="Camera" status={serviceStatus(activeDevice?.camera_status)} uptime={activeDevice?.last_seen_at ? formatDistanceToNow(parseISO(activeDevice.last_seen_at), { addSuffix: true }) : undefined} />
          <ServiceCard icon={Zap} name="Recognition AI" status={serviceStatus(activeDevice?.recognition_status)} uptime={activeDevice?.software_version ? `v${activeDevice.software_version}` : undefined} />
          <ServiceCard icon={Wifi} name="Backend API" status={health?.status === "healthy" || health?.status === "ok" ? "online" : readiness?.ready ? "warning" : "offline"} uptime={health?.version ? `v${health.version}` : undefined} />
        </div>
      </div>

      {/* Metrics */}
      <div>
        <div className="text-xs font-semibold text-white mb-3">Hardware Metrics</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard icon={Cpu} label="CPU" value={cpu} unit="%" max={100} color="#3b82f6" />
          <MetricCard icon={MemoryStick} label="RAM" value={ram} unit="%" max={100} color="#8b5cf6" />
          <MetricCard icon={Thermometer} label="Temperature" value={temp} unit="C" max={100} color={(temp ?? 0) > 70 ? "#ef4444" : (temp ?? 0) > 60 ? "#f59e0b" : "#10b981"} />
          <MetricCard icon={HardDrive} label="Storage" value={disk} unit="%" max={100} color="#10b981" />
          <MetricCard icon={Clock} label="FPS" value={fps} unit="" max={60} color="#5a5a5a" />
        </div>
        {telemetryError && (
          <p className="text-xs mt-2" style={{ color: "#f59e0b" }}>No telemetry data found for this device yet.</p>
        )}
      </div>

      {/* Controls */}
      <div>
        <div className="text-xs font-semibold text-white mb-3">System Controls</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {CONTROLS.map(({ label, icon: Icon, danger, msg, action }) => (
            <button key={label}
              onClick={() => ask(`${label}?`, msg, action, danger)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all text-left"
              style={
                danger
                  ? { background: "rgba(239,68,68,0.07)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }
                  : { background: "#1a1a1a", color: "#a0a0a0", border: "1px solid rgba(255,255,255,0.06)" }
              }>
              <Icon className="w-4 h-4 shrink-0" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#080808", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between px-4 py-3"
          style={{ background: "#0d0d0d", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
            <span className="text-xs font-semibold text-white">System Logs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#10b981" }} />
            <span className="text-xs" style={{ color: "#3a3a3a" }}>Live</span>
          </div>
        </div>
        <div className="p-4 h-64 overflow-y-auto space-y-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {logs.map((line, i) => (
            <div key={i} className="text-xs leading-relaxed" style={{ color: logColor(line) }}>
              {line}
            </div>
          ))}
        </div>
      </div>

      {confirm && (
        <ConfirmModal
          title={confirm.title} message={confirm.message}
          onConfirm={confirm.action} onCancel={() => setConfirm(null)} danger={confirm.danger} />
      )}
    </div>
  );
}
