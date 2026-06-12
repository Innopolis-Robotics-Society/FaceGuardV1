import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Star, Trash2, Edit, Upload, X, Check, Camera, Plus, Eye } from "lucide-react";
import { toast } from "sonner";

const CARD = { background: "#111111", border: "1px solid rgba(255,255,255,0.06)" };

const PEOPLE: Record<string, { name: string; initials: string; color: string; note: string; status: string; added: string }> = {
  "1": { name: "John Doe",    initials: "JD", color: "#10b981", note: "Main resident",  status: "active", added: "2026-05-10" },
  "2": { name: "Mary Smith",  initials: "MS", color: "#3b82f6", note: "Family member",  status: "active", added: "2026-05-18" },
  "3": { name: "Bob Johnson", initials: "BJ", color: "#8b5cf6", note: "Colleague",      status: "active", added: "2026-05-22" },
};

const MOCK_PHOTOS = [
  { id: 1, name: "photo_001.jpg", isPrimary: true,  date: "2026-05-10" },
  { id: 2, name: "photo_002.jpg", isPrimary: false, date: "2026-05-11" },
  { id: 3, name: "photo_003.jpg", isPrimary: false, date: "2026-05-15" },
  { id: 4, name: "photo_004.jpg", isPrimary: false, date: "2026-05-20" },
  { id: 5, name: "photo_005.jpg", isPrimary: false, date: "2026-05-25" },
];

