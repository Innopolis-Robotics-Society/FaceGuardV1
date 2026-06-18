import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Users, CheckCircle, AlertTriangle, Activity,
  ChevronRight, Eye, MoreHorizontal, TrendingUp, Loader,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { toast } from "sonner";
import { apiClient } from "../../../api/client";
import { transformEventToLog } from "../../../utils/transformers";
import type { Event, HealthResponse, Person } from "../../api/types";

/* ── Fallback Data ─────────────────────────────────────────────────── */
const activityData = [
  { day: "Mon", granted: 12, denied: 2, unknown: 1 },
  { day: "Tue", granted: 18, denied: 4, unknown: 3 },
  { day: "Wed", granted: 9,  denied: 1, unknown: 0 },
  { day: "Thu", granted: 22, denied: 5, unknown: 2 },
  { day: "Fri", granted: 30, denied: 3, unknown: 4 },
  { day: "Sat", granted: 14, denied: 1, unknown: 1 },
  { day: "Sun", granted: 8,  denied: 0, unknown: 0 },
];

const hourlyData = [
  { h: "00", v: 0 }, { h: "02", v: 1 }, { h: "04", v: 0 },
  { h: "06", v: 3 }, { h: "08", v: 14 }, { h: "10", v: 22 },
  { h: "12", v: 18 }, { h: "14", v: 30 }, { h: "16", v: 20 },
  { h: "18", v: 25 }, { h: "20", v: 12 }, { h: "22", v: 4 },
];

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
  icon: Icon, label, value, sub, accentColor, trend,
}: {
  icon: any; label: string; value: string | number; sub: string; accentColor: string; trend?: string;
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
      <div className="text-2xl font-semibold text-white tracking-tight mb-1">{value}</div>
      <div className="text-xs font-medium" style={{ color: "#5a5a5a" }}>{label}</div>
      <div className="text-xs mt-0.5" style={{ color: "#3a3a3a" }}>{sub}</div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const granted = status === "granted";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
      style={
        granted
          ? { background: "rgba(16,185,129,0.1)",  color: "#10b981" }
          : { background: "rgba(239,68,68,0.1)",   color: "#ef4444" }
      }
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {granted ? "Granted" : "Denied"}
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

/* ── Mini Activity Widget ────────────────────────────────── */
function MiniActivity() {
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
      {/* Quick stats row */}
      <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {[
          { label: "Granted",  value: 113, color: "#10b981" },
          { label: "Denied",   value: 16,  color: "#ef4444" },
          { label: "Unknown",  value: 7,   color: "#f59e0b" },
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
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [recentEvents, setRecentEvents] = useState<ReturnType<typeof transformEventToLog>[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const [healthData, peopleData, eventsData] = await Promise.all([
        apiClient.getHealth().catch(() => null),
        apiClient.getPeople().catch(() => []),
        apiClient.getEvents(5).catch(() => []),
      ]);

      if (healthData) setHealth(healthData);
      if (peopleData) setPeople(peopleData);
      if (eventsData) {
        const transformed = eventsData.map(transformEventToLog);
        setRecentEvents(transformed);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const connectWs = async () => {
      try {
        await apiClient.connectWebSocket();
        setWsConnected(true);

        const unsubscribe = apiClient.onEvent((event: Event) => {
          const log = transformEventToLog(event);
          setRecentEvents((prev) => [log, ...prev.slice(0, 4)]);
        });

        return () => {
          unsubscribe();
          apiClient.disconnectWebSocket();
        };
      } catch (error) {
        console.error("Failed to connect WebSocket:", error);
        setWsConnected(false);
      }
    };

    const cleanup = connectWs();
    return () => {
      cleanup.then((c) => c?.());
    };
  }, []);

  const handleOpenDoor = async () => {
    try {
      const result = await apiClient.openDoor();
      toast.success(result.message || "Door opened successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to open door";
      toast.error(message);
    }
  };

  const healthStatus = health?.status || "unknown";
  const peopleCount = people.length || 0;
  const lastEvent = recentEvents[0];

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users}         label="Registered People" value={peopleCount}       sub={`${peopleCount} total`}      accentColor="#10b981" />
        <StatCard icon={CheckCircle}   label="Access Today"      value={recentEvents.filter(e => e.status === "granted").length}      sub="last 24 hours"     accentColor="#3b82f6" />
        <StatCard icon={AlertTriangle} label="Unknown Attempts"  value={recentEvents.filter(e => e.status === "unknown").length}        sub="today"             accentColor="#f59e0b" />
        <StatCard 
          icon={Activity}      
          label="System Status"     
          value={healthStatus === "healthy" ? "Online" : "Offline"}   
          sub={health ? `Uptime: ${(health.uptime / 3600).toFixed(1)}h` : "N/A"}   
          accentColor={healthStatus === "healthy" ? "#10b981" : "#ef4444"} 
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

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-5 h-5 animate-spin" style={{ color: "#3a3a3a" }} />
            </div>
          ) : lastEvent ? (
            <>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar initials={lastEvent.initials} color={lastEvent.color} size={14} />
                  <div
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: lastEvent.status === "granted" ? "#10b981" : "#ef4444" }}
                  >
                    <CheckCircle className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="text-base font-semibold text-white">{lastEvent.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#3a3a3a" }}>
                    {lastEvent.date} · {lastEvent.time}
                  </div>
                  <div className="flex items-center gap-5 mt-3">
                    <div>
                      <div className="text-xs mb-1" style={{ color: "#3a3a3a" }}>Confidence</div>
                      <div className="text-sm font-semibold" style={{ color: lastEvent.confidence > 70 ? "#10b981" : lastEvent.confidence > 50 ? "#f59e0b" : "#ef4444" }}>
                        {lastEvent.confidence.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: "#3a3a3a" }}>Action</div>
                      <div className="text-sm font-medium text-white">{lastEvent.action}</div>
                    </div>
                  </div>
                </div>

                <StatusBadge status={lastEvent.status} />
              </div>

              {/* Confidence bar */}
              <div className="mt-5">
                <div className="flex justify-between text-xs mb-1.5" style={{ color: "#3a3a3a" }}>
                  <span>Recognition confidence</span>
                  <span style={{ color: lastEvent.confidence > 70 ? "#10b981" : "#f59e0b" }}>{lastEvent.confidence.toFixed(1)}%</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ 
                      width: `${lastEvent.confidence}%`, 
                      background: lastEvent.confidence > 70 ? "#10b981" : lastEvent.confidence > 50 ? "#f59e0b" : "#ef4444"
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8" style={{ color: "#3a3a3a" }}>
              No events yet
            </div>
          )}
        </Card>

        {/* Mini Activity */}
        <MiniActivity />
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
              {recentEvents.map((ev, idx) => (
                <tr
                  key={ev.id || idx}
                  className="transition-colors"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    background: activeRow === idx ? "rgba(255,255,255,0.02)" : "transparent",
                  }}
                  onMouseEnter={() => setActiveRow(idx)}
                  onMouseLeave={() => setActiveRow(null)}
                >
                  <td className="px-5 py-3.5">
                    <Avatar initials={ev.initials} color={ev.color} />
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-medium text-white">{ev.name}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs" style={{ color: "#3a3a3a" }}>{ev.date} · {ev.time}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <ConfidenceBar value={ev.confidence} />
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={ev.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <button 
                      onClick={handleOpenDoor}
                      className="p-1.5 rounded-lg text-neutral-700 hover:text-white hover:bg-white/5 transition-colors"
                      title="Open door"
                    >
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
              <Avatar initials={ev.initials} color={ev.color} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{ev.name}</div>
                <div className="text-xs mt-0.5" style={{ color: "#3a3a3a" }}>
                  {ev.time} · {ev.confidence.toFixed(1)}%
                </div>
              </div>
              <StatusBadge status={ev.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
