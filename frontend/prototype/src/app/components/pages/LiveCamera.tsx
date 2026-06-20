import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Camera,
  CheckCircle,
  DoorOpen,
  Loader2,
  RefreshCcw,
  Server,
  UserPlus,
  Video,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const CENTRAL_API =
  (import.meta.env.VITE_FACEGUARD_API_URL as string | undefined) ?? "http://10.93.26.183:8000";
const AGENT_API = "/agent/api/v1";

type AgentHealth = {
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

type CentralHealth = {
  status: string;
  service: string;
  version: string;
  environment: string;
  time: string;
};

type Telemetry = {
  camera_fps: number;
  camera_ready: boolean;
  camera_simulated: boolean;
  recognition_ready: boolean;
  model_people_count: number;
  cpu_percent: number;
  memory_percent: number;
};

type LocalPerson = {
  person_id: string;
  name: string;
  original_photos: number;
  processed_photos: number;
};

type RecognitionEvent = {
  id: string;
  event_type: string;
  person_id: string | null;
  person_name: string | null;
  recognition_distance: number | null;
  created_at: string;
};

const cardStyle = {
  background: "#111111",
  border: "1px solid rgba(255,255,255,0.08)",
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
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
  return response.json() as Promise<T>;
}

function makePersonId(name: string) {
  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "person";
  return `${slug}-${Date.now()}`;
}

function statusColor(ok: boolean) {
  return ok ? "#10b981" : "#ef4444";
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: ok ? "rgba(16,185,129,0.14)" : "rgba(239,68,68,0.14)", color: statusColor(ok) }}
    >
      {ok ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] py-2.5">
      <span className="text-xs" style={{ color: "#686868" }}>
        {label}
      </span>
      <span className="text-xs font-medium" style={{ color: color ?? "#f5f5f5" }}>
        {value}
      </span>
    </div>
  );
}