function PhotoCard({
  photo, color, onSetPrimary, onRename, onDelete, onView,
}: {
  photo: typeof MOCK_PHOTOS[0]; color: string;
  onSetPrimary: (id: number) => void;
  onRename:     (id: number) => void;
  onDelete:     (id: number) => void;
  onView:       (id: number) => void;
}) {
  return (
    <div className="rounded-2xl overflow-hidden group relative"
      style={{ background: "#161616", border: photo.isPrimary ? `1.5px solid ${color}` : "1px solid rgba(255,255,255,0.06)" }}>
      {/* Thumb placeholder */}
      <div className="aspect-square flex items-center justify-center relative"
        style={{ background: `${color}08` }}>
        <Camera className="w-7 h-7" style={{ color: `${color}30` }} />
        {photo.isPrimary && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium"
            style={{ background: color, color: "#fff" }}>
            <Star className="w-2.5 h-2.5 fill-current" /> Primary
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
          {[
            { icon: Eye,     title: "View",    action: onView,       textColor: "#ffffff" },
            { icon: Star,    title: "Primary", action: onSetPrimary, textColor: "#f59e0b" },
            { icon: Edit,    title: "Rename",  action: onRename,     textColor: "#3b82f6" },
            { icon: Trash2,  title: "Delete",  action: onDelete,     textColor: "#ef4444" },
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
        <p className="text-xs font-medium text-white truncate">{photo.name}</p>
        <p className="text-xs mt-0.5" style={{ color: "#3a3a3a" }}>{photo.date}</p>
      </div>
    </div>
  );
}

function ViewModal({ photo, color, onClose }: { photo: typeof MOCK_PHOTOS[0]; color: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />
      <div className="relative rounded-2xl overflow-hidden w-full max-w-md"
        style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-xs font-semibold text-white">{photo.name}</span>
          <button onClick={onClose} className="text-neutral-600 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="aspect-square flex items-center justify-center" style={{ background: `${color}08` }}>
          <Camera className="w-20 h-20" style={{ color: `${color}20` }} />
        </div>
        <div className="px-5 py-4 flex items-center gap-3">
          {photo.isPrimary && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium"
              style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
              <Star className="w-3 h-3 fill-current" /> Primary
            </span>
          )}
          <span className="text-xs" style={{ color: "#3a3a3a" }}>Added {photo.date}</span>
        </div>
      </div>
    </div>
  );
}

function RenameModal({ photo, onConfirm, onCancel }: { photo: typeof MOCK_PHOTOS[0]; onConfirm: (n: string) => void; onCancel: () => void }) {
  const ext  = photo.name.split(".").pop() ?? "jpg";
  const base = photo.name.replace(/\.[^.]+$/, "");
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
  const person  = PEOPLE[id ?? ""] ?? { name: "Unknown", initials: "?", color: "#5a5a5a", note: "", status: "inactive", added: "—" };

  const [photos,      setPhotos]      = useState(MOCK_PHOTOS);
  const [viewPhoto,   setViewPhoto]   = useState<typeof MOCK_PHOTOS[0] | null>(null);
  const [renamePhoto, setRenamePhoto] = useState<typeof MOCK_PHOTOS[0] | null>(null);
  const [editing,     setEditing]     = useState(false);
  const [name,        setName]        = useState(person.name);

  const setP = (photoId: number) => { setPhotos((p) => p.map((x) => ({ ...x, isPrimary: x.id === photoId }))); toast.success("Primary photo updated"); };
  const delP = (photoId: number) => { setPhotos((p) => p.filter((x) => x.id !== photoId)); toast.success("Photo deleted"); };
  const renP = (photoId: number, newName: string) => { setPhotos((p) => p.map((x) => x.id === photoId ? { ...x, name: newName } : x)); toast.success("Photo renamed"); setRenamePhoto(null); };

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
            style={{ background: `${person.color}15`, color: person.color, border: `1.5px solid ${person.color}25` }}>
            {person.initials}
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2 mb-2">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus
                  className="px-3 py-1.5 rounded-xl text-base font-semibold text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
                <button onClick={() => { toast.success("Name saved"); setEditing(false); }}
                  className="p-1.5 rounded-xl" style={{ background: "#ffffff", color: "#080808" }}>
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setEditing(false)} className="p-1.5 rounded-xl" style={{ background: "#1a1a1a", color: "#a0a0a0" }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold text-white">{name}</h2>
                <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-neutral-700 hover:text-white hover:bg-white/5 transition-colors">
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-3 items-center text-xs" style={{ color: "#3a3a3a" }}>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium"
                style={person.status === "active"
                  ? { background: "rgba(16,185,129,0.1)", color: "#10b981" }
                  : { background: "rgba(90,90,90,0.15)", color: "#5a5a5a" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {person.status === "active" ? "Active" : "Inactive"}
              </span>
              <span>{photos.length} photos</span>
              <span>Added {person.added}</span>
              {person.note && <span>· {person.note}</span>}
            </div>

            <div className="mt-1.5 text-xs" style={{ color: "#3a3a3a" }}>
              Folder: <span style={{ color: "#10b981" }}>faces/{person.name.replace(/\s+/g, "_")}/</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
              style={{ background: "#1a1a1a", color: "#a0a0a0", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Upload className="w-3.5 h-3.5" /> Add Photo
              <input type="file" accept="image/*" className="hidden" onChange={() => {
                const np = { id: Date.now(), name: `photo_00${photos.length + 1}.jpg`, isPrimary: false, date: "2026-06-11" };
                setPhotos((p) => [...p, np]); toast.success("Photo added");
              }} />
            </label>
            <button onClick={() => toast.info("Opening camera…")}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-black"
              style={{ background: "#ffffff" }}>
              <Camera className="w-3.5 h-3.5" /> Capture
            </button>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-white">Photos ({photos.length})</div>
          <p className="text-xs" style={{ color: "#3a3a3a" }}>Hover for actions</p>
        </div>

        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl" style={CARD}>
            <Camera className="w-10 h-10 mb-3" style={{ color: "#1a1a1a" }} />
            <p className="text-sm font-medium text-white mb-1">No photos yet</p>
            <p className="text-xs" style={{ color: "#3a3a3a" }}>Upload or capture photos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {photos.map((ph) => (
              <PhotoCard key={ph.id} photo={ph} color={person.color}
                onSetPrimary={setP} onRename={(id) => setRenamePhoto(photos.find((p) => p.id === id) ?? null)}
                onDelete={delP} onView={(id) => setViewPhoto(photos.find((p) => p.id === id) ?? null)} />
            ))}
            <label className="rounded-2xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-white/3 transition-colors"
              style={{ background: "rgba(255,255,255,0.02)", border: "1.5px dashed rgba(255,255,255,0.07)" }}>
              <Plus className="w-6 h-6 mb-1" style={{ color: "#2a2a2a" }} />
              <span className="text-xs" style={{ color: "#2a2a2a" }}>Add</span>
              <input type="file" accept="image/*" className="hidden" onChange={() => {
                const np = { id: Date.now(), name: `photo_00${photos.length + 1}.jpg`, isPrimary: false, date: "2026-06-11" };
                setPhotos((p) => [...p, np]); toast.success("Photo added");
              }} />
            </label>
          </div>
        )}
      </div>

      {viewPhoto   && <ViewModal   photo={viewPhoto}   color={person.color} onClose={() => setViewPhoto(null)} />}
      {renamePhoto && <RenameModal photo={renamePhoto} onConfirm={(n) => renP(renamePhoto.id, n)} onCancel={() => setRenamePhoto(null)} />}
    </div>
  );
}
