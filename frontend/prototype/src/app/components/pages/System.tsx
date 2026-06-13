import { useState, useEffect, useRef } from "react";
import {
  Cpu, HardDrive, Thermometer, Clock, Wifi, Camera, Zap, Server,
  RotateCcw, PowerOff, AlertTriangle, CheckCircle, XCircle,
  MemoryStick, Terminal,
} from "lucide-react";
import { toast } from "sonner";

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

function MetricCard({ icon: Icon, label, value, unit, max, color }: { icon: any; label: string; value: number; unit: string; max?: number; color: string }) {
  const pct = max ? (value / max) * 100 : value;
  return (
    <div className="rounded-2xl p-4" style={CARD}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-xs" style={{ color: "#3a3a3a" }}>{label}</span>
      </div>
      <div className="text-xl font-semibold text-white mb-2 tracking-tight">{value}{unit}</div>
      {max && (
        <>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: pct > 85 ? "#ef4444" : pct > 70 ? "#f59e0b" : color }} />
          </div>
          <div className="text-xs mt-1" style={{ color: "#3a3a3a" }}>{value} / {max}{unit}</div>
        </>
      )}
    </div>
  );
}

const INIT_LOGS = [
  "[2026-06-11 14:32:01] INFO  Face recognized: John Doe (97.4%)",
  "[2026-06-11 14:32:01] INFO  Door opened successfully",
  "[2026-06-11 14:18:45] WARN  Unknown face (confidence: 34.1%)",
  "[2026-06-11 14:18:45] INFO  Alert notification sent",
  "[2026-06-11 14:15:00] INFO  Recognition service heartbeat OK",
  "[2026-06-11 13:55:10] INFO  Face recognized: Mary Smith (91.2%)",
  "[2026-06-11 13:40:22] INFO  Face recognized: Bob Johnson (88.7%)",
  "[2026-06-11 13:00:00] INFO  System health check passed",
  "[2026-06-11 09:00:00] INFO  FaceGuard backend started",
  "[2026-06-11 08:59:55] INFO  Camera connected: 1280x720 @ 30fps",
  "[2026-06-11 08:59:50] INFO  Loading face recognition model...",
  "[2026-06-11 08:59:48] INFO  Starting FaceGuard v2.4.1",
];

function logColor(line: string) {
  if (line.includes("ERROR") || line.includes("CRIT")) return "#ef4444";
  if (line.includes("WARN"))  return "#f59e0b";
  return "#3a3a3a";
}

export function System() {
  const [confirm, setConfirm] = useState<{ title: string; message: string; action: () => void; danger: boolean } | null>(null);
  const [logs, setLogs] = useState(INIT_LOGS);
  const [cpu,  setCpu]  = useState(32);
  const [ram,  setRam]  = useState(1.2);
  const [temp, setTemp] = useState(52);

  useEffect(() => {
    const t = setInterval(() => {
      setCpu(28 + Math.floor(Math.random() * 20));
      setRam(+(1.0 + Math.random() * 0.6).toFixed(1));
      setTemp(48 + Math.floor(Math.random() * 12));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
      setLogs((p) => [`[${ts}] INFO  Recognition service heartbeat OK`, ...p.slice(0, 49)]);
    }, 8000);
    return () => clearInterval(t);
  }, []);

  function ask(title: string, message: string, action: () => void, danger = false) {
    setConfirm({ title, message, action, danger });
  }

  function doAction(label: string) {
    toast.success(`${label} initiated`);
    const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
    setLogs((p) => [`[${ts}] INFO  ${label} command executed`, ...p]);
    setConfirm(null);
  }

  const CONTROLS = [
    { label: "Restart Recognition Service", icon: Zap,      danger: false, msg: "AI will be offline for ~10 seconds." },
    { label: "Restart Camera",              icon: Camera,   danger: false, msg: "Camera stream will interrupt briefly." },
    { label: "Restart Backend",             icon: Server,   danger: false, msg: "Backend API restarts (~5 seconds)." },
    { label: "Reboot Raspberry Pi",         icon: RotateCcw,danger: true,  msg: "System reboots — offline for ~60 seconds." },
    { label: "Shutdown Raspberry Pi",       icon: PowerOff, danger: true,  msg: "System powers off. Requires physical restart." },
  ];

  return (
    <div className="space-y-6">
      {/* Services */}
      <div>
        <div className="text-xs font-semibold text-white mb-3">Service Status</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ServiceCard icon={Server} name="Raspberry Pi"    status="online"  uptime="4h 32m" />
          <ServiceCard icon={Camera} name="Camera"          status="online"  uptime="4h 30m" />
          <ServiceCard icon={Zap}    name="Recognition AI"  status="online"  uptime="4h 28m" />
          <ServiceCard icon={Wifi}   name="Backend API"     status="online"  uptime="4h 32m" />
        </div>
      </div>

      {/* Metrics */}
      <div>
        <div className="text-xs font-semibold text-white mb-3">Hardware Metrics</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard icon={Cpu}         label="CPU"         value={cpu}  unit="%" max={100} color="#3b82f6" />
          <MetricCard icon={MemoryStick} label="RAM"         value={ram}  unit=" GB" max={4} color="#8b5cf6" />
          <MetricCard icon={Thermometer} label="Temperature" value={temp} unit="°C" color={temp > 70 ? "#ef4444" : temp > 60 ? "#f59e0b" : "#10b981"} />
          <MetricCard icon={HardDrive}   label="Storage"     value={7.4}  unit=" GB" max={32} color="#10b981" />
          <MetricCard icon={Clock}       label="Uptime"      value={4}    unit="h 32m" color="#5a5a5a" />
        </div>
      </div>

      {/* Controls */}
      <div>
        <div className="text-xs font-semibold text-white mb-3">System Controls</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {CONTROLS.map(({ label, icon: Icon, danger, msg }) => (
            <button key={label}
              onClick={() => ask(`${label}?`, msg, () => doAction(label), danger)}
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
