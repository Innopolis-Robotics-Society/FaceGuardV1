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
import {
  AGENT_API,
  CENTRAL_API,
  type AgentHealth,
  type ApiPerson,
  type CaptureSession,
  type LocalPerson,
  type RecognitionEvent,
  type Telemetry,
  agentJson,
  backendJson,
  eventName,
  formatTime,
  matchQuality,
} from "../../lib/faceguardApi";

const GUIDED_STEPS = [
  "Look straight at the camera",
  "Turn your head slightly left",
  "Turn your head slightly right",
  "Lift your chin a little",
  "Lower your chin a little",
  "Move a little closer",
  "Move a little farther back",
  "Look straight again",
  "Turn left again",
  "Turn right again",
  "Use a neutral expression",
  "Make a small smile",
];

const cardStyle = {
  background: "#111111",
  border: "1px solid rgba(255,255,255,0.08)",
};

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

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: "#10b981" }} />
    </div>
  );
}

export function LiveCamera() {
  const [agentHealth, setAgentHealth] = useState<AgentHealth | null>(null);
  const [centralReady, setCentralReady] = useState(false);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [people, setPeople] = useState<LocalPerson[]>([]);
  const [events, setEvents] = useState<RecognitionEvent[]>([]);
  const [name, setName] = useState("");
  const [strictFaceDetection, setStrictFaceDetection] = useState(true);
  const [busy, setBusy] = useState(false);
  const [streamTick, setStreamTick] = useState(0);
  const [session, setSession] = useState<CaptureSession | null>(null);

  const streamUrl = useMemo(() => `${AGENT_API}/camera/stream?refresh=${streamTick}`, [streamTick]);
  const registrationActive = session?.status === "queued" || session?.status === "running" || session?.status === "training";
  const progress = session ? Math.round((session.current_index / Math.max(1, session.total_steps)) * 100) : 0;

  async function refreshStatus(showToast = false) {
    const results = await Promise.allSettled([
      agentJson<AgentHealth>("/health"),
      agentJson<Telemetry>("/telemetry"),
      agentJson<LocalPerson[]>("/people"),
      agentJson<RecognitionEvent[]>("/events?limit=8"),
      backendJson<{ status: string }>("/api/v1/system/readiness"),
    ]);

    if (results[0].status === "fulfilled") setAgentHealth(results[0].value);
    if (results[1].status === "fulfilled") setTelemetry(results[1].value);
    if (results[2].status === "fulfilled") setPeople(results[2].value);
    if (results[3].status === "fulfilled") setEvents(results[3].value);
    setCentralReady(results[4].status === "fulfilled" && results[4].value.status === "ready");

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

  useEffect(() => {
    if (!session || !registrationActive) return;
    const timer = window.setInterval(async () => {
      try {
        const next = await agentJson<CaptureSession>(`/capture-sessions/${session.session_id}`);
        setSession(next);
        if (next.status === "completed") {
          toast.success(`${next.display_name} registered and model retrained`);
          setName("");
          await refreshStatus();
        }
        if (next.status === "failed") {
          toast.error(next.error ?? "Registration failed");
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : String(error));
      }
    }, 650);
    return () => window.clearInterval(timer);
  }, [registrationActive, session?.session_id]);

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
        const centralPerson = await backendJson<ApiPerson>("/api/v1/people/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: displayName,
            description: "Created from guided local MVP v1 registration",
            access_enabled: true,
          }),
        });
        personId = centralPerson.id;
      } catch (error) {
        console.warn("Central backend person creation failed; continuing with local agent only", error);
        toast.warning("Backend-service unavailable; saving person in local camera agent");
      }

      const started = await agentJson<CaptureSession>(`/people/${encodeURIComponent(personId)}/capture-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          steps: GUIDED_STEPS,
          interval_seconds: 1,
          strict_face_detection: strictFaceDetection,
          train_after_capture: true,
        }),
      });
      setSession(started);
      toast.info("Guided registration started");
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
              Local agent on laptop camera · backend-service through {CENTRAL_API}
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

        <div className="relative overflow-hidden rounded-2xl" style={{ ...cardStyle, aspectRatio: "16 / 9", minHeight: 320 }}>
          <img
            key={streamTick}
            src={streamUrl}
            alt="Live laptop camera stream"
            className="h-full w-full object-cover"
            onError={() => toast.error("Camera stream is unavailable. Start local agent on port 8081.")}
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
                Guided Registration
              </div>
              {(busy || registrationActive) && <Loader2 className="h-4 w-4 animate-spin text-white" />}
            </div>

            <div className="space-y-3">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Person name"
                disabled={registrationActive}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none disabled:opacity-60"
                style={{ background: "#1b1b1b", border: "1px solid rgba(255,255,255,0.08)" }}
              />
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <label className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: "#1b1b1b" }}>
                  <input
                    type="checkbox"
                    checked={strictFaceDetection}
                    disabled={registrationActive}
                    onChange={(event) => setStrictFaceDetection(event.target.checked)}
                  />
                  Strict face and quality checks
                </label>
                <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "#1b1b1b", color: "#777" }}>
                  {GUIDED_STEPS.length} shots · 1s each
                </div>
              </div>
              <button
                type="button"
                onClick={registerPerson}
                disabled={busy || registrationActive}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                style={{ background: "#fff", color: "#080808" }}
              >
                <Camera className="h-4 w-4" />
                Start Guided Capture
              </button>

              {session && (
                <div className="rounded-xl p-3" style={{ background: "#1b1b1b", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{session.current_prompt}</div>
                      <div className="mt-0.5 text-xs" style={{ color: "#777" }}>
                        Step {Math.min(session.current_index, session.total_steps)} / {session.total_steps} · {session.status}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div style={{ color: "#10b981" }}>{session.captured_count} captured</div>
                      <div style={{ color: "#f59e0b" }}>{session.skipped_count} skipped</div>
                    </div>
                  </div>
                  <ProgressBar value={progress} />
                  {session.error && <div className="mt-2 text-xs text-red-400">{session.error}</div>}
                  {session.status === "training" && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-white">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Retraining local LBPH model
                    </div>
                  )}
                </div>
              )}
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
                  No recognition events yet.
                </div>
              ) : (
                events.map((event) => {
                  const quality = matchQuality(event.recognition_distance, telemetry?.recognition_ready ? 50 : 70);
                  const known = event.event_type === "recognized";
                  return (
                    <div key={event.id} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: "#1b1b1b", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div>
                        <div className="text-sm font-medium text-white">{eventName(event)}</div>
                        <div className="text-xs" style={{ color: "#777" }}>
                          {formatTime(event.created_at)}
                        </div>
                      </div>
                      <div className="text-right text-xs" style={{ color: known ? "#10b981" : "#f59e0b" }}>
                        {event.event_type}
                        <br />
                        {event.recognition_distance == null ? "manual" : `${quality}% quality`}
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
            <StatusPill ok={centralReady} label="Backend-service" />
            <StatusPill ok={Boolean(agentHealth?.recognition_ready)} label="AI model" />
          </div>
          <Metric label="Agent status" value={agentHealth?.status ?? "offline"} color={statusColor(Boolean(agentHealth))} />
          <Metric label="Camera" value={agentHealth?.camera_ready ? "ready" : "not ready"} color={statusColor(Boolean(agentHealth?.camera_ready))} />
          <Metric label="Backend DB" value={centralReady ? "connected" : "unavailable"} />
          <Metric label="Model people" value={String(telemetry?.model_people_count ?? 0)} color="#3b82f6" />
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
