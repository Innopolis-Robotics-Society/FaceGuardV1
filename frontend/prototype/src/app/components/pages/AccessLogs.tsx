import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Clock, Download, DoorOpen, Eye, Filter, RefreshCcw, Trash2, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  type AgentStats,
  type RecognitionEvent,
  agentJson,
  colorFor,
  eventName,
  eventSnapshotUrl,
  eventStatus,
  formatDate,
  formatDateTime,
  formatTime,
  initials,
  matchQuality,
} from "../../lib/faceguardApi";

const CARD = { background: "#111111", border: "1px solid rgba(255,255,255,0.06)" };
type LogStatus = "granted" | "unknown" | "manual";

const STATUS_CFG = {
  granted: { label: "Access Granted", color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: CheckCircle },
  unknown: { label: "Unknown Person", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: AlertTriangle },
  manual: { label: "Manual Open", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", icon: DoorOpen },
};

function StatusBadge({ status }: { status: LogStatus }) {
  const c = STATUS_CFG[status];
  const Icon = c.icon;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: c.bg, color: c.color }}>
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const color = colorFor(name);
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold" style={{ background: `${color}15`, color }}>
      {initials(name)}
    </div>
  );
}

function DetailModal({ event, threshold, onClose }: { event: RecognitionEvent; threshold: number; onClose: () => void }) {
  const name = eventName(event);
  const status = eventStatus(event);
  const c = STATUS_CFG[status];
  const Icon = c.icon;
  const quality = matchQuality(event.recognition_distance, threshold);
  const color = colorFor(name);
  const hasSnapshot = Boolean(event.photo_path);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl" style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-sm font-semibold text-white">Event Details</h2>
          <button onClick={onClose} className="text-neutral-600 transition-colors hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative flex aspect-video items-center justify-center" style={{ background: `${color}08` }}>
          {hasSnapshot ? (
            <img src={eventSnapshotUrl(event.id)} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold" style={{ background: `${color}15`, color }}>
              {initials(name)}
            </div>
          )}
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium" style={{ background: c.bg, color: c.color }}>
            <Icon className="h-3.5 w-3.5" /> {c.label}
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1 text-xs" style={{ color: "#3a3a3a" }}>Person</p>
              <p className="text-sm font-semibold text-white">{name}</p>
            </div>
            <div>
              <p className="mb-1 text-xs" style={{ color: "#3a3a3a" }}>Date & Time</p>
              <p className="text-sm font-semibold text-white">{formatDateTime(event.created_at)}</p>
            </div>
            <div>
              <p className="mb-1 text-xs" style={{ color: "#3a3a3a" }}>Distance</p>
              <p className="text-sm font-semibold text-white">{event.recognition_distance == null ? "manual" : event.recognition_distance.toFixed(2)}</p>
            </div>
            <div>
              <p className="mb-1 text-xs" style={{ color: "#3a3a3a" }}>Quality</p>
              <p className="text-sm font-semibold" style={{ color: c.color }}>{event.recognition_distance == null ? "manual" : `${quality}%`}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl p-3.5" style={{ background: event.door_opened ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)", border: `1px solid ${event.door_opened ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)"}` }}>
            <DoorOpen className="h-4 w-4 shrink-0" style={{ color: event.door_opened ? "#10b981" : "#ef4444" }} />
            <div>
              <p className="text-xs font-medium" style={{ color: event.door_opened ? "#10b981" : "#ef4444" }}>
                {event.door_opened ? "Door was opened" : "Door remained closed"}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "#3a3a3a" }}>Local agent event #{event.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClearModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl" style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "rgba(239,68,68,0.1)" }}>
          <Trash2 className="h-5 w-5 text-red-500" />
        </div>
        <h3 className="mb-2 text-center text-sm font-semibold text-white">Clear Local Events</h3>
        <p className="mb-5 text-center text-xs leading-relaxed" style={{ color: "#5a5a5a" }}>
          This clears the local agent SQLite event table.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-xl py-2.5 text-sm font-medium" style={{ background: "#1a1a1a", color: "#a0a0a0" }}>
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white" style={{ background: "#ef4444" }}>
            Clear Events
          </button>
        </div>
      </div>
    </div>
  );
}

