import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SystemMsg {
  id: string;
  type: 'stat_gain' | 'level_up' | 'evolution' | 'dungeon' | 'rank_up' | 'gear' | 'sync';
  title: string;
  subtitle?: string;
  icon?: string;
  color?: string;
}

const TYPE_CONFIG: Record<SystemMsg['type'], { color: string; bg: string; icon: string }> = {
  stat_gain:  { color: '#22d3ee', bg: 'rgba(6,182,212,0.12)',   icon: '⬆' },
  level_up:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.14)',  icon: '✦' },
  evolution:  { color: '#a855f7', bg: 'rgba(168,85,247,0.14)',  icon: '◈' },
  dungeon:    { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: '⚔' },
  rank_up:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.18)',  icon: '▲' },
  gear:       { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: '◆' },
  sync:       { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  icon: '◎' },
};

const MAX_MESSAGES = 4;
const DISPLAY_DURATION = 3200;

export function SystemMessageEngine() {
  const [queue, setQueue] = useState<SystemMsg[]>([]);

  const addMessage = useCallback((msg: SystemMsg) => {
    setQueue(prev => {
      const next = [...prev, msg];
      return next.slice(-MAX_MESSAGES);
    });
    setTimeout(() => {
      setQueue(prev => prev.filter(m => m.id !== msg.id));
    }, DISPLAY_DURATION + 600);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent).detail as SystemMsg;
      if (msg?.id) addMessage(msg);
    };

    const activityHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail as any;
      const stat = detail?.stat || detail?.activity?.stat;
      const xp = detail?.xp ?? detail?.xpGained ?? 10;
      if (stat) {
        const statLabels: Record<string, string> = { strength: 'STR', agility: 'AGI', vitality: 'VIT', sense: 'SEN' };
        addMessage({
          id: `activity-${Date.now()}`,
          type: 'stat_gain',
          title: `${statLabels[stat] ?? stat.toUpperCase()} INCREASED`,
          subtitle: `+${xp} XP · SYNC ACTIVE`,
          icon: '⬆',
        });
      } else {
        addMessage({
          id: `activity-${Date.now()}`,
          type: 'sync',
          title: 'SESSION COMPLETE',
          subtitle: `+${xp} XP GAINED`,
        });
      }
    };

    window.addEventListener('ascend:system-msg', handler);
    window.addEventListener('ascend:activity-completed', activityHandler);
    return () => {
      window.removeEventListener('ascend:system-msg', handler);
      window.removeEventListener('ascend:activity-completed', activityHandler);
    };
  }, [addMessage]);

  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{ top: 16, right: 12, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}
      aria-live="polite"
    >
      <AnimatePresence>
        {queue.map((msg) => {
          const cfg = TYPE_CONFIG[msg.type];
          const color = msg.color ?? cfg.color;
          const bg    = msg.color
            ? `${msg.color}18`
            : cfg.bg;
          const icon  = msg.icon ?? cfg.icon;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: 60, scale: 0.92 }}
              animate={{ opacity: 1, x: 0,  scale: 1    }}
              exit={{    opacity: 0, x: 60,  scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              style={{
                background: bg,
                border: `1px solid ${color}40`,
                boxShadow: `0 0 18px ${color}30, 0 4px 16px rgba(0,0,0,0.5)`,
                backdropFilter: 'blur(14px)',
                borderRadius: 12,
                padding: '9px 14px',
                minWidth: 190,
                maxWidth: 260,
              }}
            >
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 16, color, filter: `drop-shadow(0 0 6px ${color})` }}>
                  {icon}
                </span>
                <div className="flex flex-col min-w-0">
                  <span
                    className="font-mono font-bold uppercase tracking-[0.12em] leading-tight"
                    style={{ fontSize: 11, color, textShadow: `0 0 8px ${color}80` }}
                  >
                    {msg.title}
                  </span>
                  {msg.subtitle && (
                    <span
                      className="font-mono leading-tight mt-0.5"
                      style={{ fontSize: 9, color: `${color}aa`, letterSpacing: '0.06em' }}
                    >
                      {msg.subtitle}
                    </span>
                  )}
                </div>
              </div>
              {/* Scan-line effect */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: DISPLAY_DURATION / 1000 - 0.6, ease: 'linear' }}
                style={{
                  height: 2, borderRadius: 2, marginTop: 7, transformOrigin: 'left',
                  background: `linear-gradient(to right, ${color}, ${color}44)`,
                  boxShadow: `0 0 6px ${color}`,
                }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
