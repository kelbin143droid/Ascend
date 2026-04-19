import { useEffect, useState } from "react";
import { X, Bell } from "lucide-react";

interface NotificationBannerProps {
  notification: {
    type: "momentum" | "recovery" | "milestone";
    message: string;
  } | null;
  onDismiss: () => void;
}

const TYPE_STYLES: Record<string, { accent: string; bg: string; border: string }> = {
  momentum: { accent: "rgba(147,197,253,0.8)", bg: "rgba(147,197,253,0.06)", border: "rgba(147,197,253,0.12)" },
  recovery: { accent: "rgba(167,139,250,0.8)", bg: "rgba(167,139,250,0.06)", border: "rgba(167,139,250,0.12)" },
  milestone: { accent: "rgba(251,191,36,0.8)", bg: "rgba(251,191,36,0.06)", border: "rgba(251,191,36,0.12)" },
};

const VISIBLE_MS = 5000;
const FADE_MS = 600;

export function NotificationBanner({ notification, onDismiss }: NotificationBannerProps) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!notification) return;
    setFading(false);
    const fadeTimer = setTimeout(() => setFading(true), VISIBLE_MS);
    const dismissTimer = setTimeout(() => onDismiss(), VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
  }, [notification, onDismiss]);

  if (!notification) return null;

  const style = TYPE_STYLES[notification.type] || TYPE_STYLES.momentum;

  return (
    <div
      data-testid={`notification-${notification.type}`}
      className="rounded-xl px-4 py-3 flex items-start gap-3"
      style={{
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        animation: "fadeSlideIn 0.4s ease-out",
        opacity: fading ? 0 : 1,
        transform: fading ? "translateY(-12px)" : "translateY(0)",
        transition: `opacity ${FADE_MS}ms ease-out, transform ${FADE_MS}ms ease-out`,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <Bell size={14} className="mt-0.5 shrink-0" style={{ color: style.accent }} />
      <p className="flex-1 text-xs leading-relaxed" style={{ color: style.accent }}>
        {notification.message}
      </p>
      <button
        data-testid="button-dismiss-notification"
        onClick={onDismiss}
        className="shrink-0 p-0.5 rounded transition-all active:scale-90"
        style={{ color: style.accent }}
      >
        <X size={12} />
      </button>
    </div>
  );
}
