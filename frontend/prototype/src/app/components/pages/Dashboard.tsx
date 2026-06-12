import { useState } from "react";
import { Link } from "react-router";
import {
  Users, CheckCircle, AlertTriangle, Activity,
  ChevronRight, Eye, MoreHorizontal, TrendingUp,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";

/* ── Data ─────────────────────────────────────────────────── */
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

const recentEvents = [
  { id: 1, name: "John Doe",     initials: "JD", color: "#10b981", time: "14:32:01", date: "2026-06-11", confidence: 97.4, status: "granted" },
  { id: 2, name: "Unknown",      initials: "?",  color: "#f59e0b", time: "14:18:45", date: "2026-06-11", confidence: 34.1, status: "denied"  },
  { id: 3, name: "Mary Smith",   initials: "MS", color: "#3b82f6", time: "13:55:10", date: "2026-06-11", confidence: 91.2, status: "granted" },
  { id: 4, name: "Bob Johnson",  initials: "BJ", color: "#8b5cf6", time: "13:40:22", date: "2026-06-11", confidence: 88.7, status: "granted" },
  { id: 5, name: "Unknown",      initials: "?",  color: "#f59e0b", time: "12:11:05", date: "2026-06-11", confidence: 28.5, status: "denied"  },
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

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users}         label="Registered People" value={24}       sub="+2 this week"      accentColor="#10b981" trend="+8%" />
        <StatCard icon={CheckCircle}   label="Access Today"      value={113}      sub="last 24 hours"     accentColor="#3b82f6" trend="+12%" />
        <StatCard icon={AlertTriangle} label="Unknown Attempts"  value={7}        sub="today"             accentColor="#f59e0b" />
        <StatCard icon={Activity}      label="System Status"     value="Online"   sub="All services up"   accentColor="#10b981" />
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

          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar initials="JD" color="#10b981" size={14} />
              <div
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: "#10b981" }}
              >
                <CheckCircle className="w-2.5 h-2.5 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <div className="text-base font-semibold text-white">John Doe</div>
              <div className="text-xs mt-0.5" style={{ color: "#3a3a3a" }}>
                2026-06-11 · 14:32:01
              </div>
              <div className="flex items-center gap-5 mt-3">
                <div>
                  <div className="text-xs mb-1" style={{ color: "#3a3a3a" }}>Confidence</div>
                  <div className="text-sm font-semibold" style={{ color: "#10b981" }}>97.4%</div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: "#3a3a3a" }}>Action</div>
                  <div className="text-sm font-medium text-white">Door opened</div>
                </div>
              </div>
            </div>

            <StatusBadge status="granted" />
          </div>

          {/* Confidence bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: "#3a3a3a" }}>
              <span>Recognition confidence</span>
              <span style={{ color: "#10b981" }}>97.4%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: "97.4%", background: "#10b981" }}
              />
            </div>
          </div>
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
              {recentEvents.map((ev) => (
                <tr
                  key={ev.id}
                  className="transition-colors"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    background: activeRow === ev.id ? "rgba(255,255,255,0.02)" : "transparent",
                  }}
                  onMouseEnter={() => setActiveRow(ev.id)}
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
              <Avatar initials={ev.initials} color={ev.color} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{ev.name}</div>
                <div className="text-xs mt-0.5" style={{ color: "#3a3a3a" }}>
                  {ev.time} · {ev.confidence}%
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
