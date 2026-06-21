import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  Search, Plus, Grid, List, Edit, Trash2,
  User, ChevronLeft, ChevronRight,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useGetPeople, useCreatePerson, useDeletePerson } from "../../../hooks/api/usePeople";

const CARD = { background: "#111111", border: "1px solid rgba(255,255,255,0.06)" };

function Avatar({ initials, color, size = "lg" }: { initials: string; color: string; size?: "sm" | "md" | "lg" }) {
  const s = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base" }[size];
  return (
    <div className={`${s} rounded-full flex items-center justify-center font-semibold shrink-0`}
      style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
      {initials}
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={
        active
          ? { background: "rgba(16,185,129,0.1)", color: "#10b981" }
          : { background: "rgba(90,90,90,0.15)", color: "#5a5a5a" }
      }>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function getPersonColor(name: string) {
  const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#14b8a6"];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

/* ── Add Person Modal ─────────────────────────────────── */
function AddPersonModal({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    if (!name.trim()) {
      return;
    }
    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        description: note.trim() || null,
        access_enabled: true,
      });
      onClose();
    } catch (error) {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-sm font-semibold text-white">Add New Person</h2>
          <button onClick={onClose} className="text-neutral-600 hover:text-white transition-colors">
            <User className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#5a5a5a" }}>Full Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-neutral-700 outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#5a5a5a" }}>Note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note…" rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-neutral-700 outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }} />
          </div>
        </div>

        <div className="flex gap-2 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "#1a1a1a", color: "#a0a0a0" }} disabled={loading}>Cancel</button>
          <button onClick={save} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-black"
            style={{ background: "#ffffff" }} disabled={loading || !name.trim()}>
            {loading ? "Saving..." : "Save Person"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Modal ─────────────────────────────────────── */
function DeleteModal({ name, onConfirm, onCancel, loading }: { name: string; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onCancel} />
      <div className="relative rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(239,68,68,0.1)" }}>
          <Trash2 className="w-5 h-5 text-red-500" />
        </div>
        <h3 className="text-sm font-semibold text-white text-center mb-2">Delete Person</h3>
        <p className="text-xs text-center mb-5 leading-relaxed" style={{ color: "#5a5a5a" }}>
          Delete <strong className="text-white">{name}</strong> and all their photos?
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "#1a1a1a", color: "#a0a0a0" }} disabled={loading}>Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: "#ef4444" }} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────── */
export function People() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 6;

  const { data: people = [], isLoading } = useGetPeople();
  const createMutation = useCreatePerson();
  const deleteMutation = useDeletePerson();

  const filtered = useMemo(() => {
    return people.filter((p) => {
      const okName = p.name.toLowerCase().includes(search.toLowerCase());
      const okStatus = filter === "all" ||
        (filter === "active" && p.access_enabled) ||
        (filter === "inactive" && !p.access_enabled);
      const notDeleted = !p.deleted_at;
      return okName && okStatus && notDeleted;
    });
  }, [people, search, filter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(
      { personId: deleteTarget.id },
      {
        onSuccess: () => setDeleteTarget(null),
      }
    );
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#3a3a3a" }} />
          <input type="text" placeholder="Search people…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-neutral-700 outline-none"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }} />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          {(["all", "active", "inactive"] as const).map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
              style={filter === f ? { background: "#ffffff", color: "#080808" } : { color: "#5a5a5a" }}>
              {f}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          {([["grid", Grid], ["list", List]] as const).map(([v, Icon]) => (
            <button key={v} onClick={() => setView(v)}
              className="p-2 rounded-lg transition-colors"
              style={view === v ? { background: "#ffffff", color: "#080808" } : { color: "#5a5a5a" }}>
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-black"
          style={{ background: "#ffffff" }}>
          <Plus className="w-4 h-4" /> Add New Person
        </button>
      </div>

      <div className="text-xs" style={{ color: "#3a3a3a" }}>
        {filtered.length} people · {people.filter((p) => p.access_enabled && !p.deleted_at).length} active
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && paginated.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={CARD}>
          <User className="w-10 h-10 mb-3" style={{ color: "#1a1a1a" }} />
          <p className="text-sm font-medium text-white mb-1">No people found</p>
          <p className="text-xs" style={{ color: "#3a3a3a" }}>Adjust your search or filters</p>
        </div>
      )}

      {/* Grid view */}
      {!isLoading && view === "grid" && paginated.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {paginated.map((p) => (
            <div key={p.id} className="rounded-2xl p-5" style={CARD}>
              <div className="flex items-start gap-3 mb-4">
                <Avatar initials={getInitials(p.name)} color={getPersonColor(p.name)} />
                <div className="flex-1 min-w-0">
                  <Link to={`/people/${p.id}`}
                    className="text-sm font-semibold text-white hover:underline block truncate">{p.name}</Link>
                  <div className="mt-1"><StatusBadge active={p.access_enabled} /></div>
                  {p.description && <p className="text-xs mt-1.5 truncate" style={{ color: "#3a3a3a" }}>{p.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs mb-4" style={{ color: "#3a3a3a" }}>
                <span>{p.photo_count} photo{p.photo_count !== 1 ? "s" : ""}</span>
                <span>·</span>
                <span>{format(parseISO(p.created_at), "yyyy-MM-dd")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/people/${p.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-black"
                  style={{ background: "#ffffff" }}>
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Link>
                <button onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                  className="p-2 rounded-xl text-neutral-600 hover:text-red-400 transition-colors"
                  style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {!isLoading && view === "list" && paginated.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={CARD}>
          {paginated.map((p) => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <Avatar initials={getInitials(p.name)} color={getPersonColor(p.name)} size="sm" />
              <div className="flex-1 min-w-0">
                <Link to={`/people/${p.id}`} className="text-sm font-medium text-white hover:underline">{p.name}</Link>
                {p.description && <p className="text-xs truncate" style={{ color: "#3a3a3a" }}>{p.description}</p>}
              </div>
              <span className="text-xs" style={{ color: "#3a3a3a" }}>{p.photo_count} photos</span>
              <StatusBadge active={p.access_enabled} />
              <div className="flex items-center gap-1">
                <Link to={`/people/${p.id}`} className="p-1.5 rounded-lg text-neutral-600 hover:text-white hover:bg-white/5 transition-colors"><Edit className="w-4 h-4" /></Link>
                <button onClick={() => setDeleteTarget({ id: p.id, name: p.name })} className="p-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-xl transition-colors disabled:opacity-30"
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
            className="p-2 rounded-xl transition-colors disabled:opacity-30"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)", color: "#a0a0a0" }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {showAdd && <AddPersonModal onClose={() => setShowAdd(false)} onSave={(data) => createMutation.mutate(data)} />}
      {deleteTarget && <DeleteModal name={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteMutation.isPending} />}
    </div>
  );
}