export function LiveCamera() {
  const [agentHealth, setAgentHealth] = useState<AgentHealth | null>(null);
  const [centralHealth, setCentralHealth] = useState<CentralHealth | null>(null);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [people, setPeople] = useState<LocalPerson[]>([]);
  const [events, setEvents] = useState<RecognitionEvent[]>([]);
  const [name, setName] = useState("");
  const [photoCount, setPhotoCount] = useState(12);
  const [strictFaceDetection, setStrictFaceDetection] = useState(true);
  const [busy, setBusy] = useState(false);
  const [streamTick, setStreamTick] = useState(0);
  const [lastTraining, setLastTraining] = useState<string>("not trained in this session");

  const streamUrl = useMemo(() => `${AGENT_API}/camera/stream?refresh=${streamTick}`, [streamTick]);

  async function refreshStatus(showToast = false) {
    const results = await Promise.allSettled([
      fetchJson<AgentHealth>(`${AGENT_API}/health`),
      fetchJson<Telemetry>(`${AGENT_API}/telemetry`),
      fetchJson<LocalPerson[]>(`${AGENT_API}/people`),
      fetchJson<RecognitionEvent[]>(`${AGENT_API}/events?limit=8`),
      fetchJson<CentralHealth>(`${CENTRAL_API}/api/v1/system/health`),
    ]);

    if (results[0].status === "fulfilled") setAgentHealth(results[0].value);
    if (results[1].status === "fulfilled") setTelemetry(results[1].value);
    if (results[2].status === "fulfilled") setPeople(results[2].value);
    if (results[3].status === "fulfilled") setEvents(results[3].value);
    if (results[4].status === "fulfilled") setCentralHealth(results[4].value);

    if (showToast) {
      const failed = results.filter((result) => result.status === "rejected").length;
      if (failed === 0) toast.success("Status refreshed");
      else toast.warning(`Status refreshed with ${failed} unavailable check(s)`);
    }
  }

  useEffect(() => {
    void refreshStatus();
    const timer = window.setInterval(() => {
      void refreshStatus();
    }, 4000);
    return () => window.clearInterval(timer);
  }, []);

  async function registerPerson() {
    const displayName = name.trim();
    if (!displayName) {
      toast.error("Enter a person name first");
      return;
    }

    setBusy(true);
    try {
      let personId = makePersonId(displayName);

      try {
        const centralPerson = await fetchJson<{ id: string }>(`${CENTRAL_API}/api/v1/people/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: displayName,
            description: "Created from local MVP v1 camera demo",
            access_enabled: true,
          }),
        });
        personId = centralPerson.id;
      } catch (error) {
        console.warn("Central backend person creation failed; continuing with local agent only", error);
        toast.warning("Central backend unavailable; saving person in local camera agent");
      }

      toast.info("Look at the camera while photos are captured");
      await fetchJson(`${AGENT_API}/people/${encodeURIComponent(personId)}/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          count: photoCount,
          interval_seconds: 0.28,
          strict_face_detection: strictFaceDetection,
        }),
      });

      const training = await fetchJson<{ people_count: number; image_count: number; skipped_count: number }>(
        `${AGENT_API}/recognition/train`,
        { method: "POST" },
      );
      setLastTraining(
        `${training.people_count} people, ${training.image_count} images, ${training.skipped_count} skipped`,
      );
      setName("");
      toast.success(`${displayName} registered and recognition model retrained`);
      await refreshStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function openDoor() {
    setBusy(true);
    try {
      await fetchJson(`${AGENT_API}/door/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration_seconds: 2, reason: "local-mvp1-demo" }),
      });
      toast.success("Door command sent to local agent");
      await refreshStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 xl:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-white">Live Camera MVP v1</h1>
            <p className="text-sm" style={{ color: "#777" }}>
              Local laptop camera, LBPH recognition agent, central backend-service at {CENTRAL_API}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setStreamTick((value) => value + 1);
              void refreshStatus(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white"
            style={{ background: "#1b1b1b", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ ...cardStyle, aspectRatio: "16 / 9", minHeight: 320 }}
        >
          <img
            key={streamTick}
            src={streamUrl}
            alt="Live laptop camera stream"
            className="h-full w-full object-cover"
            onError={() => toast.error("Camera stream is unavailable. Start backend agent on port 8081.")}
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-lg bg-black/75 px-2.5 py-1.5 text-xs font-semibold text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              LIVE
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-black/75 px-2.5 py-1.5 text-xs font-medium text-white">
              <Video className="h-3 w-3" />
              {agentHealth?.camera_simulated ? "Simulated camera" : "Laptop camera"}
            </div>
          </div>
          <div className="absolute bottom-3 left-3 rounded-lg bg-black/75 px-2.5 py-1.5 text-xs text-white">
            {telemetry ? `${telemetry.camera_fps.toFixed(1)} fps` : "waiting for telemetry"}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl p-4" style={cardStyle}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <UserPlus className="h-4 w-4" />
                Add Person
              </div>
              {busy && <Loader2 className="h-4 w-4 animate-spin text-white" />}
            </div>

            <div className="space-y-3">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Person name"
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={{ background: "#1b1b1b", border: "1px solid rgba(255,255,255,0.08)" }}
              />
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-xs" style={{ color: "#777" }}>
                  Photos
                  <input
                    type="number"
                    min={5}
                    max={40}
                    value={photoCount}
                    onChange={(event) => setPhotoCount(Number(event.target.value))}
                    className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                    style={{ background: "#1b1b1b", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                </label>
                <label className="flex items-end gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: "#1b1b1b" }}>
                  <input
                    type="checkbox"
                    checked={strictFaceDetection}
                    onChange={(event) => setStrictFaceDetection(event.target.checked)}
                  />
                  Strict face detection
                </label>
              </div>
              <button
                type="button"
                onClick={registerPerson}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                style={{ background: "#fff", color: "#080808" }}
              >
                <Camera className="h-4 w-4" />
                Capture and Train
              </button>
              <p className="text-xs leading-relaxed" style={{ color: "#777" }}>
                Keep one clear face in frame during capture. The local agent stores face images and retrains the LBPH
                recognizer after each registration.
              </p>
            </div>
          </div>

          <div className="rounded-2xl p-4" style={cardStyle}>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Activity className="h-4 w-4" />
              Recognition Events
            </div>
            <div className="space-y-2">
              {events.length === 0 ? (
                <div className="rounded-xl px-3 py-3 text-sm" style={{ background: "#1b1b1b", color: "#777" }}>
                  No recognition events yet. Register a person, then stay in frame for a few seconds.
                </div>
              ) : (
                events.map((event) => {
                  const known = event.event_type === "recognized";
                  return (
                    <div
                      key={event.id}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5"
                      style={{ background: "#1b1b1b", border: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <div>
                        <div className="text-sm font-medium text-white">
                          {known ? event.person_name ?? event.person_id : "Unknown face"}
                        </div>
                        <div className="text-xs" style={{ color: "#777" }}>
                          {new Date(event.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="text-right text-xs" style={{ color: known ? "#10b981" : "#f59e0b" }}>
                        {event.event_type}
                        <br />
                        {event.recognition_distance == null
                          ? "no distance"
                          : `distance ${event.recognition_distance.toFixed(1)}`}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <aside className="space-y-4 xl:w-[300px] xl:shrink-0">
        <div className="rounded-2xl p-4" style={cardStyle}>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Server className="h-4 w-4" />
            Services
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            <StatusPill ok={Boolean(agentHealth)} label="Agent" />
            <StatusPill ok={Boolean(centralHealth)} label="Backend-service" />
            <StatusPill ok={Boolean(agentHealth?.recognition_ready)} label="AI model" />
          </div>
          <Metric label="Agent status" value={agentHealth?.status ?? "offline"} color={statusColor(Boolean(agentHealth))} />
          <Metric
            label="Camera"
            value={agentHealth?.camera_ready ? "ready" : "not ready"}
            color={statusColor(Boolean(agentHealth?.camera_ready))}
          />
          <Metric label="Central backend" value={centralHealth?.status ?? "unavailable"} />
          <Metric label="Model people" value={String(telemetry?.model_people_count ?? 0)} color="#3b82f6" />
          <Metric label="Last training" value={lastTraining} />
          <Metric label="CPU" value={telemetry ? `${telemetry.cpu_percent.toFixed(0)}%` : "n/a"} />
          <Metric label="Memory" value={telemetry ? `${telemetry.memory_percent.toFixed(0)}%` : "n/a"} />
        </div>

        <div className="rounded-2xl p-4" style={cardStyle}>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Zap className="h-4 w-4" />
            Local People
          </div>
          <div className="space-y-2">
            {people.length === 0 ? (
              <div className="rounded-xl px-3 py-3 text-sm" style={{ background: "#1b1b1b", color: "#777" }}>
                No local people registered.
              </div>
            ) : (
              people.map((person) => (
                <div key={person.person_id} className="rounded-xl px-3 py-2.5" style={{ background: "#1b1b1b" }}>
                  <div className="text-sm font-medium text-white">{person.name}</div>
                  <div className="mt-1 text-xs" style={{ color: "#777" }}>
                    {person.processed_photos} trained photos
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={openDoor}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "#166534" }}
        >
          <DoorOpen className="h-4 w-4" />
          Test Door Command
        </button>
      </aside>
    </div>
  );
}
