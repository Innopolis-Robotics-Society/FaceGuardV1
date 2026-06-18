import { useState, useEffect } from "react";
import {
  Camera, Zap, Monitor, RotateCcw, Square, DoorOpen,
  AlertTriangle, CheckCircle, XCircle, Maximize2,
} from "lucide-react";
import { toast } from "sonner";

const CARD  = { background: "#111111", border: "1px solid rgba(255,255,255,0.06)" };

/* ── Confirm Modal ───────────────────────────────────────── */
function ConfirmModal({
  title, message, onConfirm, onCancel, danger,
}: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onCancel} />
      <div
        className="relative rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4`}
          style={{ background: danger ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)" }}
        >
          <AlertTriangle className="w-5 h-5" style={{ color: danger ? "#ef4444" : "#f59e0b" }} />
        </div>
        <h3 className="text-sm font-semibold text-white text-center mb-2">{title}</h3>
        <p className="text-xs text-center mb-5 leading-relaxed" style={{ color: "#5a5a5a" }}>
          {message}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "#1a1a1a", color: "#a0a0a0" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={
              danger
                ? { background: "#ef4444", color: "#fff" }
                : { background: "#ffffff", color: "#080808" }
            }
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      className="flex items-center justify-between py-2.5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
    >
      <span className="text-xs" style={{ color: "#3a3a3a" }}>{label}</span>
      <span className="text-xs font-medium" style={{ color: color ?? "#f0f0f0" }}>{value}</span>
    </div>
  );
}

/* ── Primary button ─────────────────────────────────────── */
function PrimaryBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
      style={{ background: "#ffffff", color: "#080808" }}
    >
      {children}
    </button>
  );
}

