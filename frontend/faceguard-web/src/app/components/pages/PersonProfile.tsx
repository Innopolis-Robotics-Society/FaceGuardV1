import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Star, Trash2, Edit, Upload, X, Check, Camera, Plus, Eye } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import {
  useDeletePhoto,
  useGetPerson,
  useGetPersonPhotos,
  useUpdatePerson,
  useUploadPhotos,
} from "../../../hooks/api/usePeople";
import { useGetDevices } from "../../../hooks/api/useDevices";
import { useCapturePhotos } from "../../../hooks/api/useCommands";
import { apiService } from "../../../services/api.service";
import { PersonPhoto } from "../../../types/api.types";

const CARD = { background: "#111111", border: "1px solid rgba(255,255,255,0.06)" };

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function getPersonColor(name: string) {
  const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#14b8a6"];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function photoName(photo: PersonPhoto) {
  return photo.original_path.split(/[\\/]/).pop() ?? `${photo.id}.jpg`;
}

function PhotoImage({ personId, photoId, type = "thumbnail", className }: { personId: string; photoId: string; type?: "thumbnail" | "original" | "processed"; className?: string }) {
  const [src, setSrc] = useState(apiService.getPhotoContentUrl(personId, photoId, type));
  return (
    <img
      src={src}
      alt="Person"
      className={className}
      onError={() => {
        if (type !== "original") {
          setSrc(apiService.getPhotoContentUrl(personId, photoId, "original"));
        }
      }}
    />
  );
}

function PhotoCard({
  personId, photo, color, onSetPrimary, onRename, onDelete, onView,
}: {
  personId: string;
  photo: PersonPhoto;
  color: string;
  onSetPrimary: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl overflow-hidden group relative"
      style={{ background: "#161616", border: photo.is_primary ? `1.5px solid ${color}` : "1px solid rgba(255,255,255,0.06)" }}>
      <div className="aspect-square flex items-center justify-center relative overflow-hidden"
        style={{ background: `${color}08` }}>
        <PhotoImage personId={personId} photoId={photo.id} type="thumbnail" className="w-full h-full object-cover" />
        {photo.is_primary && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium"
            style={{ background: color, color: "#fff" }}>
            <Star className="w-2.5 h-2.5 fill-current" /> Primary
          </div>
        )}
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
          {[
            { icon: Eye, title: "View", action: onView, textColor: "#ffffff" },
            { icon: Star, title: "Primary", action: onSetPrimary, textColor: "#f59e0b" },
            { icon: Edit, title: "Rename", action: onRename, textColor: "#3b82f6" },
            { icon: Trash2, title: "Delete", action: onDelete, textColor: "#ef4444" },
          ].map(({ icon: Icon, title, action, textColor }) => (
            <button key={title} onClick={() => action(photo.id)} title={title}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 transition-colors"
              style={{ color: textColor }}>
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-medium text-white truncate">{photoName(photo)}</p>
        <p className="text-xs mt-0.5" style={{ color: "#3a3a3a" }}>{format(parseISO(photo.created_at), "yyyy-MM-dd")}</p>
      </div>
    </div>
  );
}

function ViewModal({ personId, photo, color, onClose }: { personId: string; photo: PersonPhoto; color: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />
      <div className="relative rounded-2xl overflow-hidden w-full max-w-md"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-xs font-semibold text-white">{photoName(photo)}</span>
          <button onClick={onClose} className="text-neutral-600 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="aspect-square flex items-center justify-center overflow-hidden" style={{ background: `${color}08` }}>
          <PhotoImage personId={personId} photoId={photo.id} type="original" className="w-full h-full object-contain" />
        </div>
        <div className="px-5 py-4 flex items-center gap-3">
          {photo.is_primary && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium"
              style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
              <Star className="w-3 h-3 fill-current" /> Primary
            </span>
          )}
          <span className="text-xs" style={{ color: "#3a3a3a" }}>Added {format(parseISO(photo.created_at), "yyyy-MM-dd")}</span>
        </div>
      </div>
    </div>
  );
}

function RenameModal({ photo, onConfirm, onCancel }: { photo: PersonPhoto; onConfirm: (n: string) => void; onCancel: () => void }) {
  const ext = photoName(photo).split(".").pop() ?? "jpg";
  const base = photoName(photo).replace(/\.[^.]+$/, "");
  const [name, setName] = useState(base);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onCancel} />
      <div className="relative rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)" }}>
        <h3 className="text-sm font-semibold text-white mb-4">Rename Photo</h3>
        <div className="flex items-center gap-2 mb-5">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus
            className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }} />
          <span className="text-xs" style={{ color: "#3a3a3a" }}>.{ext}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "#1a1a1a", color: "#a0a0a0" }}>Cancel</button>
          <button onClick={() => onConfirm(`${name}.${ext}`)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-black"
            style={{ background: "#ffffff" }}>Rename</button>
        </div>
      </div>
    </div>
  );
}

