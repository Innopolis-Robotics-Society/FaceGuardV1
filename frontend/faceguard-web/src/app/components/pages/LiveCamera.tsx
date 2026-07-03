import { useState, useEffect, useRef, useMemo } from "react";
import {
  Camera, Zap, Monitor, RotateCcw, Square, DoorOpen,
  AlertTriangle, CheckCircle, XCircle, Maximize2, Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { useGetDevices } from "../../../hooks/api/useDevices";
import { useGetLatestTelemetry } from "../../../hooks/api/useTelemetry";
import { useGetEvents } from "../../../hooks/api/useEvents";
import { useGetPeople } from "../../../hooks/api/usePeople";
import {
  useOpenDoor,
  useRestartCamera,
  useRestartRecognition,
  useSendCommand,
} from "../../../hooks/api/useCommands";
import { apiService } from "../../../services/api.service";
import { AccessEvent } from "../../../types/api.types";
import { useWebSocket, useWebSocketEvent } from "../../../hooks/useWebSocket";
import { useQueryClient } from "@tanstack/react-query";
import { formatRecognitionDistanceSummary } from "../../../utils/recognitionScore";

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
  const [doorConfirm, setDoorConfirm] = useState(false);
  const [restartConfirm, setRestartConfirm] = useState(false);
  const [stopConfirm, setStopConfirm] = useState(false);
  const [streamConnected, setStreamConnected] = useState(false);
  const [streamSettings, setStreamSettings] = useState<any>({ fps: 30, quality: 85, resolution: "720p", available_resolutions: ["720p", "480p", "360p"] });
  const [tempFps, setTempFps] = useState(30);
  const [lastFrame, setLastFrame] = useState<string>("");
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const queryClient = useQueryClient();

  // API hooks
  const { data: devices = [] } = useGetDevices();
  const { data: people = [] } = useGetPeople();
  const activeDevice = useMemo(
    () => devices.find((d) => d.status === "online") ?? devices[0],
    [devices]
  );
  const deviceId = activeDevice?.id ?? "";

  const { data: telemetry } = useGetLatestTelemetry(deviceId);
  const { data: recentEvents = [] } = useGetEvents(
    deviceId ? { device_id: deviceId, limit: 10 } : undefined,
    { enabled: !!deviceId }
  );

  const openDoorMutation = useOpenDoor();
  const restartCameraMutation = useRestartCamera();
  const restartRecognitionMutation = useRestartRecognition();
  const sendCommandMutation = useSendCommand();

  // WebSocket connection
  const { isConnected: wsConnected } = useWebSocket({
    autoConnect: true,
    onConnected: () => {
      console.log("[LiveCamera] WebSocket connected");
    },
    onDisconnected: () => {
      console.log("[LiveCamera] WebSocket disconnected");
    },
    onError: (error) => {
      console.error("[LiveCamera] WebSocket error:", error);
    },
  });

  // Listen for recognition events
  useWebSocketEvent("recognition_event", (data: any) => {
    console.log("[LiveCamera] Recognition event:", data);

    // Show toast notification
    if (data.event_type === "recognized" && data.person_name) {
      toast.success(`${data.person_name} recognized`, {
        description: formatRecognitionDistanceSummary(data.confidence),
      });
    } else if (data.event_type === "unknown") {
      toast.warning("Unknown person detected", {
        description: formatRecognitionDistanceSummary(data.confidence),
      });
    }

    // Invalidate events query to refresh the list
    queryClient.invalidateQueries({ queryKey: ["events"] });
  });

  // Listen for door events
  useWebSocketEvent("door_event", (data: any) => {
    console.log("[LiveCamera] Door event:", data);
    if (data.door_opened) {
      toast.info("Door opened");
    }
  });

  // Listen for command status updates
  useWebSocketEvent("command_status", (data: any) => {
    console.log("[LiveCamera] Command status:", data);
    if (data.status === "completed") {
      toast.success(`Command completed: ${data.command_type}`);
    } else if (data.status === "failed") {
      toast.error(`Command failed: ${data.command_type}`);
    }
    queryClient.invalidateQueries({ queryKey: ["commands"] });
  });

  const recognitionOn = activeDevice?.recognition_status === "running";
  const fps = telemetry?.camera_fps ?? 0;
  const uptime = telemetry?.uptime ?? 0;

  // Stream URL
  const streamUrl = deviceId ? apiService.getCameraStreamUrl(deviceId) : "";

  // Setup stream connection
  useEffect(() => {
    if (!streamUrl || !imgRef.current) return;

    const img = imgRef.current;

    const captureFrame = () => {
      if (img.complete && img.naturalHeight !== 0) {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          setLastFrame(canvas.toDataURL('image/jpeg', 0.8));
        }
      }
    };

    img.onload = () => {
      setStreamConnected(true);
      captureFrame();
    };

    img.onerror = () => {
      setStreamConnected(false);
      toast.error("Camera stream unavailable");
    };

    const interval = setInterval(captureFrame, 1000);

    return () => {
      img.onload = null;
      img.onerror = null;
      clearInterval(interval);
    };
  }, [streamUrl]);

  // Load stream settings
  useEffect(() => {
    if (!deviceId) return;
    apiService.getStreamSettings().then((settings) => {
      setStreamSettings(settings);
      setTempFps(settings.fps);
    }).catch(console.error);
  }, [deviceId]);

  // People map for name lookup
  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  function getEventName(event: AccessEvent) {
    return event.person_id && peopleById.has(event.person_id)
      ? peopleById.get(event.person_id)!.name
      : "Unknown";
  }

  function getEventInitials(name: string) {
    if (name === "Unknown") return "?";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  }

  function getEventColor(event: AccessEvent) {
    if (event.event_type === "unknown") return "#f59e0b";
    if (event.event_type === "access_denied") return "#ef4444";
    return "#10b981";
  }

  function openDoor() {
    if (!deviceId) return;
    openDoorMutation.mutate({ deviceId, duration: 5 }, {
      onSuccess: () => {
        setDoorConfirm(false);
        toast.success("Door opened — closing in 5s");
      },
    });
  }

  function restartCamera() {
    if (!deviceId) return;
    restartCameraMutation.mutate(deviceId, {
      onSuccess: () => {
        setRestartConfirm(false);
        toast.info("Camera restarting…");
      },
    });
  }

  function stopRecognition() {
    if (!deviceId) return;
    sendCommandMutation.mutate({
      device_id: deviceId,
      command_type: "stop_recognition",
      parameters: null,
    }, {
      onSuccess: () => {
        setStopConfirm(false);
        toast.warning("Recognition stopped");
      },
    });
  }

  function startRecognition() {
    if (!deviceId) return;
    restartRecognitionMutation.mutate(deviceId, {
      onSuccess: () => toast.success("Recognition started"),
    });
  }

  function formatUptime(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  async function updateStreamSettings(fps?: number, resolution?: string) {
    if (isUpdatingSettings) return;

    setIsUpdatingSettings(true);
    try {
      const updated = await apiService.updateStreamSettings({ fps, resolution });
      setStreamSettings(updated);
      setTempFps(updated.fps);
      toast.success("Stream settings updated");

      if (imgRef.current && lastFrame) {
        const currentSrc = imgRef.current.src;
        imgRef.current.src = lastFrame;
        setTimeout(() => {
          if (imgRef.current) imgRef.current.src = currentSrc;
        }, 100);
      }
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setIsUpdatingSettings(false);
    }
  }

  function handleFpsChange(value: number) {
    setTempFps(value);
  }

  function handleFpsCommit() {
    if (tempFps !== streamSettings.fps) {
      updateStreamSettings(tempFps, undefined);
    }
  }

  async function handleResolutionChange(resolution: string) {
    updateStreamSettings(undefined, resolution);
  }

  return (
    <div className="flex flex-col xl:flex-row gap-4">
      {/* Camera feed */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Main feed */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)", aspectRatio: "16/9", minHeight: "300px" }}
        >
          {/* Video stream */}
          {streamUrl ? (
            <img
              ref={imgRef}
              src={streamUrl}
              alt="Live camera feed"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: streamConnected ? "block" : "none" }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-12 h-12 mb-3 mx-auto" style={{ color: "#1a1a1a" }} />
                <p className="text-sm font-medium text-white mb-1">No device available</p>
                <p className="text-xs" style={{ color: "#3a3a3a" }}>Connect a device to view stream</p>
              </div>
            </div>
          )}

          {/* Loading state with frozen frame */}
          {streamUrl && !streamConnected && lastFrame && (
            <img
              src={lastFrame}
              alt="Last frame"
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
          )}

          {/* Loading state */}
          {streamUrl && !streamConnected && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: lastFrame ? "rgba(0,0,0,0.5)" : "transparent" }}>
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-white">Connecting to camera...</p>
              </div>
            </div>
          )}

          {/* Subtle grid overlay */}
          {streamConnected && (
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }} />
          )}

          {/* Overlays */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "rgba(0,0,0,0.7)" }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: streamConnected ? "#ef4444" : "#5a5a5a" }} />
              {streamConnected ? "LIVE" : "OFFLINE"}
            </div>
            {recognitionOn
              ? <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}><Zap className="w-3 h-3" /> AI Active</div>
              : <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}><XCircle className="w-3 h-3" /> AI Off</div>
            }
          </div>

          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(0,0,0,0.7)", color: wsConnected ? "#10b981" : "#5a5a5a" }}>
              <Wifi className="w-3 h-3" />
              {wsConnected ? "Connected" : "Disconnected"}
            </div>
          </div>

          <div className="absolute bottom-3 left-3 text-xs px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.7)", color: "#5a5a5a" }}>
            <Monitor className="w-3 h-3 inline mr-1" />
            {telemetry?.camera_fps ? `${Math.round(telemetry.camera_fps)} fps` : "-- fps"}
          </div>

          <button className="absolute bottom-3 right-3 p-2 rounded-lg transition-colors" style={{ background: "rgba(0,0,0,0.7)", color: "#5a5a5a" }}>
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Event strip */}
        <div className="rounded-2xl p-4" style={CARD}>
          <div className="text-xs font-semibold text-white mb-3">Recent Events ({recentEvents.length})</div>
          {recentEvents.length === 0 ? (
            <p className="text-xs py-4 text-center" style={{ color: "#3a3a3a" }}>No recent events</p>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {recentEvents.map((event) => {
                const name = getEventName(event);
                const color = getEventColor(event);
                const initials = getEventInitials(name);
                const time = format(parseISO(event.created_at), "HH:mm");
                return (
                  <div
                    key={event.id}
                    className="shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl min-w-[160px]"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                      style={{ background: `${color}15`, color }}>
                      {initials}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">{name}</div>
                      <div className="text-xs mt-0.5" style={{ color }}>
                        {formatRecognitionDistanceSummary(event.confidence).replace("Distance: ", "")} · {time}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Control panel */}
      <div className="xl:w-68 shrink-0 space-y-3" style={{ width: "268px" }}>
        {/* Stream Settings */}
        <div className="rounded-2xl p-4" style={CARD}>
          <div className="text-xs font-semibold text-white mb-3">Stream Settings</div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: "#3a3a3a" }}>FPS</span>
                <span className="text-xs font-medium text-white">{tempFps}</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={tempFps}
                onChange={(e) => handleFpsChange(parseInt(e.target.value))}
                onMouseUp={handleFpsCommit}
                onTouchEnd={handleFpsCommit}
                className="w-full h-1 rounded-lg appearance-none cursor-pointer"
                style={{ background: "rgba(255,255,255,0.1)" }}
              />
            </div>

            <div>
              <label className="text-xs block mb-2" style={{ color: "#3a3a3a" }}>Resolution</label>
              <select
                value={streamSettings.resolution || "720p"}
                onChange={(e) => handleResolutionChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs font-medium text-white bg-[#1a1a1a] border border-white/10 focus:outline-none focus:border-white/20"
              >
                <option value="1080p" disabled={!streamSettings.available_resolutions?.includes("1080p")}>
                  1080p FHD {!streamSettings.available_resolutions?.includes("1080p") ? "(Unavailable)" : ""}
                </option>
                <option value="720p" disabled={!streamSettings.available_resolutions?.includes("720p")}>
                  720p HD
                </option>
                <option value="480p">480p</option>
                <option value="360p">360p</option>
              </select>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="rounded-2xl p-4 space-y-2" style={CARD}>
          <div className="text-xs font-semibold text-white mb-1">Controls</div>

          <PrimaryBtn onClick={() => toast.info("Capture functionality available through PersonProfile")} disabled={!deviceId}>
            <Camera className="w-4 h-4" /> Capture Photo
          </PrimaryBtn>

          <PrimaryBtn onClick={() => setDoorConfirm(true)} disabled={!deviceId || openDoorMutation.isPending}>
            <DoorOpen className="w-4 h-4" /> {openDoorMutation.isPending ? "Opening..." : "Open Door"}
          </PrimaryBtn>

          <GhostBtn onClick={() => setRestartConfirm(true)} disabled={!deviceId || restartCameraMutation.isPending}>
            <RotateCcw className="w-4 h-4" /> {restartCameraMutation.isPending ? "Restarting..." : "Restart Camera"}
          </GhostBtn>

          {recognitionOn ? (
            <GhostBtn onClick={() => setStopConfirm(true)} color="#ef4444" disabled={!deviceId}>
              <Square className="w-4 h-4" /> Stop Recognition
            </GhostBtn>
          ) : (
            <GhostBtn onClick={startRecognition} color="#10b981" disabled={!deviceId || restartRecognitionMutation.isPending}>
              <Zap className="w-4 h-4" /> {restartRecognitionMutation.isPending ? "Starting..." : "Start Recognition"}
            </GhostBtn>
          )}
        </div>

        {/* Quick stats */}
        <div className="rounded-2xl p-4 space-y-3" style={CARD}>
          <div className="text-xs font-semibold text-white">Status</div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span style={{ color: "#3a3a3a" }}>Camera</span>
              <span className="font-medium" style={{ color: streamConnected ? "#10b981" : "#ef4444" }}>
                {streamConnected ? "Online" : "Offline"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: "#3a3a3a" }}>Recognition</span>
              <span className="font-medium" style={{ color: recognitionOn ? "#10b981" : "#ef4444" }}>
                {recognitionOn ? "Running" : "Off"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: "#3a3a3a" }}>Camera FPS</span>
              <span className="font-medium text-white">{fps > 0 ? `${Math.round(fps)} fps` : "-- fps"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: "#3a3a3a" }}>Device</span>
              <span className="font-medium text-white">{activeDevice?.name ?? "No device"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: "#3a3a3a" }}>CPU Usage</span>
              <span className="font-medium text-white">{telemetry?.cpu_usage ? `${telemetry.cpu_usage.toFixed(1)}%` : "--"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: "#3a3a3a" }}>RAM Usage</span>
              <span className="font-medium text-white">{telemetry?.ram_usage ? `${telemetry.ram_usage.toFixed(1)}%` : "--"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: "#3a3a3a" }}>Uptime</span>
              <span className="font-medium text-white">{uptime > 0 ? formatUptime(uptime) : "--"}</span>
            </div>
          </div>
        </div>
      </div>

      {doorConfirm    && <ConfirmModal title="Open Door?"           message="This will physically unlock the front door." onConfirm={openDoor}          onCancel={() => setDoorConfirm(false)} />}
      {restartConfirm && <ConfirmModal title="Restart Camera?"      message="The camera feed will interrupt briefly."     onConfirm={restartCamera}      onCancel={() => setRestartConfirm(false)} />}
      {stopConfirm    && <ConfirmModal title="Stop Recognition?"    message="Unknown visitors won't be detected."         onConfirm={stopRecognition}    onCancel={() => setStopConfirm(false)}    danger />}
    </div>
  );
}
