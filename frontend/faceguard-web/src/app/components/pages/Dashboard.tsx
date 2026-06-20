import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  Users, CheckCircle, AlertTriangle, Activity,
  ChevronRight, Eye, MoreHorizontal, TrendingUp,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { useGetPeople } from "../../../hooks/api/usePeople";
import { useGetEvents, useGetEventStats } from "../../../hooks/api/useEvents";
import { useGetSystemHealth } from "../../../hooks/api/useSystem";
import { format, startOfDay, subDays, parseISO } from "date-fns";
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
  const color = value > 70 ? "#10b981" : value > 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs font-medium tabular-nums" style={{ color }}>{value}%</span>
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

/* ── Mini Activity Widget ────────────────────────────────── */
function MiniActivity({ events, stats }: { events: any[]; stats: any }) {
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 12 }, (_, i) => i * 2);
    const data = hours.map(h => ({ h: h.toString().padStart(2, "0"), v: 0 }));

    const today = startOfDay(new Date());
    events.forEach(event => {
      const eventDate = parseISO(event.created_at);
      if (eventDate >= today) {
        const hour = eventDate.getHours();
        const index = Math.floor(hour / 2);
        if (data[index]) data[index].v++;
      }
    });

    return data;
  }, [events]);

  return (
    <Card className="p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-white">Today's Activity</div>
          <div className="text-xs mt-0.5" style={{ color: "#3a3a3a" }}>Events by hour</div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#10b981" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#10b981", display: "inline-block" }} />
          Live
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={hourlyData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="h" tick={{ fill: "#3a3a3a", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#3a3a3a", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />
          <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={1.5} fill="url(#areaGreen)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {[
          { label: "Granted",  value: stats?.recognized_count || 0, color: "#10b981" },
          { label: "Denied",   value: stats?.access_denied_count || 0,  color: "#ef4444" },
          { label: "Unknown",  value: stats?.unknown_count || 0,   color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} className="flex-1 text-center">
            <div className="text-base font-semibold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "#3a3a3a" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export function Dashboard() {
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: people = [], isLoading: loadingPeople } = useGetPeople();
  const { data: todayEvents = [], isLoading: loadingEvents } = useGetEvents({ days: 1, limit: 100 });
  const { data: recentEvents = [] } = useGetEvents({ limit: 5 });
  const { data: stats } = useGetEventStats(7);
  const { data: systemHealth } = useGetSystemHealth();

  // WebSocket real-time updates
  useWebSocketEvent("recognition_event", (data: any) => {
    console.log("[Dashboard] Recognition event received:", data);

    // Invalidate events to refresh stats
    queryClient.invalidateQueries({ queryKey: ["events"] });
    queryClient.invalidateQueries({ queryKey: ["eventStats"] });

    // Show subtle notification
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

  const activityData = useMemo(() => {
    if (!stats) return [];

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();

    return days.map((day, i) => {
      const date = subDays(today, 6 - i);
      const dayEvents = todayEvents.filter(e => {
        const eventDate = parseISO(e.created_at);
        return format(eventDate, "EEE") === day;
      });

      return {
        day,
        granted: dayEvents.filter(e => e.event_type === "recognized").length,
        denied: dayEvents.filter(e => e.event_type === "access_denied").length,
        unknown: dayEvents.filter(e => e.event_type === "unknown").length,
      };
    });
  }, [stats, todayEvents]);

  return (
    <div className="space-y-5">
      {/* Stat cards */}
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
          value={systemHealth?.status === "healthy" ? "Online" : "Offline"}
          sub={systemHealth?.status === "healthy" ? "All services up" : "Check system"}
          accentColor={systemHealth?.status === "healthy" ? "#10b981" : "#ef4444"}
        />
      </div>

      {/* Last event + mini activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Last event */}
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
                    initials={getInitials(lastEvent.person_id ? "Person" : "Unknown")}
                    color={getPersonColor(lastEvent.person_id || "Unknown", lastEvent.person_id || undefined)}
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
                    {lastEvent.person_id || "Unknown"}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#3a3a3a" }}>
                    {format(parseISO(lastEvent.created_at), "yyyy-MM-dd · HH:mm:ss")}
                  </div>
                  <div className="flex items-center gap-5 mt-3">
                    <div>
                      <div className="text-xs mb-1" style={{ color: "#3a3a3a" }}>Confidence</div>
                      <div className="text-sm font-semibold" style={{ color: "#10b981" }}>
                        {lastEvent.confidence ? `${lastEvent.confidence.toFixed(1)}%` : "N/A"}
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
                    <span style={{ color: "#10b981" }}>{lastEvent.confidence.toFixed(1)}%</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${lastEvent.confidence}%`, background: "#10b981" }}
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

        {/* Mini Activity */}
        <MiniActivity events={todayEvents} stats={stats} />
      </div>

      {/* 7-day bar chart */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-sm font-semibold text-white">Activity — Last 7 Days</div>
            <div className="text-xs mt-0.5" style={{ color: "#3a3a3a" }}>Access events per day</div>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: "#3a3a3a" }}>
            {[
              { label: "Granted", color: "#10b981" },
              { label: "Denied",  color: "#ef4444" },
              { label: "Unknown", color: "#f59e0b" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={activityData} barSize={12} barGap={3} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "#3a3a3a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#3a3a3a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
            <Bar dataKey="granted" fill="#10b981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="denied"  fill="#ef4444" radius={[3, 3, 0, 0]} />
            <Bar dataKey="unknown" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent events table */}
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

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {["Photo", "Person", "Date & Time", "Confidence", "Status", "Actions"].map((h) => (
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
                  className="transition-colors"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    background: activeRow === Number(ev.id) ? "rgba(255,255,255,0.02)" : "transparent",
                  }}
                  onMouseEnter={() => setActiveRow(Number(ev.id))}
                  onMouseLeave={() => setActiveRow(null)}
                >
                  <td className="px-5 py-3.5">
                    <Avatar
                      initials={getInitials(ev.person_id || "Unknown")}
                      color={getPersonColor(ev.person_id || "Unknown", ev.person_id || undefined)}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-medium text-white">{ev.person_id || "Unknown"}</span>
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
                  <td className="px-5 py-3.5">
                    <button className="p-1.5 rounded-lg text-neutral-700 hover:text-white hover:bg-white/5 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden">
          {recentEvents.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
            >
              <Avatar
                initials={getInitials(ev.person_id || "Unknown")}
                color={getPersonColor(ev.person_id || "Unknown", ev.person_id || undefined)}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{ev.person_id || "Unknown"}</div>
                <div className="text-xs mt-0.5" style={{ color: "#3a3a3a" }}>
                  {format(parseISO(ev.created_at), "HH:mm:ss")} · {ev.confidence ? `${ev.confidence.toFixed(1)}%` : "N/A"}
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
  );
}
