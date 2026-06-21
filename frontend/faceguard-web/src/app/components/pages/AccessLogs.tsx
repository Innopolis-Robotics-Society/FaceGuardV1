import { useMemo, useState } from "react";
import {
  Search, Download, Trash2, ChevronLeft, ChevronRight,
  X, CheckCircle, XCircle, AlertTriangle, Eye, DoorOpen, Clock, Filter,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { useCleanupEvents, useDeleteEvent, useGetEvents } from "../../../hooks/api/useEvents";
import { useGetPeople } from "../../../hooks/api/usePeople";
import { AccessEvent } from "../../../types/api.types";

const CARD = { background: "#111111", border: "1px solid rgba(255,255,255,0.06)" };

type LogStatus = "granted" | "denied" | "unknown";

interface LogEntry {
  id: string;
  eventType: string;
  personId: string | null;
  deviceId: string;
  name: string;
  initials: string;
  color: string;
  date: string;
  time: string;
  createdAt: string;
  confidence: number | null;
  status: LogStatus;
  action: string;
  doorOpened: boolean;
  photoPath: string | null;
  videoPath: string | null;
}

const STATUS_CFG = {
  granted: { label: "Access Granted", color: "#10b981", bg: "rgba(16,185,129,0.1)",  icon: CheckCircle   },
  denied:  { label: "Access Denied",  color: "#ef4444", bg: "rgba(239,68,68,0.1)",   icon: XCircle       },
  unknown: { label: "Unknown Person", color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  icon: AlertTriangle },
};

function getInitials(name: string) {
  if (name === "Unknown") return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function getPersonColor(name: string, status: LogStatus) {
  if (status === "unknown") return "#f59e0b";
  if (status === "denied") return "#ef4444";
  const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b"];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function eventStatus(eventType: string, doorOpened: boolean): LogStatus {
  if (eventType === "unknown") return "unknown";
  if (eventType === "access_denied" || !doorOpened) return "denied";
  return "granted";
}

function eventAction(eventType: string, doorOpened: boolean) {
  if (eventType === "manual_open") return "Manual open";
  if (eventType === "door_opened") return "Door opened";
  if (eventType === "access_denied") return "Access denied";
  if (eventType === "unknown") return "Alert sent";
  if (eventType === "recognition_error") return "Recognition error";
  return doorOpened ? "Door opened" : "Access checked";
}

function StatusBadge({ status }: { status: LogStatus }) {
  const c = STATUS_CFG[status]; const Icon = c.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ background: c.bg, color: c.color }}>
      <Icon className="w-3 h-3" />{c.label}
    </span>
  );
}

