import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Search,
  Plus,
  Grid,
  List,
  Edit,
  Trash2,
  User,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = (import.meta.env.VITE_FACEGUARD_API_URL as string | undefined) ?? "/backend";
const CARD = { background: "#111111", border: "1px solid rgba(255,255,255,0.06)" };
const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6", "#f97316"];

type ApiPerson = {
  id: string;
  name: string;
  description: string | null;
  access_enabled: boolean;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  photo_count: number;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

function colorFor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash + char.charCodeAt(0)) % COLORS.length;
  return COLORS[hash];
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      message = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail ?? body);
    } catch {
      // Keep HTTP status message.
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function Avatar({ name, color, size = "lg" }: { name: string; color: string; size?: "sm" | "lg" }) {
  const s = size === "sm" ? "w-8 h-8 text-xs" : "w-14 h-14 text-base";
  return (
    <div
      className={`${s} flex shrink-0 items-center justify-center rounded-full font-semibold`}
      style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}
    >
      {initials(name)}
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={
        active
          ? { background: "rgba(16,185,129,0.1)", color: "#10b981" }
          : { background: "rgba(90,90,90,0.15)", color: "#5a5a5a" }
      }
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function AddPersonModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    const displayName = name.trim();
    if (!displayName) {
      toast.error("Please enter a name");
      return;
    }

    setSaving(true);
    try {
      const person = await apiJson<ApiPerson>("/api/v1/people/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: displayName,
          description: note.trim() || null,
          access_enabled: true,
        }),
      });

      if (file) {
        const form = new FormData();
        form.append("files", file);
        await apiJson(`/api/v1/people/${person.id}/photos`, { method: "POST", body: form });
      }

      toast.success(`${displayName} saved in backend database`);
      await onCreated();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-sm font-semibold text-white">Add New Person</h2>
          <button onClick={onClose} className="text-neutral-600 transition-colors hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="flex justify-center">
            <div
              className="flex h-20 w-20 flex-col items-center justify-center overflow-hidden rounded-2xl"
              style={{
                background: preview ? "transparent" : "rgba(255,255,255,0.03)",
                border: "1.5px dashed rgba(255,255,255,0.08)",
              }}
            >
              {preview ? (
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <>
                  <User className="mb-1 h-7 w-7" style={{ color: "#2a2a2a" }} />
                  <span className="text-xs" style={{ color: "#2a2a2a" }}>
                    Photo
                  </span>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: "#5a5a5a" }}>
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. John Doe"
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder-neutral-700"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: "#5a5a5a" }}>
              Note
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optional note"
              rows={2}
              className="w-full resize-none rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder-neutral-700"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            />
          </div>

          <label
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium"
            style={{ background: "#1a1a1a", color: "#a0a0a0", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Upload className="h-3.5 w-3.5" />
            Optional Photo Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                setFile(selected);
                setPreview(selected ? URL.createObjectURL(selected) : null);
              }}
            />
          </label>
        </div>

        <div className="flex gap-2 px-6 pb-5">
          <button onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm font-medium" style={{ background: "#1a1a1a", color: "#a0a0a0" }}>
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-black disabled:opacity-50"
            style={{ background: "#ffffff" }}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Person
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl" style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "rgba(239,68,68,0.1)" }}>
          <Trash2 className="h-5 w-5 text-red-500" />
        </div>
        <h3 className="mb-2 text-center text-sm font-semibold text-white">Delete Person</h3>
        <p className="mb-5 text-center text-xs leading-relaxed" style={{ color: "#5a5a5a" }}>
          Delete <strong className="text-white">{name}</strong> from backend database?
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-xl py-2.5 text-sm font-medium" style={{ background: "#1a1a1a", color: "#a0a0a0" }}>
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white" style={{ background: "#ef4444" }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function People() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiPerson | null>(null);
  const [people, setPeople] = useState<ApiPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PER_PAGE = 6;

  async function loadPeople(showToast = false) {
    setLoading(true);
    try {
      const data = await apiJson<ApiPerson[]>("/api/v1/people/?skip=0&limit=1000");
      setPeople(data);
      if (showToast) toast.success("People loaded from backend database");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPeople();
  }, []);

  const filtered = useMemo(() => {
    return people.filter((person) => {
      const okName = person.name.toLowerCase().includes(search.toLowerCase());
      const okStatus =
        filter === "all" ||
        (filter === "active" && person.access_enabled) ||
        (filter === "inactive" && !person.access_enabled);
      return okName && okStatus;
    });
  }, [filter, people, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await apiJson(`/api/v1/people/${deleteTarget.id}`, { method: "DELETE" });
      toast.success(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
      await loadPeople();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "#3a3a3a" }} />
          <input
            type="text"
            placeholder="Search people"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder-neutral-700"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          {(["all", "active", "inactive"] as const).map((item) => (
            <button
              key={item}
              onClick={() => {
                setFilter(item);
                setPage(1);
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all"
              style={filter === item ? { background: "#ffffff", color: "#080808" } : { color: "#5a5a5a" }}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          {([["grid", Grid], ["list", List]] as const).map(([item, Icon]) => (
            <button
              key={item}
              onClick={() => setView(item)}
              className="rounded-lg p-2 transition-colors"
              style={view === item ? { background: "#ffffff", color: "#080808" } : { color: "#5a5a5a" }}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <button
          onClick={() => void loadPeople(true)}
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium"
          style={{ background: "#111111", color: "#a0a0a0", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>

        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-black" style={{ background: "#ffffff" }}>
          <Plus className="h-4 w-4" />
          Add New Person
        </button>
      </div>

      <div className="flex items-center justify-between text-xs" style={{ color: "#3a3a3a" }}>
        <span>
          {filtered.length} people in backend DB · {people.filter((person) => person.access_enabled).length} active
        </span>
        <span>{API_URL}</span>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl py-14 text-sm text-white" style={CARD}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading backend people
        </div>
      )}

      {!loading && paginated.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl py-20" style={CARD}>
          <User className="mb-3 h-10 w-10" style={{ color: "#1a1a1a" }} />
          <p className="mb-1 text-sm font-medium text-white">No people found</p>
          <p className="text-xs" style={{ color: "#3a3a3a" }}>
            Add a person from this page or capture one on the Live Camera page
          </p>
        </div>
      )}

      {!loading && view === "grid" && paginated.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((person) => {
            const color = colorFor(person.id);
            return (
              <div key={person.id} className="rounded-2xl p-5" style={CARD}>
                <div className="mb-4 flex items-start gap-3">
                  <Avatar name={person.name} color={color} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/people/${person.id}`} className="block truncate text-sm font-semibold text-white hover:underline">
                      {person.name}
                    </Link>
                    <div className="mt-1">
                      <StatusBadge active={person.access_enabled} />
                    </div>
                    {person.description && (
                      <p className="mt-1.5 truncate text-xs" style={{ color: "#3a3a3a" }}>
                        {person.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mb-4 flex items-center gap-3 text-xs" style={{ color: "#3a3a3a" }}>
                  <span>
                    {person.photo_count} photo{person.photo_count !== 1 ? "s" : ""}
                  </span>
                  <span>·</span>
                  <span>{new Date(person.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/people/${person.id}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-black" style={{ background: "#ffffff" }}>
                    <Edit className="h-3.5 w-3.5" />
                    Details
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(person)}
                    className="rounded-xl p-2 text-neutral-600 transition-colors hover:text-red-400"
                    style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && view === "list" && paginated.length > 0 && (
        <div className="overflow-hidden rounded-2xl" style={CARD}>
          {paginated.map((person) => {
            const color = colorFor(person.id);
            return (
              <div key={person.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.03]" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <Avatar name={person.name} color={color} size="sm" />
                <div className="min-w-0 flex-1">
                  <Link to={`/people/${person.id}`} className="text-sm font-medium text-white hover:underline">
                    {person.name}
                  </Link>
                  {person.description && (
                    <p className="truncate text-xs" style={{ color: "#3a3a3a" }}>
                      {person.description}
                    </p>
                  )}
                </div>
                <span className="text-xs" style={{ color: "#3a3a3a" }}>
                  {person.photo_count} photos
                </span>
                <StatusBadge active={person.access_enabled} />
                <button onClick={() => setDeleteTarget(person)} className="rounded-lg p-1.5 text-neutral-600 transition-colors hover:bg-red-500/10 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page === 1}
            className="rounded-xl p-2 transition-colors disabled:opacity-30"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)", color: "#a0a0a0" }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
            <button
              key={item}
              onClick={() => setPage(item)}
              className="h-9 w-9 rounded-xl text-sm font-medium transition-all"
              style={item === page ? { background: "#ffffff", color: "#080808" } : { background: "#111111", color: "#5a5a5a", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {item}
            </button>
          ))}
          <button
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={page === totalPages}
            className="rounded-xl p-2 transition-colors disabled:opacity-30"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)", color: "#a0a0a0" }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {showAdd && <AddPersonModal onClose={() => setShowAdd(false)} onCreated={() => loadPeople()} />}
      {deleteTarget && <DeleteModal name={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}
