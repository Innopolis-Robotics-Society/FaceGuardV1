import { useState } from "react";
import { Brain, Camera, DoorOpen, Shield, Monitor, Save, RotateCcw, Eye, EyeOff, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";

const CARD = { background: "#111111", border: "1px solid rgba(255,255,255,0.06)" };

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={CARD}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Icon className="w-4 h-4" style={{ color: "#5a5a5a" }} />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="px-5 py-4 space-y-0">{children}</div>
    </div>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white">{label}</div>
        {description && <div className="text-xs mt-0.5" style={{ color: "#3a3a3a" }}>{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className="relative w-10 h-5.5 rounded-full transition-colors"
      style={{ background: checked ? "#ffffff" : "#1f1f1f", border: "1px solid rgba(255,255,255,0.1)", height: "22px", width: "40px" }}>
      <div className="absolute top-0.5 w-4 h-4 rounded-full transition-transform shadow"
        style={{ background: checked ? "#080808" : "#3a3a3a", transform: checked ? "translateX(18px)" : "translateX(2px)" }} />
    </button>
  );
}

function Slider({ value, onChange, min, max, step = 1, unit = "" }: {
  value: number; onChange: (v: number) => void; min: number; max: number; step?: number; unit?: string;
}) {
  return (
    <div className="flex items-center gap-3 w-44">
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-0.5 accent-white" />
      <span className="text-sm font-semibold text-white w-16 text-right tabular-nums">{value}{unit}</span>
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-2 rounded-xl text-xs text-white outline-none"
        style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)", colorScheme: "dark" }}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: "#3a3a3a" }} />
    </div>
  );
}

function PwInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative w-44">
      <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        className="w-full pl-3 pr-8 py-2 rounded-xl text-xs text-white placeholder-neutral-700 outline-none"
        style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)" }} />
      <button onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-700 hover:text-white transition-colors">
        {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

const DEFAULTS = {
  distanceThreshold: 70, unknownThreshold: 40, recognitionInterval: 500,
  cameraFPS: 30, cameraResolution: "1280×720", brightness: 50, contrast: 50,
  doorDuration: 5, doorAutoClose: true, doorBell: true,
  adminPassword: "", sessionTimeout: 30, twoFactor: false,
  darkMode: true, language: "English", notifications: true, notifUnknown: true, notifDenied: true, soundAlerts: false,
};

export function Settings() {
  const [s, setS] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof DEFAULTS>(key: K, value: typeof DEFAULTS[K]) {
    setS((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <Section icon={Brain} title="Recognition Settings">
        <Row label="Recognition Distance Threshold" description="Lower is stricter; LBPH distances below the threshold are accepted">
          <Slider value={s.distanceThreshold} onChange={(v) => set("distanceThreshold", v)} min={30} max={120} />
        </Row>
        <Row label="Unknown Person Threshold" description="Below this is flagged as unknown">
          <Slider value={s.unknownThreshold} onChange={(v) => set("unknownThreshold", v)} min={10} max={60} unit="%" />
        </Row>
        <Row label="Recognition Interval" description="How often frames are processed">
          <Slider value={s.recognitionInterval} onChange={(v) => set("recognitionInterval", v)} min={100} max={2000} step={100} unit="ms" />
        </Row>
      </Section>

      <Section icon={Camera} title="Camera Settings">
        <Row label="Target FPS"><Slider value={s.cameraFPS} onChange={(v) => set("cameraFPS", v)} min={5} max={60} unit=" fps" /></Row>
        <Row label="Resolution"><Select value={s.cameraResolution} onChange={(v) => set("cameraResolution", v)} options={["640×480", "1280×720", "1920×1080"]} /></Row>
        <Row label="Brightness"><Slider value={s.brightness} onChange={(v) => set("brightness", v)} min={0} max={100} unit="%" /></Row>
        <Row label="Contrast">  <Slider value={s.contrast}    onChange={(v) => set("contrast", v)}    min={0} max={100} unit="%" /></Row>
      </Section>

      <Section icon={DoorOpen} title="Door Settings">
        <Row label="Door Opening Duration" description="How long the door stays unlocked">
          <Slider value={s.doorDuration} onChange={(v) => set("doorDuration", v)} min={1} max={30} unit="s" />
        </Row>
        <Row label="Auto-close Door"   description="Automatically lock after duration"><Toggle checked={s.doorAutoClose} onChange={(v) => set("doorAutoClose", v)} /></Row>
        <Row label="Doorbell Sound"    description="Play sound when someone arrives">  <Toggle checked={s.doorBell}      onChange={(v) => set("doorBell", v)} /></Row>
      </Section>

      <Section icon={Shield} title="Security Settings">
        <Row label="Admin Password"         description="Change administrator password"><PwInput value={s.adminPassword} onChange={(v) => set("adminPassword", v)} /></Row>
        <Row label="Session Timeout"        description="Auto-logout after inactivity">
          <Slider value={s.sessionTimeout} onChange={(v) => set("sessionTimeout", v)} min={5} max={120} step={5} unit=" min" />
        </Row>
        <Row label="Two-Factor Auth"        description="Require code on login"><Toggle checked={s.twoFactor} onChange={(v) => set("twoFactor", v)} /></Row>
      </Section>

      <Section icon={Monitor} title="Interface Settings">
        <Row label="Dark Mode"              description="Always-on dark theme">          <Toggle checked={s.darkMode}        onChange={(v) => set("darkMode", v)} /></Row>
        <Row label="Language">              <Select value={s.language} onChange={(v) => set("language", v)} options={["English", "Русский", "Deutsch", "Français", "中文"]} /></Row>
        <Row label="Push Notifications"     description="Browser notifications">         <Toggle checked={s.notifications}   onChange={(v) => set("notifications", v)} /></Row>
        <Row label="Alert: Unknown Person"  description="Notify on unrecognized visitor"><Toggle checked={s.notifUnknown}    onChange={(v) => set("notifUnknown", v)} /></Row>
        <Row label="Alert: Access Denied"   description="Notify on denied attempts">     <Toggle checked={s.notifDenied}     onChange={(v) => set("notifDenied", v)} /></Row>
        <Row label="Sound Alerts"           description="Play sound on critical events"> <Toggle checked={s.soundAlerts}     onChange={(v) => set("soundAlerts", v)} /></Row>
      </Section>

      {/* Actions */}
      <div className="flex items-center gap-2.5 pb-2">
        <button onClick={() => { toast.success("Settings saved"); setSaved(true); }}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-black transition-all"
          style={{ background: "#ffffff" }}>
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save Changes"}
        </button>
        <button onClick={() => { setS(DEFAULTS); toast.info("Reset to defaults"); setSaved(false); }}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{ background: "#1a1a1a", color: "#a0a0a0", border: "1px solid rgba(255,255,255,0.06)" }}>
          <RotateCcw className="w-4 h-4" /> Reset to Default
        </button>
      </div>
    </div>
  );
}
