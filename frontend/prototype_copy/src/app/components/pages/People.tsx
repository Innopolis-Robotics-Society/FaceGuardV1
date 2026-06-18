import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Search, Plus, Grid, List, Edit, Trash2,
  User, Camera, Upload, X, ChevronLeft, ChevronRight, Loader,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../../api/client";
import { generateInitials } from "../../../utils/transformers";
import type { Person } from "../../api/types";

const CARD = { background: "#111111", border: "1px solid rgba(255,255,255,0.06)" };

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#6366f1",
];

function getColorForId(id: string): string {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
}

function Avatar({ initials, color, size = "lg" }: { initials: string; color: string; size?: "sm" | "md" | "lg" }) {
  const s = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base" }[size];
  return (
    <div
      className={`${s} rounded-full flex items-center justify-center font-semibold shrink-0`}
      style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={
        status === "active"
          ? { background: "rgba(16,185,129,0.1)", color: "#10b981" }
          : { background: "rgba(90,90,90,0.15)", color: "#5a5a5a" }
      }
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );
}

/* ── Add Person Modal ─────────────────────────────────── */
function AddPersonModal({ onClose, onSave }: { onClose: () => void; onSave: (personId: string, name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [personId, setPersonId] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    if (!personId.trim()) {
      toast.error("Please enter a person ID");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    try {
      setLoading(true);
      await onSave(personId, name);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add person";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div
        className="relative rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h2 className="text-sm font-semibold text-white">Add New Person</h2>
          <button onClick={onClose} className="text-neutral-600 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#5a5a5a" }}>
              Person ID *
            </label>
            <input
              type="text"
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              placeholder="e.g. person_001"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-neutral-700 outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#5a5a5a" }}>
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-neutral-700 outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            />
          </div>
        </div>

        <div className="flex gap-2 px-6 pb-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "#1a1a1a", color: "#a0a0a0" }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-black flex items-center justify-center gap-2"
            style={{ background: "#ffffff", opacity: loading ? 0.5 : 1 }}
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {loading ? "Saving..." : "Add Person"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Modal ─────────────────────────────────────── */
function DeleteModal({ name, onConfirm, onCancel, loading }: { name: string; onConfirm: () => void; onCancel: () => void; loading?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onCancel} />
      <div
        className="relative rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(239,68,68,0.1)" }}>
          <Trash2 className="w-5 h-5 text-red-500" />
        </div>
        <h3 className="text-sm font-semibold text-white text-center mb-2">Delete Person</h3>
        <p className="text-xs text-center mb-5 leading-relaxed" style={{ color: "#5a5a5a" }}>
          Delete <strong className="text-white">{name}</strong> and all their photos?
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "#1a1a1a", color: "#a0a0a0" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
            style={{ background: "#ef4444", opacity: loading ? 0.5 : 1 }}
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            Delete
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
  const [people, setPeople] = useState<Person[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const PER_PAGE = 6;

  useEffect(() => {
    loadPeople();
  }, []);

  async function loadPeople() {
    try {
      setLoading(true);
      const data = await apiClient.getPeople();
      setPeople(data);
    } catch (error) {
      console.error("Failed to load people:", error);
      toast.error("Failed to load people list");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPerson(personId: string, name: string) {
    try {
      const newPerson = await apiClient.addPerson(personId, name);
      setPeople((prev) => [...prev, newPerson]);
      toast.success(`${name} added successfully`);
    } catch (error) {
      throw error;
    }
  }

  const filtered = people.filter((p) => {
    const okName = p.display_name.toLowerCase().includes(search.toLowerCase());
    return okName;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    toast.success(`${deleteTarget.name} deleted`);
    setPeople((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleteLoading(false);
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#3a3a3a" }} />
          <input
            type="text"
            placeholder="Search people…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-neutral-700 outline-none"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          {([["grid", Grid], ["list", List]] as const).map(([v, Icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="p-2 rounded-lg transition-colors"
              style={view === v ? { background: "#ffffff", color: "#080808" } : { color: "#5a5a5a" }}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-black"
          style={{ background: "#ffffff" }}
        >
          <Plus className="w-4 h-4" /> Add New Person
        </button>
      </div>

      <div className="text-xs" style={{ color: "#3a3a3a" }}>
        {filtered.length} people total
      </div>

      {/* Empty state / Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={CARD}>
          <Loader className="w-10 h-10 mb-3 animate-spin" style={{ color: "#3a3a3a" }} />
          <p className="text-sm font-medium text-white mb-1">Loading people...</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={CARD}>
          <User className="w-10 h-10 mb-3" style={{ color: "#1a1a1a" }} />
          <p className="text-sm font-medium text-white mb-1">No people found</p>
          <p className="text-xs" style={{ color: "#3a3a3a" }}>Adjust your search or add a new person</p>
        </div>
      ) : null}

      {/* Grid view */}
      {view === "grid" && paginated.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {paginated.map((p) => {
            const initials = generateInitials(p.display_name);
            const color = getColorForId(p.id);
            return (
              <div key={p.id} className="rounded-2xl p-5" style={CARD}>
                <div className="flex items-start gap-3 mb-4">
                  <Avatar initials={initials} color={color} />
                  <div className="flex-1 min-w-0">
                    <Link to={`/people/${p.id}`} className="text-sm font-semibold text-white hover:underline block truncate">
                      {p.display_name}
                    </Link>
                    <div className="mt-1">
                      <StatusBadge status="active" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs mb-4" style={{ color: "#3a3a3a" }}>
                  <span>{p.photo_count} photo{p.photo_count !== 1 ? "s" : ""}</span>
                  <span>·</span>
                  <span>{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/people/${p.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-black"
                    style={{ background: "#ffffff" }}
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <button
                    onClick={() => setDeleteTarget({ id: p.id, name: p.display_name })}
                    className="p-2 rounded-xl text-neutral-600 hover:text-red-400 transition-colors"
                    style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {view === "list" && paginated.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={CARD}>
          {paginated.map((p) => {
            const initials = generateInitials(p.display_name);
            const color = getColorForId(p.id);
            return (
              <div
                key={p.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <Avatar initials={initials} color={color} size="sm" />
                <div className="flex-1 min-w-0">
                  <Link to={`/people/${p.id}`} className="text-sm font-medium text-white hover:underline">
                    {p.display_name}
                  </Link>
                </div>
                <span className="text-xs" style={{ color: "#3a3a3a" }}>
                  {p.photo_count} photos
                </span>
                <StatusBadge status="active" />
                <div className="flex items-center gap-1">
                  <Link
                    to={`/people/${p.id}`}
                    className="p-1.5 rounded-lg text-neutral-600 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteTarget({ id: p.id, name: p.display_name })}
                    className="p-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl transition-colors disabled:opacity-30"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)", color: "#a0a0a0" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className="w-9 h-9 rounded-xl text-sm font-medium transition-all"
              style={
                n === page
                  ? { background: "#ffffff", color: "#080808" }
                  : { background: "#111111", color: "#5a5a5a", border: "1px solid rgba(255,255,255,0.06)" }
              }
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl transition-colors disabled:opacity-30"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)", color: "#a0a0a0" }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {showAdd && <AddPersonModal onClose={() => setShowAdd(false)} onSave={handleAddPerson} />}
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