export function PersonProfile() {
  const { id } = useParams<{ id: string }>();
  const personId = id ?? "";

  const { data: person, isLoading: personLoading, isError: personError } = useGetPerson(personId);
  const { data: photos = [], isLoading: photosLoading } = useGetPersonPhotos(personId);
  const { data: devices = [] } = useGetDevices();
  const updatePerson = useUpdatePerson();
  const uploadPhotos = useUploadPhotos();
  const deletePhoto = useDeletePhoto();
  const capturePhotos = useCapturePhotos();

  const activeDevice = useMemo(() => devices.find((d) => d.status === "online") ?? devices[0], [devices]);
  const color = getPersonColor(person?.name ?? "Unknown");
  const initials = getInitials(person?.name ?? "?");

  const [viewPhoto, setViewPhoto] = useState<PersonPhoto | null>(null);
  const [renamePhoto, setRenamePhoto] = useState<PersonPhoto | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showCaptureOptions, setShowCaptureOptions] = useState(false);

  useEffect(() => {
    if (person) {
      setName(person.name);
      setDescription(person.description ?? "");
    }
  }, [person]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('.capture-dropdown')) {
        setShowCaptureOptions(false);
      }
    }
    if (showCaptureOptions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCaptureOptions]);

  function savePerson() {
    if (!person || !name.trim()) return;
    updatePerson.mutate(
      {
        personId: person.id,
        data: {
          name: name.trim(),
          description: description.trim() || null,
        },
      },
      {
        onSuccess: () => setEditing(false),
      }
    );
  }

  function handleFiles(files: FileList | null) {
    if (!personId || !files?.length) return;
    uploadPhotos.mutate({
      personId,
      files: Array.from(files),
    });
  }

  function captureMorePhotos(count: number) {
    if (!personId) return;
    if (!activeDevice) {
      toast.error("No device available for capture");
      return;
    }
    capturePhotos.mutate({ deviceId: activeDevice.id, personId, count });
    setShowCaptureOptions(false);
  }

  function setPrimary() {
    toast.info("Primary photo update is not available in the current API");
  }

  function renamePhotoLocally() {
    toast.info("Photo rename is not available in the current API");
    setRenamePhoto(null);
  }

  if (personLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (personError || !person) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-xs" style={{ color: "#3a3a3a" }}>
          <Link to="/people" className="hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> People
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={CARD}>
          <Camera className="w-10 h-10 mb-3" style={{ color: "#1a1a1a" }} />
          <p className="text-sm font-medium text-white mb-1">Person not found</p>
          <p className="text-xs" style={{ color: "#3a3a3a" }}>Check API connection and try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs" style={{ color: "#3a3a3a" }}>
        <Link to="/people" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> People
        </Link>
        <span>/</span>
        <span className="text-white">{person.name}</span>
      </div>

      {/* Profile header */}
      <div className="rounded-2xl p-6" style={CARD}>
        <div className="flex flex-wrap items-start gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-semibold"
            style={{ background: `${color}15`, color, border: `1.5px solid ${color}25` }}>
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2 mb-2">
                <div className="flex items-center gap-2">
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus
                    className="px-3 py-1.5 rounded-xl text-base font-semibold text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
                  <button onClick={savePerson}
                    className="p-1.5 rounded-xl" style={{ background: "#ffffff", color: "#080808" }}
                    disabled={updatePerson.isPending}>
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditing(false)} className="p-1.5 rounded-xl" style={{ background: "#1a1a1a", color: "#a0a0a0" }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full max-w-md px-3 py-1.5 rounded-xl text-xs text-white outline-none"
                  placeholder="Optional note"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold text-white">{person.name}</h2>
                <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-neutral-700 hover:text-white hover:bg-white/5 transition-colors">
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-3 items-center text-xs" style={{ color: "#3a3a3a" }}>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium"
                style={person.access_enabled
                  ? { background: "rgba(16,185,129,0.1)", color: "#10b981" }
                  : { background: "rgba(90,90,90,0.15)", color: "#5a5a5a" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {person.access_enabled ? "Active" : "Inactive"}
              </span>
              <span>{photos.length} photos</span>
              <span>Added {format(parseISO(person.created_at), "yyyy-MM-dd")}</span>
              {person.description && <span>· {person.description}</span>}
            </div>

            <div className="mt-1.5 text-xs" style={{ color: "#3a3a3a" }}>
              Folder: <span style={{ color: "#10b981" }}>faces/{person.id}/</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
              style={{ background: "#1a1a1a", color: "#a0a0a0", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Upload className="w-3.5 h-3.5" /> {uploadPhotos.isPending ? "Uploading..." : "Add Photo"}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            </label>
            <div className="relative capture-dropdown">
              <button onClick={() => setShowCaptureOptions(!showCaptureOptions)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-black"
                style={{ background: "#ffffff" }}
                disabled={capturePhotos.isPending}>
                <Camera className="w-3.5 h-3.5" /> {capturePhotos.isPending ? "Capturing..." : "Capture"}
              </button>
              {showCaptureOptions && !capturePhotos.isPending && (
                <div className="absolute right-0 top-full mt-2 rounded-xl py-1 shadow-2xl z-10 min-w-[140px]"
                  style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {[5, 10, 15].map((count) => (
                    <button key={count}
                      onClick={() => captureMorePhotos(count)}
                      className="w-full px-4 py-2 text-xs font-medium text-left hover:bg-white/5 transition-colors"
                      style={{ color: "#a0a0a0" }}>
                      Capture {count} photos
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-white">Photos ({photos.length})</div>
          <p className="text-xs" style={{ color: "#3a3a3a" }}>Hover for actions</p>
        </div>

        {photosLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl" style={CARD}>
            <Camera className="w-10 h-10 mb-3" style={{ color: "#1a1a1a" }} />
            <p className="text-sm font-medium text-white mb-1">No photos yet</p>
            <p className="text-xs" style={{ color: "#3a3a3a" }}>Upload or capture photos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {photos.map((ph) => (
              <PhotoCard key={ph.id} personId={person.id} photo={ph} color={color}
                onSetPrimary={setPrimary}
                onRename={(photoId) => setRenamePhoto(photos.find((p) => p.id === photoId) ?? null)}
                onDelete={(photoId) => deletePhoto.mutate({ personId: person.id, photoId })}
                onView={(photoId) => setViewPhoto(photos.find((p) => p.id === photoId) ?? null)} />
            ))}
            <label className="rounded-2xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-white/3 transition-colors"
              style={{ background: "rgba(255,255,255,0.02)", border: "1.5px dashed rgba(255,255,255,0.07)" }}>
              <Plus className="w-6 h-6 mb-1" style={{ color: "#2a2a2a" }} />
              <span className="text-xs" style={{ color: "#2a2a2a" }}>Add</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            </label>
          </div>
        )}
      </div>

      {viewPhoto && <ViewModal personId={person.id} photo={viewPhoto} color={color} onClose={() => setViewPhoto(null)} />}
      {renamePhoto && <RenameModal photo={renamePhoto} onConfirm={renamePhotoLocally} onCancel={() => setRenamePhoto(null)} />}
    </div>
  );
}