/* ── Ghost / secondary button ───────────────────────────── */
function GhostBtn({
  children, onClick, color,
}: { children: React.ReactNode; onClick?: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
      style={{ background: "#1a1a1a", color: color ?? "#a0a0a0", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {children}
    </button>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export function LiveCamera() {
  const [doorConfirm,    setDoorConfirm]    = useState(false);
  const [restartConfirm, setRestartConfirm] = useState(false);
  const [stopConfirm,    setStopConfirm]    = useState(false);
  const [recognitionOn,  setRecognitionOn]  = useState(true);
  const [fps, setFps] = useState(24);
  const [doorOpen, setDoorOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setFps(22 + Math.floor(Math.random() * 6)), 2000);
    return () => clearInterval(t);
  }, []);

  function openDoor() {
    setDoorOpen(true);
    toast.success("Door opened — closing in 5 s");
    setTimeout(() => setDoorOpen(false), 5000);
    setDoorConfirm(false);
  }
  function restartCamera() { toast.info("Camera restarting…"); setRestartConfirm(false); }
  function stopRecognition() { setRecognitionOn(false); toast.warning("Recognition stopped"); setStopConfirm(false); }

  return (
    <div className="flex flex-col xl:flex-row gap-4">
      {/* Camera feed */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Main feed */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)", aspectRatio: "16/9", minHeight: "300px" }}
        >
          {/* Subtle grid */}
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />

          {recognitionOn && (
            <>
              {/* Primary face box */}
              <div
                className="absolute"
                style={{ top: "20%", left: "30%", width: "26%", height: "46%", border: "1.5px solid #10b981", borderRadius: "4px", boxShadow: "0 0 24px rgba(16,185,129,0.15)" }}
              >
                {["tl","tr","bl","br"].map((c) => (
                  <div key={c} className="absolute w-3 h-3" style={{
                    top:    c.includes("t") ? -1 : "auto", bottom: c.includes("b") ? -1 : "auto",
                    left:   c.includes("l") ? -1 : "auto", right:  c.includes("r") ? -1 : "auto",
                    borderTop:    c.includes("t") ? "2px solid #10b981" : "none",
                    borderBottom: c.includes("b") ? "2px solid #10b981" : "none",
                    borderLeft:   c.includes("l") ? "2px solid #10b981" : "none",
                    borderRight:  c.includes("r") ? "2px solid #10b981" : "none",
                  }} />
                ))}
                <div
                  className="absolute -top-7 left-0 flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-white"
                  style={{ background: "rgba(16,185,129,0.9)", whiteSpace: "nowrap" }}
                >
                  <CheckCircle className="w-3 h-3" /> John Doe 97.4%
                </div>
              </div>

              {/* Secondary — unknown */}
              <div
                className="absolute"
                style={{ top: "28%", right: "16%", width: "18%", height: "32%", border: "1.5px solid #f59e0b", borderRadius: "4px", boxShadow: "0 0 16px rgba(245,158,11,0.1)" }}
              >
                <div
                  className="absolute -top-7 left-0 flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-white"
                  style={{ background: "rgba(245,158,11,0.9)", whiteSpace: "nowrap" }}
                >
                  <AlertTriangle className="w-3 h-3" /> Unknown 34%
                </div>
              </div>
            </>
          )}

          {/* Overlays */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "rgba(0,0,0,0.7)" }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#ef4444" }} />
              LIVE
            </div>
            {recognitionOn
              ? <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}><Zap className="w-3 h-3" /> AI Active</div>
              : <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}><XCircle className="w-3 h-3" /> AI Off</div>
            }
          </div>

          <div className="absolute bottom-3 left-3 text-xs px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.7)", color: "#5a5a5a" }}>
            <Monitor className="w-3 h-3 inline mr-1" />1280×720 · {fps} fps
          </div>

          <button className="absolute bottom-3 right-3 p-2 rounded-lg transition-colors" style={{ background: "rgba(0,0,0,0.7)", color: "#5a5a5a" }}>
            <Maximize2 className="w-4 h-4" />
          </button>

          {doorOpen && (
            <div className="absolute inset-x-0 top-0 py-2.5 text-center text-xs font-semibold text-white" style={{ background: "rgba(16,185,129,0.9)" }}>
              Door Open — closing in 5 seconds
            </div>
          )}
        </div>

        {/* Event strip */}
        <div className="rounded-2xl p-4" style={CARD}>
          <div className="text-xs font-semibold text-white mb-3">Recognition Events</div>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {[
              { name: "John Doe",  conf: 97.4, color: "#10b981", time: "14:32" },
              { name: "Unknown",   conf: 34.1, color: "#f59e0b", time: "14:18" },
              { name: "Mary Smith",conf: 91.2, color: "#3b82f6", time: "13:55" },
              { name: "Bob J.",    conf: 88.7, color: "#8b5cf6", time: "13:40" },
            ].map((ev, i) => (
              <div
                key={i}
                className="shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl min-w-[160px]"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{ background: `${ev.color}15`, color: ev.color }}>
                  {ev.name === "Unknown" ? "?" : ev.name.split(" ").map((n) => n[0]).join("").slice(0,2)}
                </div>
                <div>
                  <div className="text-xs font-medium text-white">{ev.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: ev.color }}>{ev.conf}% · {ev.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Control panel */}
      <div className="xl:w-68 shrink-0 space-y-3" style={{ width: "268px" }}>
        {/* Status */}
        <div className="rounded-2xl p-4" style={CARD}>
          <div className="text-xs font-semibold text-white mb-3">Status</div>
          <StatRow label="Camera"      value="Online"                             color="#10b981" />
          <StatRow label="Recognition" value={recognitionOn ? "Running" : "Off"} color={recognitionOn ? "#10b981" : "#ef4444"} />
          <StatRow label="FPS"         value={`${fps} fps`}                       color="#3b82f6" />
          <StatRow label="Resolution"  value="1280×720" />
          <StatRow label="Faces"       value="2 detected"                         color="#f59e0b" />
          <div className="flex items-center justify-between pt-2.5">
            <span className="text-xs" style={{ color: "#3a3a3a" }}>Uptime</span>
            <span className="text-xs font-medium text-white">4h 32m</span>
          </div>
        </div>

        {/* Controls */}
        <div className="rounded-2xl p-4 space-y-2" style={CARD}>
          <div className="text-xs font-semibold text-white mb-1">Controls</div>

          <PrimaryBtn onClick={() => toast.info("Photo captured")}>
            <Camera className="w-4 h-4" /> Capture Photo
          </PrimaryBtn>

          <PrimaryBtn onClick={() => setDoorConfirm(true)} disabled={doorOpen}>
            <DoorOpen className="w-4 h-4" /> {doorOpen ? "Door is Open" : "Open Door"}
          </PrimaryBtn>

          <GhostBtn onClick={() => setRestartConfirm(true)}>
            <RotateCcw className="w-4 h-4" /> Restart Camera
          </GhostBtn>

          {recognitionOn ? (
            <GhostBtn onClick={() => setStopConfirm(true)} color="#ef4444">
              <Square className="w-4 h-4" /> Stop Recognition
            </GhostBtn>
          ) : (
            <GhostBtn onClick={() => { setRecognitionOn(true); toast.success("Recognition started"); }} color="#10b981">
              <Zap className="w-4 h-4" /> Start Recognition
            </GhostBtn>
          )}
        </div>

        {/* Quick settings */}
        <div className="rounded-2xl p-4 space-y-4" style={CARD}>
          <div className="text-xs font-semibold text-white">Quick Settings</div>
          <div>
            <div className="flex justify-between text-xs mb-2" style={{ color: "#3a3a3a" }}>
              <span>Confidence threshold</span>
              <span style={{ color: "#10b981" }}>75%</span>
            </div>
            <input type="range" min={50} max={99} defaultValue={75} className="w-full h-1 accent-green-500" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-2" style={{ color: "#3a3a3a" }}>
              <span>Max FPS</span>
              <span style={{ color: "#3b82f6" }}>30</span>
            </div>
            <input type="range" min={5} max={60} defaultValue={30} className="w-full h-1 accent-blue-500" />
          </div>
        </div>
      </div>

      {doorConfirm    && <ConfirmModal title="Open Door?"           message="This will physically unlock the front door." onConfirm={openDoor}          onCancel={() => setDoorConfirm(false)} />}
      {restartConfirm && <ConfirmModal title="Restart Camera?"      message="The camera feed will interrupt briefly."     onConfirm={restartCamera}      onCancel={() => setRestartConfirm(false)} />}
      {stopConfirm    && <ConfirmModal title="Stop Recognition?"    message="Unknown visitors won't be detected."         onConfirm={stopRecognition}    onCancel={() => setStopConfirm(false)}    danger />}
    </div>
  );
}
