import { useEffect, useState } from "react";
import { Brain, Camera, Check, DoorOpen, Loader2, RotateCcw, Save, Shield } from "lucide-react";
import { toast } from "sonner";
import { type AgentSettings, agentJson } from "../../lib/faceguardApi";

const CARD = { background: "#111111", border: "1px solid rgba(255,255,255,0.06)" };

const RECOMMENDED = {
  recognition_threshold: 50,
  recognition_consensus_frames: 4,
  recognition_consensus_window: 7,
  unknown_consensus_frames: 5,
  recognition_process_interval_seconds: 0.25,
  action_cooldown_seconds: 5,
  door_open_duration: 5,
  min_blur_score: 25,
  min_brightness: 45,
  max_brightness: 215,
};

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl" style={CARD}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Icon className="h-4 w-4" style={{ color: "#5a5a5a" }} />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-white">{label}</div>
        {description && <div className="mt-0.5 text-xs" style={{ color: "#3a3a3a" }}>{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Slider({ value, onChange, min, max, step = 1, unit = "" }: { value: number; onChange: (value: number) => void; min: number; max: number; step?: number; unit?: string }) {
  return (
    <div className="flex w-48 items-center gap-3">
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="h-0.5 flex-1 accent-white" />
      <span className="w-16 text-right text-sm font-semibold tabular-nums text-white">{value}{unit}</span>
    </div>
  );
}

function Value({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-xl px-3 py-2 text-xs font-medium text-white" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)" }}>
      {children}
    </span>
  );
}

export function Settings() {
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await agentJson<AgentSettings>("/settings");
      setSettings(data);
      setSaved(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function set<K extends keyof AgentSettings>(key: K, value: AgentSettings[K]) {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
    setSaved(false);
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await agentJson<AgentSettings>("/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recognition_threshold: settings.recognition_threshold,
          recognition_consensus_frames: settings.recognition_consensus_frames,
          recognition_consensus_window: settings.recognition_consensus_window,
          unknown_consensus_frames: settings.unknown_consensus_frames,
          recognition_process_interval_seconds: settings.recognition_process_interval_seconds,
          action_cooldown_seconds: settings.action_cooldown_seconds,
          door_open_duration: settings.door_open_duration,
          min_blur_score: settings.min_blur_score,
          min_brightness: settings.min_brightness,
          max_brightness: settings.max_brightness,
        }),
      });
      setSettings(updated);
      setSaved(true);
      toast.success("Agent settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  async function resetRecommended() {
    if (!settings) return;
    setSettings({ ...settings, ...RECOMMENDED });
    setSaved(false);
    toast.info("Recommended MVP values loaded");
  }

  if (loading || !settings) {
    return (
      <div className="flex max-w-2xl items-center justify-center gap-2 rounded-2xl py-16 text-sm text-white" style={CARD}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading agent settings
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Section icon={Brain} title="Recognition">
        <Row label="Recognition Threshold" description="Lower values are stricter. 45-55 is safer for LBPH.">
          <Slider value={settings.recognition_threshold} onChange={(value) => set("recognition_threshold", value)} min={35} max={75} unit="" />
        </Row>
        <Row label="Consensus Frames" description="Frames that must agree before granting access.">
          <Slider value={settings.recognition_consensus_frames} onChange={(value) => set("recognition_consensus_frames", value)} min={1} max={8} unit="" />
        </Row>
        <Row label="Consensus Window" description="Rolling frame window used for voting.">
          <Slider value={settings.recognition_consensus_window} onChange={(value) => set("recognition_consensus_window", value)} min={3} max={12} unit="" />
        </Row>
        <Row label="Unknown Consensus" description="Frames required before logging unknown person.">
          <Slider value={settings.unknown_consensus_frames} onChange={(value) => set("unknown_consensus_frames", value)} min={1} max={10} unit="" />
        </Row>
        <Row label="Processing Interval" description="Delay between recognition checks.">
          <Slider value={settings.recognition_process_interval_seconds} onChange={(value) => set("recognition_process_interval_seconds", value)} min={0.1} max={1} step={0.05} unit="s" />
        </Row>
      </Section>

      <Section icon={Shield} title="Capture Quality Gates">
        <Row label="Minimum Blur Score" description="Higher value rejects more blurry registration photos.">
          <Slider value={settings.min_blur_score} onChange={(value) => set("min_blur_score", value)} min={0} max={80} unit="" />
        </Row>
        <Row label="Minimum Brightness" description="Rejects photos that are too dark.">
          <Slider value={settings.min_brightness} onChange={(value) => set("min_brightness", value)} min={0} max={120} unit="" />
        </Row>
        <Row label="Maximum Brightness" description="Rejects overexposed photos.">
          <Slider value={settings.max_brightness} onChange={(value) => set("max_brightness", value)} min={140} max={255} unit="" />
        </Row>
      </Section>

      <Section icon={DoorOpen} title="Door">
        <Row label="Door Opening Duration" description="How long the mock/servo door stays open.">
          <Slider value={settings.door_open_duration} onChange={(value) => set("door_open_duration", value)} min={1} max={20} unit="s" />
        </Row>
        <Row label="Action Cooldown" description="Prevents repeated opens from the same person.">
          <Slider value={settings.action_cooldown_seconds} onChange={(value) => set("action_cooldown_seconds", value)} min={1} max={30} unit="s" />
        </Row>
      </Section>

      <Section icon={Camera} title="Camera Runtime">
        <Row label="Camera Index"><Value>{settings.camera_index}</Value></Row>
        <Row label="Resolution"><Value>{settings.camera_width}x{settings.camera_height}</Value></Row>
        <Row label="Target FPS"><Value>{settings.camera_fps} fps</Value></Row>
        <Row label="Hardware Mode"><Value>{settings.hardware_mode}</Value></Row>
        <Row label="Backend URL"><Value>{settings.backend_url}</Value></Row>
      </Section>

      <div className="flex items-center gap-2.5 pb-2">
        <button onClick={() => void save()} disabled={saving} className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium text-black transition-all disabled:opacity-50" style={{ background: "#ffffff" }}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Saved" : "Save Changes"}
        </button>
        <button onClick={() => void resetRecommended()} className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium transition-colors" style={{ background: "#1a1a1a", color: "#a0a0a0", border: "1px solid rgba(255,255,255,0.06)" }}>
          <RotateCcw className="h-4 w-4" /> Recommended
        </button>
      </div>
    </div>
  );
}
