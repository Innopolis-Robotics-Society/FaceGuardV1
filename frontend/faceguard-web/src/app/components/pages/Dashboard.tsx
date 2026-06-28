import { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router";
import {
  Users, CheckCircle, AlertTriangle, Activity,
  ChevronRight, TrendingUp, BarChart3, LineChart, RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { useGetPeople } from "../../../hooks/api/usePeople";
import { useGetEvents, useGetEventStats } from "../../../hooks/api/useEvents";
import { useGetSystemHealth } from "../../../hooks/api/useSystem";
import { format, startOfDay, subDays, parseISO, subHours, formatDistanceToNow } from "date-fns";
import { useWebSocketEvent } from "../../../hooks/useWebSocket";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/* ── Sub-components ───────────────────────────────────────── */
const CARD  = { background: "#111111", border: "1px solid rgba(255,255,255,0.06)" };
const TOOLTIP_STYLE = { background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", color: "#f0f0f0", fontSize: "12px" };

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl ${className}`} style={CARD}>
      {children}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, sub, accentColor, trend, loading,
}: {
  icon: any; label: string; value: string | number; sub: string; accentColor: string; trend?: string; loading?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${accentColor}12` }}
        >
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs" style={{ color: "#10b981" }}>
            <TrendingUp className="w-3 h-3" />{trend}
          </div>
        )}
      </div>
      {loading ? (
        <div className="h-8 w-20 rounded bg-white/5 animate-pulse mb-1" />
      ) : (
        <div className="text-2xl font-semibold text-white tracking-tight mb-1">{value}</div>
      )}
      <div className="text-xs font-medium" style={{ color: "#5a5a5a" }}>{label}</div>
      <div className="text-xs mt-0.5" style={{ color: "#3a3a3a" }}>{sub}</div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isGranted = status === "recognized" || status === "granted";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
      style={
        isGranted
          ? { background: "rgba(16,185,129,0.1)",  color: "#10b981" }
          : { background: "rgba(239,68,68,0.1)",   color: "#ef4444" }
      }
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {isGranted ? "Granted" : "Denied"}
    </span>
  );
}

function Avatar({ initials, color, size = 8 }: { initials: string; color: string; size?: number }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-xs font-semibold shrink-0`}
      style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}
    >
      {initials}
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const displayValue = 100 - value;
  const color = displayValue > 70 ? "#10b981" : displayValue > 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${displayValue}%`, background: color }} />
      </div>
      <span className="text-xs font-medium tabular-nums" style={{ color }}>{displayValue.toFixed(2)}%</span>
    </div>
  );
}