function DetailModal({ log, onClose, onDelete, deleting }: { log: LogEntry; onClose: () => void; onDelete: () => void; deleting: boolean }) {
  const c = STATUS_CFG[log.status]; const Icon = c.icon;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85" onClick={onClose} />
      <div className="relative rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-sm font-semibold text-white">Event Details</h2>
          <button onClick={onClose} className="text-neutral-600 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="aspect-video flex items-center justify-center relative" style={{ background: `${log.color}08` }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold"
            style={{ background: `${log.color}15`, color: log.color }}>
            {log.initials}
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium"
            style={{ background: c.bg, color: c.color }}>
            <Icon className="w-3.5 h-3.5" /> {c.label}
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Person", value: log.name },
              { label: "Date & Time", value: `${log.date} ${log.time}` },
              { label: "Action", value: log.action },
              { label: "Event Type", value: log.eventType },
              { label: "Device", value: log.deviceId.slice(0, 8) },
              { label: "Person ID", value: log.personId ? log.personId.slice(0, 8) : "None" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs mb-1" style={{ color: "#3a3a3a" }}>{label}</p>
                <p className="text-sm font-semibold text-white truncate">{value}</p>
              </div>
            ))}
            <div className="col-span-2">
              <p className="text-xs mb-1" style={{ color: "#3a3a3a" }}>Confidence</p>
              {log.confidence === null ? (
                <p className="text-sm font-semibold text-white">Not reported</p>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{
                      width: `${100 - log.confidence}%`,
                      background: (100 - log.confidence) > 70 ? "#10b981" : (100 - log.confidence) > 50 ? "#f59e0b" : "#ef4444",
                    }} />
                  </div>
                  <span className="text-sm font-bold" style={{ color: (100 - log.confidence) > 70 ? "#10b981" : (100 - log.confidence) > 50 ? "#f59e0b" : "#ef4444" }}>
                    {(100 - log.confidence).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl"
            style={{ background: log.doorOpened ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)", border: `1px solid ${log.doorOpened ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)"}` }}>
            <DoorOpen className="w-4 h-4 shrink-0" style={{ color: log.doorOpened ? "#10b981" : "#ef4444" }} />
            <div>
              <p className="text-xs font-medium" style={{ color: log.doorOpened ? "#10b981" : "#ef4444" }}>
                {log.doorOpened ? "Door was opened" : "Door remained closed"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#3a3a3a" }}>
                {log.photoPath ? `Photo: ${log.photoPath}` : "No event photo attached"}
              </p>
            </div>
          </div>

          <button onClick={onDelete} disabled={deleting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-red-500"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <Trash2 className="w-4 h-4" /> {deleting ? "Deleting..." : "Delete Event"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClearModal({ onConfirm, onCancel, loading }: { onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onCancel} />
      <div className="relative rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(239,68,68,0.1)" }}>
          <Trash2 className="w-5 h-5 text-red-500" />
        </div>
        <h3 className="text-sm font-semibold text-white text-center mb-2">Clear Old Logs</h3>
        <p className="text-xs text-center mb-5 leading-relaxed" style={{ color: "#5a5a5a" }}>
          Access log entries older than 30 days will be deleted.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "#1a1a1a", color: "#a0a0a0" }} disabled={loading}>Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: "#ef4444" }} disabled={loading}>{loading ? "Clearing..." : "Clear Logs"}</button>
        </div>
      </div>
    </div>
  );
}

function toLogEntry(event: AccessEvent, peopleById: Map<string, string>): LogEntry {
  const status = eventStatus(event.event_type, event.door_opened);
  const name = event.person_id ? peopleById.get(event.person_id) ?? `Person ${event.person_id.slice(0, 8)}` : "Unknown";
  const parsed = parseISO(event.created_at);
  const color = getPersonColor(name, status);
  return {
    id: event.id,
    eventType: event.event_type,
    personId: event.person_id,
    deviceId: event.device_id,
    name,
    initials: getInitials(name),
    color,
    date: format(parsed, "yyyy-MM-dd"),
    time: format(parsed, "HH:mm:ss"),
    createdAt: event.created_at,
    confidence: event.confidence,
    status,
    action: eventAction(event.event_type, event.door_opened),
    doorOpened: event.door_opened,
    photoPath: event.photo_path,
    videoPath: event.video_path,
  };
}

export function AccessLogs() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LogStatus>("all");
  const [detailLog, setDetailLog] = useState<LogEntry | null>(null);
  const [showClear, setShowClear] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const { data: events = [], isLoading, isError } = useGetEvents({ days: 365, limit: 1000 });
  const { data: people = [] } = useGetPeople();
  const deleteEvent = useDeleteEvent();
  const cleanupEvents = useCleanupEvents();

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p.name])), [people]);
  const logs = useMemo(() => events.map((event) => toLogEntry(event, peopleById)), [events, peopleById]);

  const filtered = logs.filter((l) =>
    (l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.eventType.toLowerCase().includes(search.toLowerCase()) ||
      l.deviceId.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === "all" || l.status === statusFilter) &&
    (!dateFrom || l.date >= dateFrom) &&
    (!dateTo || l.date <= dateTo)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function exportCSV() {
    const rows = filtered.map((l) => [
      l.id,
      l.name,
      l.date,
      l.time,
      l.confidence === null ? "" : `${(100 - l.confidence).toFixed(2)}%`,
      l.status,
      l.eventType,
      l.action,
      l.doorOpened ? "yes" : "no",
    ].join(",")).join("\n");
    const blob = new Blob(["ID,Name,Date,Time,Confidence,Status,Event Type,Action,Door Opened\n" + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "access_logs.csv"; a.click();
    toast.success("Logs exported as CSV");
  }

  function deleteSelectedLog() {
    if (!detailLog) return;
    deleteEvent.mutate(detailLog.id, {
      onSuccess: () => setDetailLog(null),
    });
  }

  function clearOldLogs() {
    cleanupEvents.mutate(30, {
      onSuccess: () => setShowClear(false),
    });
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2.5 items-center">
        <div className="flex-1 min-w-44 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#3a3a3a" }} />
          <input type="text" placeholder="Search by name..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-neutral-700 outline-none"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }} />
        </div>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-xl text-sm text-white outline-none"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)", colorScheme: "dark" }} />
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-xl text-sm text-white outline-none"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)", colorScheme: "dark" }} />
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: "#1a1a1a", color: "#a0a0a0", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Download className="w-4 h-4" /> Export CSV
        </button>
        <button onClick={() => setShowClear(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <Trash2 className="w-4 h-4" /> Clear Logs
        </button>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", "granted", "denied", "unknown"] as const).map((s) => {
          const c = s === "all" ? null : STATUS_CFG[s];
          const count = s === "all" ? logs.length : logs.filter((l) => l.status === s).length;
          return (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={statusFilter === s
                ? { background: s === "all" ? "#ffffff" : c!.bg, color: s === "all" ? "#080808" : c!.color, border: `1px solid ${s === "all" ? "transparent" : c!.color + "30"}` }
                : { background: "#111111", color: "#5a5a5a", border: "1px solid rgba(255,255,255,0.06)" }}>
              {s === "all" ? "All Events" : c!.label}
              <span className="ml-1 px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(255,255,255,0.07)" }}>{count}</span>
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && (isError || paginated.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={CARD}>
          <Filter className="w-10 h-10 mb-3" style={{ color: "#1a1a1a" }} />
          <p className="text-sm font-medium text-white mb-1">{isError ? "Failed to load logs" : "No logs found"}</p>
          <p className="text-xs" style={{ color: "#3a3a3a" }}>{isError ? "Check API connection and try again" : "Try adjusting your filters"}</p>
        </div>
      )}

      {/* Desktop table */}
      {!isLoading && paginated.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={CARD}>
          <div className="hidden lg:grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-3 px-5 py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            {["Photo", "Name", "Date", "Time", "Confidence", "Status", "Details"].map((h) => (
              <div key={h} className="text-xs font-medium" style={{ color: "#3a3a3a" }}>{h}</div>
            ))}
          </div>

          <div className="hidden lg:block">
            {paginated.map((log) => (
              <div key={log.id}
                className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-3 items-center px-5 py-3.5 hover:bg-white/2 transition-colors"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ background: `${log.color}15`, color: log.color }}>{log.initials}</div>
                <div className="text-sm font-medium text-white truncate">{log.name}</div>
                <div className="text-xs" style={{ color: "#3a3a3a" }}>{log.date}</div>
                <div className="text-xs flex items-center gap-1" style={{ color: "#3a3a3a" }}>
                  <Clock className="w-3 h-3" />{log.time}
                </div>
                <div className="flex items-center gap-2 min-w-[90px]">
                  <div className="w-10 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{
                      width: `${100 - (log.confidence ?? 0)}%`,
                      background: (100 - (log.confidence ?? 0)) > 70 ? "#10b981" : (100 - (log.confidence ?? 0)) > 50 ? "#f59e0b" : "#ef4444",
                    }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: (100 - (log.confidence ?? 0)) > 70 ? "#10b981" : (100 - (log.confidence ?? 0)) > 50 ? "#f59e0b" : "#ef4444" }}>
                    {log.confidence === null ? "--" : `${(100 - log.confidence).toFixed(2)}%`}
                  </span>
                </div>
                <StatusBadge status={log.status} />
                <button onClick={() => setDetailLog(log)}
                  className="p-1.5 rounded-lg text-neutral-700 hover:text-white hover:bg-white/5 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden">
            {paginated.map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{ background: `${log.color}15`, color: log.color }}>{log.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{log.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#3a3a3a" }}>{log.date} · {log.time} · {log.confidence === null ? "--" : `${(100 - log.confidence).toFixed(2)}%`}</div>
                </div>
                <StatusBadge status={log.status} />
                <button onClick={() => setDetailLog(log)} className="p-1.5 text-neutral-700 hover:text-white">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && filtered.length > PER_PAGE && (
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: "#3a3a3a" }}>
            {(page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-xl disabled:opacity-30"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)", color: "#a0a0a0" }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)}
                className="w-9 h-9 rounded-xl text-sm font-medium transition-all"
                style={n === page ? { background: "#ffffff", color: "#080808" } : { background: "#111111", color: "#5a5a5a", border: "1px solid rgba(255,255,255,0.06)" }}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 rounded-xl disabled:opacity-30"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)", color: "#a0a0a0" }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {detailLog && <DetailModal log={detailLog} onClose={() => setDetailLog(null)} onDelete={deleteSelectedLog} deleting={deleteEvent.isPending} />}
      {showClear && <ClearModal onConfirm={clearOldLogs} onCancel={() => setShowClear(false)} loading={cleanupEvents.isPending} />}
    </div>
  );
}
