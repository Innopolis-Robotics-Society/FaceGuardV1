import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Camera,
  Check,
  Edit,
  Eye,
  Loader2,
  Plus,
  RefreshCcw,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Upload,
  User,
  X,
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

type ApiPhoto = {
  id: string;
  person_id: string;
  original_path: string;
  processed_path: string | null;
  thumbnail_path: string | null;
  quality_score: number | null;
  face_detected: boolean;
  width: number | null;
  height: number | null;
  blur_score: number | null;
  brightness_score: number | null;
  created_at: string;
  deleted_at: string | null;
  is_primary: boolean;
};

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      message = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail ?? body);
    } catch {
      // Keep the HTTP status message.
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function colorFor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash + char.charCodeAt(0)) % COLORS.length;
  return COLORS[hash];
}

function formatDate(value: string | null) {
  if (!value) return "n/a";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function fileName(path: string) {
  return path.split(/[\\/]/).pop() || "photo.jpg";
}

function photoContentUrl(personId: string, photoId: string, type: "thumbnail" | "original" = "thumbnail") {
  return `${API_URL}/api/v1/people/${personId}/photos/${photoId}/content?type=${type}`;
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

function PhotoCard({
  personId,
  photo,
  color,
  onDelete,
  onView,
}: {
  personId: string;
  photo: ApiPhoto;
  color: string;
  onDelete: (photo: ApiPhoto) => void;
  onView: (photo: ApiPhoto) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div
      className="group relative overflow-hidden rounded-2xl"
      style={{ background: "#161616", border: photo.is_primary ? `1.5px solid ${color}` : "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="relative flex aspect-square items-center justify-center" style={{ background: `${color}08` }}>
        {imageFailed ? (
          <Camera className="h-7 w-7" style={{ color: `${color}30` }} />
        ) : (
          <img
            src={photoContentUrl(personId, photo.id)}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        )}
        {photo.is_primary && (
          <div
            className="absolute left-2 top-2 rounded-lg px-2 py-0.5 text-xs font-medium"
            style={{ background: color, color: "#fff" }}
          >
            Primary
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/70 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onView(photo)}
            title="View"
            className="rounded-lg bg-white/5 p-1.5 text-white transition-colors hover:bg-white/15"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(photo)}
            title="Delete"
            className="rounded-lg bg-white/5 p-1.5 text-red-400 transition-colors hover:bg-white/15"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="px-3 py-2.5">
        <p className="truncate text-xs font-medium text-white">{fileName(photo.original_path)}</p>
        <p className="mt-0.5 text-xs" style={{ color: "#3a3a3a" }}>
          {formatDate(photo.created_at)}
        </p>
      </div>
    </div>
  );
}

function ViewModal({ personId, photo, onClose }: { personId: string; photo: ApiPhoto; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl" style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="truncate text-xs font-semibold text-white">{fileName(photo.original_path)}</span>
          <button onClick={onClose} className="text-neutral-600 transition-colors hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex max-h-[70vh] items-center justify-center bg-black">
          <img src={photoContentUrl(personId, photo.id, "original")} alt="" className="max-h-[70vh] w-full object-contain" />
        </div>
        <div className="grid gap-2 px-5 py-4 text-xs sm:grid-cols-3" style={{ color: "#5a5a5a" }}>
          <span>Face: {photo.face_detected ? "detected" : "not detected"}</span>
          <span>Size: {photo.width && photo.height ? `${photo.width}x${photo.height}` : "n/a"}</span>
          <span>Quality: {photo.quality_score == null ? "n/a" : photo.quality_score.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export function PersonProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<ApiPerson | null>(null);
  const [photos, setPhotos] = useState<ApiPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [viewPhoto, setViewPhoto] = useState<ApiPhoto | null>(null);

  const color = useMemo(() => colorFor(id ?? "unknown"), [id]);

  async function loadProfile(showToast = false) {
    if (!id) return;
    setLoading(true);
    try {
      const [nextPerson, nextPhotos] = await Promise.all([
        apiJson<ApiPerson>(`/api/v1/people/${id}`),
        apiJson<ApiPhoto[]>(`/api/v1/people/${id}/photos`),
      ]);
      setPerson(nextPerson);
      setPhotos(nextPhotos);
      setName(nextPerson.name);
      setDescription(nextPerson.description ?? "");
      if (showToast) toast.success("Profile loaded from backend database");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, [id]);

  async function saveProfile(nextAccess = person?.access_enabled) {
    if (!id || !person) return;
    const displayName = name.trim();
    if (!displayName) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const updated = await apiJson<ApiPerson>(`/api/v1/people/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: displayName,
          description: description.trim() || null,
          access_enabled: nextAccess,
        }),
      });
      setPerson(updated);
      setName(updated.name);
      setDescription(updated.description ?? "");
      setEditing(false);
      toast.success("Profile saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhotos(fileList: FileList | null) {
    if (!id || !fileList?.length) return;
    const form = new FormData();
    Array.from(fileList).forEach((file) => form.append("files", file));
    setSaving(true);
    try {
      await apiJson<ApiPhoto[]>(`/api/v1/people/${id}/photos`, { method: "POST", body: form });
      toast.success("Photo uploaded to backend database");
      await loadProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  async function deletePhoto(photo: ApiPhoto) {
    if (!id) return;
    const confirmed = window.confirm(`Delete ${fileName(photo.original_path)}?`);
    if (!confirmed) return;
    setSaving(true);
    try {
      await apiJson(`/api/v1/people/${id}/photos/${photo.id}`, { method: "DELETE" });
      toast.success("Photo deleted");
      await loadProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  async function deletePerson() {
    if (!id || !person) return;
    const confirmed = window.confirm(`Delete ${person.name}?`);
    if (!confirmed) return;
    setSaving(true);
    try {
      await apiJson(`/api/v1/people/${id}`, { method: "DELETE" });
      toast.success(`${person.name} deleted`);
      navigate("/people");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl py-16 text-sm text-white" style={CARD}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading backend profile
      </div>
    );
  }

  if (!person) {
    return (
      <div className="space-y-4">
        <Link to="/people" className="inline-flex items-center gap-1 text-xs text-neutral-500 transition-colors hover:text-white">
          <ArrowLeft className="h-3 w-3" /> People
        </Link>
        <div className="flex flex-col items-center justify-center rounded-2xl py-16" style={CARD}>
          <User className="mb-3 h-10 w-10" style={{ color: "#1a1a1a" }} />
          <p className="text-sm font-medium text-white">Person not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-xs" style={{ color: "#3a3a3a" }}>
        <Link to="/people" className="flex items-center gap-1 transition-colors hover:text-white">
          <ArrowLeft className="h-3 w-3" /> People
        </Link>
        <span>/</span>
        <span className="text-white">{person.name}</span>
      </div>

      <div className="rounded-2xl p-6" style={CARD}>
        <div className="flex flex-wrap items-start gap-5">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-semibold"
            style={{ background: `${color}15`, color, border: `1.5px solid ${color}25` }}
          >
            {initials(person.name)}
          </div>

          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="max-w-2xl space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoFocus
                  className="w-full rounded-xl px-3 py-2 text-base font-semibold text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={2}
                  placeholder="Optional note"
                  className="w-full resize-none rounded-xl px-3 py-2 text-sm text-white outline-none placeholder-neutral-700"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => void saveProfile()}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-black disabled:opacity-50"
                    style={{ background: "#ffffff" }}
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setName(person.name);
                      setDescription(person.description ?? "");
                      setEditing(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium"
                    style={{ background: "#1a1a1a", color: "#a0a0a0" }}
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-white">{person.name}</h2>
                  <button onClick={() => setEditing(true)} className="rounded-lg p-1.5 text-neutral-700 transition-colors hover:bg-white/5 hover:text-white">
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <StatusBadge active={person.access_enabled} />
                </div>
                <div className="flex flex-wrap gap-3 text-xs" style={{ color: "#3a3a3a" }}>
                  <span>{photos.length} photos</span>
                  <span>Added {formatDate(person.created_at)}</span>
                  <span>Updated {formatDate(person.updated_at)}</span>
                </div>
                {person.description && (
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: "#777" }}>
                    {person.description}
                  </p>
                )}
                <div className="mt-2 text-xs" style={{ color: "#3a3a3a" }}>
                  Backend ID: <span style={{ color }}>{person.id}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => void loadProfile(true)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
              style={{ background: "#1a1a1a", color: "#a0a0a0", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              onClick={() => void saveProfile(!person.access_enabled)}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
              style={{ background: "#1a1a1a", color: person.access_enabled ? "#f59e0b" : "#10b981", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {person.access_enabled ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              {person.access_enabled ? "Disable" : "Enable"}
            </button>
            <label
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-black"
              style={{ background: "#ffffff" }}
            >
              <Upload className="h-3.5 w-3.5" />
              Add Photo
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  const input = event.currentTarget;
                  void uploadPhotos(input.files).finally(() => {
                    input.value = "";
                  });
                }}
              />
            </label>
            <button
              onClick={() => void deletePerson()}
              disabled={saving}
              className="rounded-xl p-2 text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
              style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Photos ({photos.length})</div>
          {saving && <Loader2 className="h-4 w-4 animate-spin text-white" />}
        </div>

        {photos.length === 0 ? (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl py-16" style={CARD}>
            <Plus className="mb-2 h-8 w-8" style={{ color: "#2a2a2a" }} />
            <p className="text-sm font-medium text-white">Add training photos</p>
            <p className="mt-1 text-xs" style={{ color: "#3a3a3a" }}>
              Upload files to backend-service storage
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                const input = event.currentTarget;
                void uploadPhotos(input.files).finally(() => {
                  input.value = "";
                });
              }}
            />
          </label>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                personId={person.id}
                photo={photo}
                color={color}
                onDelete={(item) => void deletePhoto(item)}
                onView={setViewPhoto}
              />
            ))}
          </div>
        )}
      </div>

      {viewPhoto && <ViewModal personId={person.id} photo={viewPhoto} onClose={() => setViewPhoto(null)} />}
    </div>
  );
}
