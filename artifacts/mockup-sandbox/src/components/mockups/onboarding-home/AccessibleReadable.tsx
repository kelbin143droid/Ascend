import { Wind, Play, ChevronRight } from "lucide-react";

export function AccessibleReadable() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: "#06060f",
        color: "#f5f5ff",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        paddingBottom: 80,
      }}
    >
      {/* Skip nav link (accessibility) */}
      <a
        href="#main-action"
        style={{
          position: "absolute",
          top: -40,
          left: 0,
          padding: "8px 16px",
          backgroundColor: "#8b5cf6",
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          zIndex: 100,
          borderRadius: "0 0 8px 0",
          transition: "top 0.2s",
        }}
        onFocus={(e) => { (e.target as HTMLElement).style.top = "0"; }}
        onBlur={(e) => { (e.target as HTMLElement).style.top = "-40px"; }}
      >
        Skip to main action
      </a>

      {/* Page header — explicit, large, high contrast */}
      <header style={{ padding: "52px 24px 20px" }}>
        {/* Progress — text + visual, no icon-only */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <div>
            <p
              aria-label="Onboarding progress: Day 1 of 7"
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 600,
                color: "#a78bfa",
                letterSpacing: "0.06em",
              }}
            >
              Day 1 of 7
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(245,245,255,0.45)", marginTop: 2 }}>
              Stabilization phase
            </p>
          </div>
          {/* Progress track */}
          <div
            aria-label="7-day progress: 0 days complete"
            style={{ display: "flex", gap: 5 }}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <div
                key={d}
                style={{
                  width: 22,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: d === 1 ? "#8b5cf6" : "rgba(255,255,255,0.1)",
                  border: d === 1 ? "none" : "1px solid rgba(255,255,255,0.08)",
                }}
              />
            ))}
          </div>
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 800,
            color: "#f5f5ff",
            lineHeight: 1.2,
            letterSpacing: "-0.5px",
          }}
        >
          Today's practice
        </h1>
      </header>

      {/* Main content */}
      <main id="main-action" style={{ flex: 1, padding: "0 24px" }}>
        {/* Session card — all text, no icon-only labels */}
        <div
          role="region"
          aria-label="Today's session: 2-Minute Reset"
          style={{
            backgroundColor: "rgba(139,92,246,0.1)",
            border: "1.5px solid rgba(139,92,246,0.3)",
            borderRadius: 18,
            padding: "24px 20px",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
            {/* Icon WITH visible label underneath */}
            <div
              aria-hidden="true"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: "rgba(139,92,246,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Wind size={24} color="#a78bfa" />
              </div>
              <span style={{ fontSize: 10, color: "#a78bfa", fontWeight: 600, letterSpacing: "0.05em" }}>
                BREATHING
              </span>
            </div>

            <div style={{ flex: 1 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#f5f5ff", lineHeight: 1.2 }}>
                2-Minute Reset
              </h2>
              {/* Duration — explicit text label, no ambiguity */}
              <p style={{ margin: 0, fontSize: 14, color: "#a78bfa", fontWeight: 500 }}>
                ⏱ 2 minutes
              </p>
            </div>
          </div>

          {/* Description — minimum 16px for readability */}
          <p
            style={{
              margin: "0 0 16px",
              fontSize: 16,
              lineHeight: 1.65,
              color: "rgba(245,245,255,0.72)",
            }}
          >
            Slow breathing to reset your nervous system. This is your only task for today.
          </p>

          {/* Coach message — labelled clearly */}
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "rgba(255,255,255,0.04)",
              borderRadius: 10,
              borderLeft: "3px solid rgba(139,92,246,0.5)",
            }}
          >
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Coach says
            </p>
            <p style={{ margin: 0, fontSize: 15, color: "rgba(245,245,255,0.65)", lineHeight: 1.55 }}>
              Begin with one small action.
            </p>
          </div>
        </div>

        {/* "What this unlocks" — explicit, not hidden */}
        <div
          role="note"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            backgroundColor: "rgba(255,255,255,0.025)",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.07)",
            marginBottom: 28,
          }}
        >
          <p style={{ margin: 0, fontSize: 14, color: "rgba(245,245,255,0.45)", lineHeight: 1.45 }}>
            Completing today unlocks Day 2 tomorrow.
          </p>
          <ChevronRight size={18} color="rgba(245,245,255,0.2)" aria-hidden="true" />
        </div>

        {/* CTA — large touch target (min 48px), explicit label */}
        <button
          id="start-session"
          aria-label="Begin today's 2-minute reset breathing session"
          style={{
            width: "100%",
            minHeight: 56,
            padding: "16px 24px",
            borderRadius: 16,
            background: "#7c3aed",
            border: "none",
            color: "#fff",
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: "0.04em",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            boxShadow: "0 4px 24px rgba(124,58,237,0.4)",
            marginBottom: 8,
          }}
        >
          <Play size={18} fill="#fff" aria-hidden="true" />
          Start
        </button>

        {/* Accessible duration label under button */}
        <p
          aria-live="polite"
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "rgba(245,245,255,0.35)",
            margin: "6px 0 0",
          }}
        >
          Takes about 2 minutes
        </p>

        <p
          style={{
            textAlign: "center",
            fontSize: 10,
            color: "rgba(240,240,248,0.15)",
            marginTop: 24,
            fontStyle: "italic",
          }}
        >
          Tradeoff: WCAG-level contrast + explicit labels — less visual RPG atmosphere
        </p>
      </main>

      {/* Bottom nav — text labels always visible */}
      <nav
        aria-label="Main navigation"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 68,
          backgroundColor: "#0a0a18",
          borderTop: "1.5px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "0 8px",
        }}
      >
        {[
          { label: "Home", active: true },
          { label: "Train", active: false },
          { label: "Habits", active: false },
          { label: "Coach", active: false },
        ].map(({ label, active }) => (
          <button
            key={label}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "8px 4px",
              background: "none",
              border: "none",
              cursor: "pointer",
              minHeight: 48,
              minWidth: 48,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                backgroundColor: active ? "#8b5cf6" : "rgba(255,255,255,0.12)",
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: active ? 700 : 400,
                color: active ? "#a78bfa" : "rgba(255,255,255,0.38)",
                letterSpacing: "0.06em",
              }}
            >
              {label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