export function AccessLogs() {
  const [logs, setLogs] = useState<RecognitionEvent[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LogStatus>("all");
  const [detailLog, setDetailLog] = useState<RecognitionEvent | null>(null);
  const [showClear, setShowClear] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  async function load() {
    const [events, nextStats] = await Promise.all([
      agentJson<RecognitionEvent[]>("/events?limit=500"),
      agentJson<AgentStats>("/stats"),
    ]);
    setLogs(events);
    setStats(nextStats);
  }

  useEffect(() => {
    void load().catch((error) => toast.error(error instanceof Error ? error.message : String(error)));
    const timer = window.setInterval(() => void load().catch(() => undefined), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const threshold = stats?.settings.recognition_threshold ?? 50;
  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const name = eventName(log);
      const status = eventStatus(log);
      const date = new Date(log.created_at).toISOString().slice(0, 10);
      return (
        name.toLowerCase().includes(search.toLowerCase()) &&
        (statusFilter === "all" || status === statusFilter) &&
        (!dateFrom || date >= dateFrom) &&
        (!dateTo || date <= dateTo)
      );
    });
  }, [dateFrom, dateTo, logs, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function exportCSV() {
    const rows = filtered
      .map((log) => {
        const name = eventName(log);
        const status = eventStatus(log);
        return [log.id, name, log.created_at, log.recognition_distance ?? "", status, log.door_opened].join(",");
      })
      .join("\n");
    const blob = new Blob(["ID,Name,CreatedAt,Distance,Status,DoorOpened\n" + rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "faceguard_local_access_logs.csv";
    a.click();
    toast.success("Logs exported as CSV");
  }

  async function clearEvents() {
    try {
      await agentJson("/events", { method: "DELETE" });
      setShowClear(false);
      toast.success("Local events cleared");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-44 flex-1">
          <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "#3a3a3a" }} />
          <input
            type="text"
            placeholder="Search by person or event"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder-neutral-700"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
          />
        </div>
        <input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} className="rounded-xl px-3 py-2.5 text-sm text-white outline-none" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)", colorScheme: "dark" }} />
        <input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} className="rounded-xl px-3 py-2.5 text-sm text-white outline-none" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)", colorScheme: "dark" }} />
        <button onClick={() => void load()} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium" style={{ background: "#1a1a1a", color: "#a0a0a0", border: "1px solid rgba(255,255,255,0.06)" }}>
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
        <button onClick={exportCSV} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium" style={{ background: "#1a1a1a", color: "#a0a0a0", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Download className="h-4 w-4" /> Export CSV
        </button>
        <button onClick={() => setShowClear(true)} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-red-500" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <Trash2 className="h-4 w-4" /> Clear
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "granted", "unknown", "manual"] as const).map((status) => {
          const count = status === "all" ? logs.length : logs.filter((log) => eventStatus(log) === status).length;
          const cfg = status === "all" ? null : STATUS_CFG[status];
          return (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all"
              style={
                statusFilter === status
                  ? { background: status === "all" ? "#ffffff" : cfg!.bg, color: status === "all" ? "#080808" : cfg!.color, border: `1px solid ${status === "all" ? "transparent" : cfg!.color + "30"}` }
                  : { background: "#111111", color: "#5a5a5a", border: "1px solid rgba(255,255,255,0.06)" }
              }
            >
              {status === "all" ? "All Events" : cfg!.label}
              <span className="ml-1 rounded px-1.5 py-0.5 text-xs" style={{ background: "rgba(255,255,255,0.07)" }}>{count}</span>
            </button>
          );
        })}
      </div>

      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl py-20" style={CARD}>
          <Filter className="mb-3 h-10 w-10" style={{ color: "#1a1a1a" }} />
          <p className="mb-1 text-sm font-medium text-white">No logs found</p>
          <p className="text-xs" style={{ color: "#3a3a3a" }}>Recognition events will appear after the local agent detects faces</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl" style={CARD}>
          <div className="hidden grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 px-5 py-3 lg:grid" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            {["Photo", "Name", "Date", "Time", "Distance", "Status"].map((header) => (
              <div key={header} className="text-xs font-medium" style={{ color: "#3a3a3a" }}>{header}</div>
            ))}
          </div>

          {paginated.map((log) => {
            const name = eventName(log);
            const status = eventStatus(log);
            const cfg = STATUS_CFG[status];
            const quality = matchQuality(log.recognition_distance, threshold);
            return (
              <div key={log.id} className="grid grid-cols-[auto_1fr_auto] gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02] lg:grid-cols-[auto_1fr_auto_auto_auto_auto]" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <Avatar name={name} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">{name}</div>
                  <div className="text-xs lg:hidden" style={{ color: "#3a3a3a" }}>{formatDate(log.created_at)} · {formatTime(log.created_at)} · {log.recognition_distance == null ? "manual" : `${quality}%`}</div>
                </div>
                <div className="hidden text-xs lg:block" style={{ color: "#3a3a3a" }}>{formatDate(log.created_at)}</div>
                <div className="hidden items-center gap-1 text-xs lg:flex" style={{ color: "#3a3a3a" }}><Clock className="h-3 w-3" />{formatTime(log.created_at)}</div>
                <div className="hidden min-w-[90px] items-center gap-2 lg:flex">
                  <div className="h-1 w-10 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${log.recognition_distance == null ? 100 : quality}%`, background: cfg.color }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: cfg.color }}>{log.recognition_distance == null ? "manual" : log.recognition_distance.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={status} />
                  <button onClick={() => setDetailLog(log)} className="rounded-lg p-1.5 text-neutral-700 transition-colors hover:bg-white/5 hover:text-white">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: "#3a3a3a" }}>{(page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="rounded-xl p-2 disabled:opacity-30" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)", color: "#a0a0a0" }}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="rounded-xl p-2 disabled:opacity-30" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)", color: "#a0a0a0" }}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {detailLog && <DetailModal event={detailLog} threshold={threshold} onClose={() => setDetailLog(null)} />}
      {showClear && <ClearModal onConfirm={() => void clearEvents()} onCancel={() => setShowClear(false)} />}
    </div>
  );
}