function getInitials(name: string) {
  if (name === "Unknown" || !name) return "?";
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function getPersonColor(name: string, personId?: string) {
  if (!name || name === "Unknown") return "#f59e0b";
  const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#14b8a6"];
  const hash = (personId || name).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

type TimePeriod = "24h" | "7d" | "30d";
type ChartStyle = "wave" | "bars";

function UnifiedActivityWidget({ allEvents }: { allEvents: any[] }) {
  const [period, setPeriod] = useState<TimePeriod>("24h");
  const [chartStyle, setChartStyle] = useState<ChartStyle>("wave");

  const { chartData, stats } = useMemo(() => {
    const now = new Date();
    let cutoff: Date;
    let data: any[];

    if (period === "24h") {
      cutoff = subHours(now, 24);
      const hours = Array.from({ length: 12 }, (_, i) => i * 2);
      data = hours.map(h => ({
        label: h.toString().padStart(2, "0"),
        granted: 0,
        denied: 0,
        unknown: 0
      }));

      allEvents.forEach(event => {
        const eventDate = parseISO(event.created_at);
        if (eventDate >= cutoff) {
          const hour = eventDate.getHours();
          const index = Math.floor(hour / 2);
          if (data[index]) {
            if (event.event_type === "recognized") data[index].granted++;
            else if (event.event_type === "access_denied") data[index].denied++;
            else if (event.event_type === "unknown") data[index].unknown++;
          }
        }
      });
    } else if (period === "7d") {
      cutoff = subDays(now, 7);
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      data = days.map(day => ({ label: day, granted: 0, denied: 0, unknown: 0 }));

      allEvents.forEach(event => {
        const eventDate = parseISO(event.created_at);
        if (eventDate >= cutoff) {
          const dayName = format(eventDate, "EEE");
          const dayIndex = days.indexOf(dayName);
          if (dayIndex !== -1) {
            if (event.event_type === "recognized") data[dayIndex].granted++;
            else if (event.event_type === "access_denied") data[dayIndex].denied++;
            else if (event.event_type === "unknown") data[dayIndex].unknown++;
          }
        }
      });
    } else {
      cutoff = subDays(now, 30);
      const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
      data = weeks.map(week => ({ label: week, granted: 0, denied: 0, unknown: 0 }));

      allEvents.forEach(event => {
        const eventDate = parseISO(event.created_at);
        if (eventDate >= cutoff) {
          const daysDiff = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
          const weekIndex = 3 - Math.floor(daysDiff / 7);
          if (weekIndex >= 0 && weekIndex < 4) {
            if (event.event_type === "recognized") data[weekIndex].granted++;
            else if (event.event_type === "access_denied") data[weekIndex].denied++;
            else if (event.event_type === "unknown") data[weekIndex].unknown++;
          }
        }
      });
    }

    const filteredEvents = allEvents.filter(e => parseISO(e.created_at) >= cutoff);
    const totalGranted = filteredEvents.filter(e => e.event_type === "recognized").length;
    const totalDenied = filteredEvents.filter(e => e.event_type === "access_denied").length;
    const totalUnknown = filteredEvents.filter(e => e.event_type === "unknown").length;

    return {
      chartData: data,
      stats: { granted: totalGranted, denied: totalDenied, unknown: totalUnknown }
    };
  }, [allEvents, period]);

  return (
    <Card className="p-5 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="text-sm font-semibold text-white">Activity Statistics</div>
          <div className="text-xs mt-0.5" style={{ color: "#3a3a3a" }}>
            {period === "24h" ? "Last 24 hours" : period === "7d" ? "Last 7 days" : "Last 30 days"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
            {(["24h", "7d", "30d"] as TimePeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: period === p ? "rgba(16,185,129,0.15)" : "transparent",
                  color: period === p ? "#10b981" : "#5a5a5a",
                }}
              >
                {p === "24h" ? "24H" : p === "7d" ? "7D" : "30D"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: "rgba(255,255,255,0.03)" }}>
            <button
              onClick={() => setChartStyle("wave")}
              className="p-1.5 rounded transition-all"
              style={{
                background: chartStyle === "wave" ? "rgba(16,185,129,0.15)" : "transparent",
                color: chartStyle === "wave" ? "#10b981" : "#5a5a5a",
              }}
            >
              <LineChart className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartStyle("bars")}
              className="p-1.5 rounded transition-all"
              style={{
                background: chartStyle === "bars" ? "rgba(16,185,129,0.15)" : "transparent",
                color: chartStyle === "bars" ? "#10b981" : "#5a5a5a",
              }}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {chartStyle === "wave" ? (
            <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientGranted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientDenied" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientUnknown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#3a3a3a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#3a3a3a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />
              <Area type="monotone" dataKey="granted" stroke="#10b981" strokeWidth={2} fill="url(#gradientGranted)" />
              <Area type="monotone" dataKey="denied" stroke="#ef4444" strokeWidth={2} fill="url(#gradientDenied)" />
              <Area type="monotone" dataKey="unknown" stroke="#f59e0b" strokeWidth={2} fill="url(#gradientUnknown)" />
            </AreaChart>
          ) : (
            <BarChart data={chartData} barSize={12} barGap={3} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#3a3a3a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#3a3a3a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
              <Bar dataKey="granted" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="denied" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="unknown" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {[
          { label: "Granted", value: stats.granted, color: "#10b981" },
          { label: "Denied", value: stats.denied, color: "#ef4444" },
          { label: "Unknown", value: stats.unknown, color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} className="flex-1 text-center">
            <div className="text-lg font-semibold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "#3a3a3a" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export function Dashboard() {
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: people = [], isLoading: loadingPeople } = useGetPeople();
  const { data: todayEvents = [], isLoading: loadingEvents } = useGetEvents({ days: 1, limit: 100 });
  const { data: recentEvents = [] } = useGetEvents({ limit: 3 });
  const { data: allEvents = [] } = useGetEvents({ days: 30, limit: 1000 });
  const { data: systemHealth } = useGetSystemHealth();

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["people"] }),
        queryClient.invalidateQueries({ queryKey: ["events"] }),
        queryClient.invalidateQueries({ queryKey: ["eventStats"] }),
        queryClient.invalidateQueries({ queryKey: ["system"] }),
      ]);
      setLastUpdated(new Date());
      toast.success("Dashboard refreshed");
    } catch (error) {
      toast.error("Failed to refresh dashboard");
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [queryClient]);

  useEffect(() => {
    if (!loadingPeople && !loadingEvents) {
      setLastUpdated(new Date());
    }
  }, [people, todayEvents, recentEvents, allEvents, loadingPeople, loadingEvents]);

  const getPersonName = (event: any) => {
    if (!event.person_id) return "Unknown";
    const person = peopleById.get(event.person_id);
    return person?.name || "Unknown";
  };

  useWebSocketEvent("recognition_event", (data: any) => {
    console.log("[Dashboard] Recognition event received:", data);

    queryClient.invalidateQueries({ queryKey: ["events"] });
    queryClient.invalidateQueries({ queryKey: ["eventStats"] });

    if (data.event_type === "recognized" && data.person_name) {
      toast.success(`${data.person_name} recognized`, {
        duration: 3000,
      });
    } else if (data.event_type === "unknown") {
      toast.warning("Unknown person detected", {
        duration: 3000,
      });
    }
  });

  const activePeople = people.filter(p => p.access_enabled && !p.deleted_at).length;
  const todayTotal = todayEvents.length;
  const unknownToday = todayEvents.filter(e => e.event_type === "unknown").length;

  const lastEvent = recentEvents[0];

  return (
    <div className="space-y-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs" style={{ color: "#5a5a5a" }}>
              Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </span>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          style={{
            background: "rgba(16,185,129,0.1)",
            color: "#10b981",
            border: "1px solid rgba(16,185,129,0.2)",
          }}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Registered People"
          value={people.length}
          sub={`${activePeople} active`}
          accentColor="#10b981"
          loading={loadingPeople}
        />
        <StatCard
          icon={CheckCircle}
          label="Access Today"
          value={todayTotal}
          sub="last 24 hours"
          accentColor="#3b82f6"
          loading={loadingEvents}
        />
        <StatCard
          icon={AlertTriangle}
          label="Unknown Attempts"
          value={unknownToday}
          sub="today"
          accentColor="#f59e0b"
          loading={loadingEvents}
        />
        <StatCard
          icon={Activity}
          label="System Status"
          value={systemHealth?.status === "ok" ? "Online" : "Offline"}
          sub={systemHealth?.status === "ok" ? "All services up" : "Check system"}
          accentColor={systemHealth?.status === "ok" ? "#10b981" : "#ef4444"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:order-none order-1">
        <Card className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="text-sm font-semibold text-white">Last Event</div>
          <Link
            to="/logs"
            className="flex items-center gap-1 text-xs transition-colors hover:text-white"
            style={{ color: "#3a3a3a" }}
          >
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {lastEvent ? (
          <>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar
                  initials={getInitials(getPersonName(lastEvent))}
                  color={getPersonColor(getPersonName(lastEvent), lastEvent.person_id || undefined)}
                  size={14}
                />
                <div
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: lastEvent.event_type === "recognized" ? "#10b981" : "#f59e0b" }}
                >
                  <CheckCircle className="w-2.5 h-2.5 text-white" />
                </div>
              </div>

              <div className="flex-1">
                <div className="text-base font-semibold text-white">
                  {getPersonName(lastEvent)}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#3a3a3a" }}>
                  {format(parseISO(lastEvent.created_at), "yyyy-MM-dd · HH:mm:ss")}
                </div>
                <div className="flex items-center gap-5 mt-3">
                  <div>
                    <div className="text-xs mb-1" style={{ color: "#3a3a3a" }}>Confidence</div>
                    <div className="text-sm font-semibold" style={{
                      color: (100 - lastEvent.confidence) > 70 ? "#10b981" : (100 - lastEvent.confidence) > 50 ? "#f59e0b" : "#ef4444"
                    }}>
                      {lastEvent.confidence ? `${(100 - lastEvent.confidence).toFixed(2)}%` : "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: "#3a3a3a" }}>Action</div>
                    <div className="text-sm font-medium text-white">
                      {lastEvent.door_opened ? "Door opened" : "Door closed"}
                    </div>
                  </div>
                </div>
              </div>

              <StatusBadge status={lastEvent.event_type} />
            </div>

            {lastEvent.confidence !== null && (
              <div className="mt-5">
                <div className="flex justify-between text-xs mb-1.5" style={{ color: "#3a3a3a" }}>
                  <span>Recognition confidence</span>
                  <span style={{
                    color: (100 - lastEvent.confidence) > 70 ? "#10b981" : (100 - lastEvent.confidence) > 50 ? "#f59e0b" : "#ef4444"
                  }}>
                    {(100 - lastEvent.confidence).toFixed(2)}%
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${100 - lastEvent.confidence}%`,
                      background: (100 - lastEvent.confidence) > 70 ? "#10b981" : (100 - lastEvent.confidence) > 50 ? "#f59e0b" : "#ef4444"
                    }}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "#3a3a3a" }}>No events yet</p>
          </div>
        )}
      </Card>

        <Card className="overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="text-sm font-semibold text-white">Recent Access Events</div>
            <Link
              to="/logs"
              className="flex items-center gap-1 text-xs transition-colors hover:text-white"
              style={{ color: "#3a3a3a" }}
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  {["Photo", "Person", "Date & Time", "Confidence", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium" style={{ color: "#3a3a3a" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((ev) => (
                  <tr
                    key={ev.id}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                    }}
                  >
                    <td className="px-5 py-3.5">
                      <Avatar
                        initials={getInitials(getPersonName(ev))}
                        color={getPersonColor(getPersonName(ev), ev.person_id || undefined)}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-white">{getPersonName(ev)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs" style={{ color: "#3a3a3a" }}>
                        {format(parseISO(ev.created_at), "yyyy-MM-dd · HH:mm:ss")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {ev.confidence !== null ? (
                        <ConfidenceBar value={ev.confidence} />
                      ) : (
                        <span className="text-xs" style={{ color: "#3a3a3a" }}>N/A</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={ev.event_type} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden">
            {recentEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
              >
                <Avatar
                  initials={getInitials(getPersonName(ev))}
                  color={getPersonColor(getPersonName(ev), ev.person_id || undefined)}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{getPersonName(ev)}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#3a3a3a" }}>
                    {format(parseISO(ev.created_at), "HH:mm:ss")} · {ev.confidence ? `${(100 - ev.confidence).toFixed(2)}%` : "N/A"}
                  </div>
                </div>
                <StatusBadge status={ev.event_type} />
              </div>
            ))}
          </div>

          {recentEvents.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: "#3a3a3a" }}>No recent events</p>
            </div>
          )}
        </Card>
      </div>

      <div className="flex-1 min-h-0 lg:order-none order-first lg:min-h-0 min-h-[500px]">
        <UnifiedActivityWidget allEvents={allEvents} />
      </div>
    </div>
  );
}
