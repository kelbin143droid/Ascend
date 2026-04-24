import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Bell, Volume2, Smartphone, Headphones, Mic } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { SystemLayout } from "@/components/game/SystemLayout";
import {
  getNotificationPrefs,
  setNotificationPrefs,
  NotificationMode,
  shouldUsePhoneNotifications,
  shouldUseVoiceAlerts,
} from "@/lib/notificationModeStore";
import { speak, getAvailableVoices, speechSupported } from "@/lib/voiceAlerts";

export default function NotificationSettingsPage() {
  const [, navigate] = useLocation();
  const { backgroundTheme } = useTheme();
  const colors = backgroundTheme.colors;
  const [prefs, setPrefs] = useState(() => getNotificationPrefs());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!speechSupported()) return;
    const load = () => setVoices(getAvailableVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null as any;
    };
  }, []);

  const update = (patch: Partial<typeof prefs>) => {
    const next = setNotificationPrefs(patch);
    setPrefs(next);
  };

  const ModeButton = ({ value, label, icon: Icon, hint }: { value: NotificationMode; label: string; icon: any; hint: string }) => {
    const active = prefs.mode === value;
    return (
      <button
        onClick={() => {
          // If switching to a mode that uses voice, auto-enable voice so the
          // user isn't silently left with zero alerts.
          const patch: any = { mode: value };
          if ((value === "voice" || value === "both") && !prefs.voiceEnabled) {
            patch.voiceEnabled = true;
          }
          update(patch);
        }}
        className="w-full text-left p-3 rounded-xl flex items-start gap-3 transition-all active:scale-[0.99]"
        style={{
          backgroundColor: active ? `${colors.primary}18` : `${colors.surface}cc`,
          border: `1px solid ${active ? colors.primary : colors.surfaceBorder}`,
        }}
        data-testid={`button-mode-${value}`}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
        >
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium" style={{ color: colors.text }}>{label}</div>
          <div className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>{hint}</div>
        </div>
        {active && (
          <div
            className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px]"
            style={{ backgroundColor: colors.primary, color: colors.background }}
          >
            ✓
          </div>
        )}
      </button>
    );
  };

  return (
    <SystemLayout>
      <div className="min-h-screen p-4 pb-28 max-w-md mx-auto" data-testid="notification-settings-page">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate("/profile")}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.surfaceBorder}`,
              color: colors.text,
            }}
            data-testid="button-back"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Bell size={16} style={{ color: colors.primary }} />
              <h1 className="text-base font-display tracking-wider" style={{ color: colors.text }}>
                NOTIFICATION SETTINGS
              </h1>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
              Choose how you want the system to alert you for the next task on your schedule.
            </p>
          </div>
        </div>

        {/* Mode picker */}
        <div className="space-y-2 mb-5">
          <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: colors.textMuted }}>
            Alert mode
          </div>
          <ModeButton
            value="phone"
            label="Phone notifications"
            icon={Smartphone}
            hint="Default. Standard system notifications, even when the app is closed."
          />
          <ModeButton
            value="voice"
            label="Voice alerts"
            icon={Headphones}
            hint="Spoken announcements while the app is open. No phone notification."
          />
          <ModeButton
            value="both"
            label="Both"
            icon={Volume2}
            hint="Phone notification + voice announcement when the app is open."
          />
        </div>

        {/* Voice settings */}
        <div
          className="rounded-xl p-4 space-y-4 mb-5"
          style={{ backgroundColor: `${colors.surface}cc`, border: `1px solid ${colors.surfaceBorder}` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic size={14} style={{ color: colors.primary }} />
              <span className="text-sm font-medium" style={{ color: colors.text }}>Enable voice</span>
            </div>
            <button
              onClick={() => update({ voiceEnabled: !prefs.voiceEnabled })}
              className="relative w-11 h-6 rounded-full transition-colors"
              style={{ backgroundColor: prefs.voiceEnabled ? colors.primary : "rgba(255,255,255,0.15)" }}
              data-testid="toggle-voice-enabled"
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                style={{ transform: prefs.voiceEnabled ? "translateX(22px)" : "translateX(2px)" }}
              />
            </button>
          </div>
          {!speechSupported() && (
            <p className="text-[11px]" style={{ color: "#ff8080" }}>
              Voice alerts aren’t supported on this device.
            </p>
          )}

          <div>
            <label className="text-[11px]" style={{ color: colors.textMuted }}>
              Lead time: announce {prefs.voiceLeadMinutes} min before
            </label>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={prefs.voiceLeadMinutes}
              onChange={(e) => update({ voiceLeadMinutes: Number(e.target.value) })}
              className="w-full"
              data-testid="slider-lead-time"
            />
          </div>

          <div>
            <label className="text-[11px]" style={{ color: colors.textMuted }}>
              Speaking speed: {prefs.voiceRate.toFixed(2)}x
            </label>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.05}
              value={prefs.voiceRate}
              onChange={(e) => update({ voiceRate: Number(e.target.value) })}
              className="w-full"
              data-testid="slider-voice-rate"
            />
          </div>

          {voices.length > 0 && (
            <div>
              <label className="text-[11px]" style={{ color: colors.textMuted }}>Voice</label>
              <select
                value={prefs.voiceName ?? ""}
                onChange={(e) => update({ voiceName: e.target.value || undefined })}
                className="w-full mt-1 px-2 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  border: `1px solid ${colors.surfaceBorder}`,
                }}
                data-testid="select-voice"
              >
                <option value="">System default</option>
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => speak("This is a sample voice alert. Your next task will be announced like this.")}
            disabled={!speechSupported()}
            className="w-full py-2 rounded-lg text-xs"
            style={{
              backgroundColor: `${colors.primary}20`,
              color: colors.primary,
              border: `1px solid ${colors.primary}40`,
              opacity: speechSupported() ? 1 : 0.4,
            }}
            data-testid="button-test-voice"
          >
            Test voice alert
          </button>
        </div>

        {/* Status summary */}
        <div
          className="rounded-xl p-3 text-[11px]"
          style={{ backgroundColor: `${colors.surface}66`, border: `1px solid ${colors.surfaceBorder}`, color: colors.textMuted }}
        >
          <div>
            Phone notifications:{" "}
            <span style={{ color: shouldUsePhoneNotifications() ? colors.primary : colors.textMuted }}>
              {shouldUsePhoneNotifications() ? "ON" : "OFF"}
            </span>
          </div>
          <div>
            Voice alerts:{" "}
            <span style={{ color: shouldUseVoiceAlerts() ? colors.primary : colors.textMuted }}>
              {shouldUseVoiceAlerts() ? "ON" : "OFF"}
            </span>
          </div>
        </div>
      </div>
    </SystemLayout>
  );
}
