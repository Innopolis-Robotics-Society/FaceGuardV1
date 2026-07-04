import { useState, useEffect, useMemo } from "react";
import { Outlet, NavLink, useLocation } from "react-router";
import {
  LayoutDashboard, Camera, Users, FileText, Server, Settings,
  Shield, ChevronDown, LogOut, Menu, X, Wifi, WifiOff,
  Clock, User,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import { useGetDevices } from "../../hooks/api/useDevices";

const NAV_ITEMS = [
  { path: "/",        label: "Dashboard",   icon: LayoutDashboard, end: true },
  { path: "/camera",  label: "Live Camera", icon: Camera },
  { path: "/people",  label: "People",      icon: Users },
  { path: "/logs",    label: "Access Logs", icon: FileText },
  { path: "/system",  label: "System",      icon: Server },
  // { path: "/settings",label: "Settings",    icon: Settings },
];

const PAGE_TITLES: Record<string, string> = {
  "/":         "Dashboard",
  "/camera":   "Live Camera",
  "/people":   "People",
  "/logs":     "Access Logs",
  "/system":   "System",
  "/settings": "Settings",
};

function useCurrentTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

const NOTIFICATIONS = [
  { id: 1, text: "Unknown person detected at front door", time: "2 min ago", dot: "#f59e0b" },
  { id: 2, text: "Access granted — John Doe",             time: "14 min ago", dot: "#10b981" },
  { id: 3, text: "Camera reconnected successfully",        time: "1h ago",    dot: "#3b82f6" },
];

export function Layout() {
  const { user, logout } = useAuth();
  const { data: devices = [] } = useGetDevices();
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [notifOpen,   setNotifOpen]     = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);
  const location = useLocation();
  const now = useCurrentTime();

  // Get active device status
  const activeDevice = useMemo(
    () => devices.find((d) => d.status === "online") ?? devices[0],
    [devices]
  );

  const piStatus = activeDevice?.status === "online" ? "online" : "offline";
  const piName = activeDevice?.name ?? "No Device";

  const pageTitle =
    PAGE_TITLES[location.pathname] ??
    (location.pathname.startsWith("/people/") ? "Person Profile" : "FaceGuard");

  /* close dropdowns on outside click */
  useEffect(() => {
    const close = () => { setNotifOpen(false); setProfileOpen(false); };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  function stopProp(e: React.MouseEvent) { e.stopPropagation(); }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#080808", color: "#f0f0f0" }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col w-60 transition-transform duration-200
          lg:static lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ background: "#060606", borderRight: "1px solid rgba(255,255,255,0.05)" }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 py-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#ffffff" }}
          >
            <Shield className="w-4 h-4" style={{ color: "#080808" }} />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-white">FaceGuard</div>
            <div className="text-xs" style={{ color: "#3a3a3a" }}>Admin Panel</div>
          </div>
          <button
            className="ml-auto lg:hidden text-neutral-600 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ path, label, icon: Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? "bg-white text-black font-medium"
                    : "text-neutral-500 hover:text-white hover:bg-white/5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Admin profile */}
        <div
          className="px-2 py-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-black shrink-0"
              style={{ background: "#ffffff" }}
            >
              {user?.username.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">{user?.username || "Admin"}</div>
              <div className="text-xs truncate" style={{ color: "#3a3a3a" }}>
                {user?.role === "superadmin" ? "Superadmin" : "Administrator"}
              </div>
            </div>
            <button
              onClick={logout}
              className="text-neutral-600 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* TopBar */}
        <header
          className="shrink-0 flex items-center gap-3 px-4 lg:px-6 h-14"
          style={{ background: "#060606", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <button
            className="lg:hidden text-neutral-600 hover:text-white p-1 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <span className="text-sm font-semibold text-white">{pageTitle}</span>

          <div className="ml-auto flex items-center gap-1.5">
            {/* Pi status */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
              style={
                piStatus === "online"
                  ? { background: "rgba(16,185,129,0.08)", color: "#10b981" }
                  : { background: "rgba(239,68,68,0.08)", color: "#ef4444" }
              }
            >
              {piStatus === "online" ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="hidden md:inline">{piName}</span>
              <span>{piStatus === "online" ? "Online" : "Offline"}</span>
            </div>

            {/* Time */}
            <div
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs"
              style={{ color: "#3a3a3a" }}
            >
              <Clock className="w-3 h-3" />
              {now.toLocaleTimeString("en-GB")}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
