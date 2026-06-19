import { useState, useEffect, useRef } from "react";
import {
  Camera, Zap, Monitor, RotateCcw, Square, DoorOpen,
  AlertTriangle, CheckCircle, XCircle, Maximize2,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../../api/client";
import type { Event } from "../../../api/types";

const CARD = { background: "#111111", border: "1px solid rgba(255,255,255,0.06)" };

function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  danger,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
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

function PrimaryBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: "#ffffff", color: "#080808" }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick, color }: { children: React.ReactNode; onClick?: () => void; color?: string }) {
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

export function LiveCamera() {
  const [doorConfirm, setDoorConfirm] = useState(false);
  const [restartConfirm, setRestartConfirm] = useState(false);
  const [stopConfirm, setStopConfirm] = useState(false);
  const [recognitionOn, setRecognitionOn] = useState(true);
  const [fps, setFps] = useState(24);
  const [doorOpen, setDoorOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [cameraStatus, setCameraStatus] = useState<string>("Online");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function loadEvents() {
    try {
      const data = await apiClient.getEvents(10);
      setEvents(data);
    } catch (error) {
      console.error("Failed to load events:", error);
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraStatus("Online");
        toast.success("📷 Camera connected");
      }
    } catch (error) {
      console.error("Camera error:", error);
      setCameraStatus("Offline");
      toast.error("❌ Cannot access camera - please check permissions");
    }
  }

  function stopCamera(): void {
  if (streamRef.current) {
    streamRef.current.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }
  if (videoRef.current) {
    videoRef.current.srcObject = null;
  }
  setCameraStatus("Offline");
}

  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    
    setLoading(true);
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      
      await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9);
      });
      
      toast.success("📸 Photo captured!");
    } catch (error) {
      toast.error("Failed to capture photo");
    } finally {
      setLoading(false);
    }
  }

  async function openDoor() {
    try {
      setLoading(true);
      const response = await apiClient.openDoor();
      setDoorOpen(true);
      toast.success(`🚪 ${response.message || "Door opened!"}`);
      setTimeout(() => setDoorOpen(false), 5000);
    } catch (error) {
      toast.error("Failed to open door");
    } finally {
      setLoading(false);
      setDoorConfirm(false);
    }
  }

  async function restartCamera() {
    stopCamera();
    setTimeout(() => startCamera(), 1000);
    toast.info("🔄 Camera restarting...");
    setRestartConfirm(false);
  }

  function toggleRecognition() {
    setRecognitionOn(!recognitionOn);
    toast.info(recognitionOn ? "⏹️ Recognition stopped" : "▶️ Recognition started");
  }

  useEffect(() => {
  loadEvents().catch(console.error);

  const unsubscribe = apiClient.onEvent((event: Event) => {
    setEvents(prev => [event, ...prev.slice(0, 9)]);
    toast.info(`👤 ${event.person_name || 'Unknown'} - ${event.status}`);
  });

  return () => {
    unsubscribe();
  };
}, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setFps(22 + Math.floor(Math.random() * 6)), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col xl:flex-row gap-4">
      <div className="flex-1 min-w-0 space-y-3">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)", aspectRatio: "16/9", minHeight: "300px" }}
        >

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              zIndex: 1,
              backgroundColor: "#0a0a0a"
            }}
          />
          
          <canvas ref={canvasRef} className="hidden" />

          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            zIndex: 3,
            pointerEvents: "none"
          }} />

          {recognitionOn && events.length > 0 && events.slice(0, 2).map((event, idx) => {
            const isKnown = event.status === "granted";
            const color = isKnown ? "#10b981" : "#f59e0b";
            const boxStyle = {
              top: `${20 + idx * 30}%`,
              left: `${30 + idx * 20}%`,
              width: "26%",
              height: "36%",
              border: `1.5px solid ${color}`,
              borderRadius: "4px",
              boxShadow: `0 0 24px ${color}25`,
            };
            return (
              <div key={event.id} className="absolute pointer-events-none" style={boxStyle}>
                {["tl","tr","bl","br"].map((c) => (
                  <div key={c} className="absolute w-3 h-3" style={{
                    top: c.includes("t") ? -1 : "auto",
                    bottom: c.includes("b") ? -1 : "auto",
                    left: c.includes("l") ? -1 : "auto",
                    right: c.includes("r") ? -1 : "auto",
                    borderTop: c.includes("t") ? `2px solid ${color}` : "none",
                    borderBottom: c.includes("b") ? `2px solid ${color}` : "none",
                    borderLeft: c.includes("l") ? `2px solid ${color}` : "none",
                    borderRight: c.includes("r") ? `2px solid ${color}` : "none",
                  }} />
                ))}
                <div
                  className="absolute -top-7 left-0 flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-white whitespace-nowrap"
                  style={{ background: `${color}e6` }}
                >
                  {isKnown ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {event.person_name || "Unknown"} {event.confidence?.toFixed(1)}%
                </div>
              </div>
            );
          })}

          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "rgba(0,0,0,0.7)" }}>
              <div className={`w-1.5 h-1.5 rounded-full ${cameraStatus === "Online" ? "animate-pulse" : ""}`} 
                   style={{ background: cameraStatus === "Online" ? "#10b981" : "#ef4444" }} />
              {cameraStatus === "Online" ? "LIVE" : "OFFLINE"}
            </div>
            {recognitionOn ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                <Zap className="w-3 h-3" /> AI Active
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                <XCircle className="w-3 h-3" /> AI Off
              </div>
            )}
          </div>

          <div className="absolute bottom-3 left-3 text-xs px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.7)", color: "#5a5a5a" }}>
            <Monitor className="w-3 h-3 inline mr-1" />
            {cameraStatus === "Online" ? "1280×720 · Live" : "Camera offline"}
          </div>

          <button className="absolute bottom-3 right-3 p-2 rounded-lg transition-colors" style={{ background: "rgba(0,0,0,0.7)", color: "#5a5a5a" }}>
            <Maximize2 className="w-4 h-4" />
          </button>

          {doorOpen && (
            <div className="absolute inset-x-0 top-0 py-2.5 text-center text-xs font-semibold text-white animate-pulse" style={{ background: "rgba(16,185,129,0.9)" }}>
              🚪 Door Open — closing in 5 seconds
            </div>
          )}
        </div>

        <div className="rounded-2xl p-4" style={CARD}>
          <div className="text-xs font-semibold text-white mb-3">Recent Recognition Events</div>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {events.slice(0, 4).map((ev, i) => {
              const name = ev.person_name || "Unknown";
              const color = ev.status === "granted" ? "#10b981" : ev.status === "denied" ? "#ef4444" : "#f59e0b";
              const initials = name === "Unknown" ? "?" : name.split(" ").map(n => n[0]).join("").slice(0, 2);
              const time = new Date(ev.timestamp).toTimeString().slice(0, 5);
              return (
                <div
                  key={ev.id || i}
                  className="shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl min-w-[160px]"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                    style={{ background: `${color}25`, color }}>
                    {initials}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">{name}</div>
                    <div className="text-xs mt-0.5" style={{ color }}>{ev.confidence?.toFixed(1) || 0}% · {time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="xl:w-68 shrink-0 space-y-3" style={{ width: "268px" }}>
        <div className="rounded-2xl p-4" style={CARD}>
          <div className="text-xs font-semibold text-white mb-3">Status</div>
          <StatRow label="Camera" value={cameraStatus} color={cameraStatus === "Online" ? "#10b981" : "#ef4444"} />
          <StatRow label="Recognition" value={recognitionOn ? "Running" : "Off"} color={recognitionOn ? "#10b981" : "#ef4444"} />
          <StatRow label="FPS" value={`${fps} fps`} color="#3b82f6" />
          <StatRow label="Resolution" value="1280×720" />
          <StatRow label="Faces" value={`${events.length} detected`} color="#f59e0b" />
          <div className="flex items-center justify-between pt-2.5">
            <span className="text-xs" style={{ color: "#3a3a3a" }}>Events</span>
            <span className="text-xs font-medium text-white">{events.length} total</span>
          </div>
        </div>

        <div className="rounded-2xl p-4 space-y-2" style={CARD}>
          <div className="text-xs font-semibold text-white mb-1">Controls</div>

          <PrimaryBtn onClick={capturePhoto} disabled={loading || cameraStatus !== "Online"}>
            <Camera className="w-4 h-4" /> {loading ? "Capturing..." : "Capture Photo"}
          </PrimaryBtn>

          <PrimaryBtn onClick={() => setDoorConfirm(true)} disabled={doorOpen || loading}>
            <DoorOpen className="w-4 h-4" /> {doorOpen ? "Door is Open" : "Open Door"}
          </PrimaryBtn>

          <GhostBtn onClick={() => setRestartConfirm(true)}>
            <RotateCcw className="w-4 h-4" /> Restart Camera
          </GhostBtn>

          {recognitionOn ? (
            <GhostBtn onClick={toggleRecognition} color="#ef4444">
              <Square className="w-4 h-4" /> Stop Recognition
            </GhostBtn>
          ) : (
            <GhostBtn onClick={toggleRecognition} color="#10b981">
              <Zap className="w-4 h-4" /> Start Recognition
            </GhostBtn>
          )}
        </div>

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

      {doorConfirm && (
        <ConfirmModal 
          title="Open Door?" 
          message="This will physically unlock the front door." 
          onConfirm={openDoor} 
          onCancel={() => setDoorConfirm(false)} 
        />
      )}
      {restartConfirm && (
        <ConfirmModal 
          title="Restart Camera?" 
          message="The camera feed will interrupt briefly." 
          onConfirm={restartCamera} 
          onCancel={() => setRestartConfirm(false)} 
        />
      )}
      {stopConfirm && (
        <ConfirmModal 
          title="Stop Recognition?" 
          message="Unknown visitors won't be detected." 
          onConfirm={toggleRecognition} 
          onCancel={() => setStopConfirm(false)} 
          danger 
        />
      )}
    </div>
  );
}