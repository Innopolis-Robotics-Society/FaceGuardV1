import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Activity, AlertTriangle, CheckCircle, ChevronRight, DoorOpen, Loader2, Server, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  type AgentHealth,
  type AgentStats,
  type ApiPerson,
  type RecognitionEvent,
  type Telemetry,
  agentJson,
  backendJson,
  colorFor,
  eventName,
  eventStatus,
  formatTime,
  groupEventsByDay,
  groupEventsByHour,
  initials,
  matchQuality,
} from "../../lib/faceguardApi";

const CARD = { background: "#111111", border: "1px solid rgba(255,255,255,0.06)" };
const TOOLTIP_STYLE = { background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", color: "#f0f0f0", fontSize: "12px" };

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl ${className}`} style={CARD}>
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accentColor }: { icon: any; label: string; value: string | number; sub: string; accentColor: string }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${accentColor}12` }}>
          <Icon className="h-4 w-4" style={{ color: accentColor }} />
        </div>
      </div>
      <div className="mb-1 text-2xl font-semibold tracking-tight text-white">{value}</div>
      <div className="text-xs font-medium" style={{ color: "#5a5a5a" }}>{label}</div>
      <div className="mt-0.5 text-xs" style={{ color: "#3a3a3a" }}>{sub}</div>
    </Card>
  );
}

function Avatar({ name }: { name: string }) {
  const color = colorFor(name);
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold" style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
      {initials(name)}
    </div>
  );
}

function EventRow({ event, threshold }: { event: RecognitionEvent; threshold: number }) {
  const name = eventName(event);
  const status = eventStatus(event);
  const quality = matchQuality(event.recognition_distance, threshold);
  const statusColor = status === "granted" ? "#10b981" : status === "manual" ? "#3b82f6" : "#f59e0b";

  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
      <Avatar name={name} />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-white">{name}</div>
        <div className="text-xs" style={{ color: "#3a3a3a" }}>{formatTime(event.created_at)}</div>
      </div>
      <div className="hidden min-w-24 sm:block">
        <div className="mb-1 flex justify-between text-xs" style={{ color: "#3a3a3a" }}>
          <span>Quality</span>
          <span style={{ color: statusColor }}>{event.recognition_distance == null ? "manual" : `${quality}%`}</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full" style={{ width: `${event.recognition_distance == null ? 100 : quality}%`, background: statusColor }} />
        </div>
      </div>
      <span className="rounded-full px-2.5 py-1 text-xs font-medium capitalize" style={{ background: `${statusColor}18`, color: statusColor }}>
        {status}
      </span>
    </div>
  );
}

export function Dashboard() {
  const [people, setPeople] = useState<ApiPerson[]>([]);
  const [events, setEvents] = useState<RecognitionEvent[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [health, setHealth] = useState<AgentHealth | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const results = await Promise.allSettled([
      backendJson<ApiPerson[]>("/api/v1/people/?skip=0&limit=1000"),
      agentJson<RecognitionEvent[]>("/events?limit=200"),
      agentJson<AgentStats>("/stats"),
      agentJson<Telemetry>("/telemetry"),
      agentJson<AgentHealth>("/health"),
    ]);
    if (results[0].status === "fulfilled") setPeople(results[0].value);
    if (results[1].status === "fulfilled") setEvents(results[1].value);
    if (results[2].status === "fulfilled") setStats(results[2].value);
    if (results[3].status === "fulfilled") setTelemetry(results[3].value);
    if (results[4].status === "fulfilled") setHealth(results[4].value);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const threshold = stats?.settings.recognition_threshold ?? 50;
  const dayData = useMemo(() => groupEventsByDay(events), [events]);
  const hourData = useMemo(() => groupEventsByHour(events), [events]);
  const latest = events[0] ?? null;
  const activePeople = people.filter((person) => person.access_enabled).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Registered People" value={people.length} sub={`${activePeople} active in backend DB`} accentColor="#10b981" />
        <StatCard icon={CheckCircle} label="Recognized Today" value={stats?.recognized_today ?? 0} sub={`${stats?.door_opened_today ?? 0} door openings`} accentColor="#3b82f6" />
        <StatCard icon={AlertTriangle} label="Unknown Today" value={stats?.unknown_today ?? 0} sub={`${stats?.today_events ?? 0} total events`} accentColor="#f59e0b" />
        <StatCard icon={Activity} label="System Status" value={health?.status ?? "offline"} sub={telemetry ? `${telemetry.cpu_percent.toFixed(0)}% CPU · ${telemetry.camera_fps.toFixed(1)} fps` : "agent unavailable"} accentColor={health ? "#10b981" : "#ef4444"} />
      </div>

      {loading && (
        <Card className="flex items-center justify-center gap-2 p-5 text-sm text-white">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading live dashboard
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div className="text-sm font-semibold text-white">Last Event</div>
            <Link to="/logs" className="flex items-center gap-1 text-xs transition-colors hover:text-white" style={{ color: "#3a3a3a" }}>
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {latest ? (
            <div className="flex items-center gap-4">
              <Avatar name={eventName(latest)} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold text-white">{eventName(latest)}</div>
                <div className="mt-0.5 text-xs" style={{ color: "#3a3a3a" }}>{formatTime(latest.created_at)}</div>
                <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div style={{ color: "#3a3a3a" }}>Distance</div>
                    <div className="mt-1 font-semibold text-white">{latest.recognition_distance == null ? "manual" : latest.recognition_distance.toFixed(1)}</div>
                  </div>
                  <div>
                    <div style={{ color: "#3a3a3a" }}>Action</div>
                    <div className="mt-1 font-semibold text-white">{latest.door_opened ? "Door opened" : "Door closed"}</div>
                  </div>
                </div>
              </div>
              <DoorOpen className="h-5 w-5" style={{ color: latest.door_opened ? "#10b981" : "#5a5a5a" }} />
            </div>
          ) : (
            <div className="rounded-xl px-3 py-10 text-center text-sm" style={{ background: "#1b1b1b", color: "#777" }}>
              No local recognition events yet
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Today's Activity</div>
              <div className="mt-0.5 text-xs" style={{ color: "#3a3a3a" }}>Events by hour</div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: health ? "#10b981" : "#ef4444" }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: health ? "#10b981" : "#ef4444" }} />
              Live
            </div>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={hourData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGreenLive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="h" tick={{ fill: "#3a3a3a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#3a3a3a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />
              <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={1.5} fill="url(#areaGreenLive)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Activity — Last 7 Days</div>
            <div className="mt-0.5 text-xs" style={{ color: "#3a3a3a" }}>Local agent events</div>
          </div>
          <div className="hidden items-center gap-4 text-xs sm:flex" style={{ color: "#3a3a3a" }}>
            <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#10b981]" />Granted</span>
            <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#f59e0b]" />Unknown</span>
            <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#3b82f6]" />Manual</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dayData} barSize={12} barGap={3} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "#3a3a3a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#3a3a3a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
            <Bar dataKey="granted" fill="#10b981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="unknown" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            <Bar dataKey="manual" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="text-sm font-semibold text-white">Recent Access Events</div>
          <Link to="/logs" className="flex items-center gap-1 text-xs transition-colors hover:text-white" style={{ color: "#3a3a3a" }}>
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {events.slice(0, 8).length === 0 ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: "#777" }}>No events yet</div>
        ) : (
          events.slice(0, 8).map((event) => <EventRow key={event.id} event={event} threshold={threshold} />)
        )}
      </Card>
    </div>
  );
}
