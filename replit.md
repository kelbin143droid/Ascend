# Ascend OS

## Overview
Ascend OS is a full-stack self-growth RPG, an "Awakened Hunter System," designed to gamify real-life daily rituals. It aims to transform everyday actions into in-game achievements, guiding users through 5 phases (Stabilization to Sovereignty) determined by a stability score and quest completion within an immersive experience. The project focuses on fostering personal development and habit formation.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Systems
Ascend OS is built around modular, interconnected systems:
-   **Phase System**: Manages user progression through 5 phases based on stability, streaks, and ritual completion.
-   **Stability Score**: A dynamic score (0-100) reflecting daily ritual completion and well-being, influencing progression and visuals.
-   **Quest Engine**: Processes daily ritual completions, awarding XP and badges, and adjusting durations.
-   **AI Coach**: A rule-based coach with a calm, observant, non-judgmental, concise, and supportive personality, following an Acknowledge → Reframe → Suggest pattern. Includes enhanced chat UI with mood check-in, quick question chips, habit loop education, and bad habit guidance.
-   **Bad Habits System**: Users can track negative patterns they want to break. Each bad habit stores trigger, craving, category, replacement habit, and replacement cue. A daily "avoided" check-in builds a streak. Backed by the `bad_habits` DB table with full CRUD via `/api/player/:id/bad-habits` and `/api/bad-habits/:id`.
-   **Visual Evolution**: Adapts in-game visuals (environment, avatar auras, feedback) based on user phase and stability.
-   **Notifications**: Delivers positively framed alerts for milestones, phase changes, and warnings.
-   **Rewards**: Implements behavior-tied rewards like momentum-driven XP, streak bonuses, and badges.
-   **Flow State System**: Tracks user engagement based on momentum, completion ratio, and bonuses.
-   **Rhythm Detection Engine**: Analyzes completion history to detect recurring behavioral windows, integrating with the Sectograph and AI Coach.
-   **Adaptive Habit Placement System (AHPS)**: Suggests optimal times for new habits by cross-referencing detected rhythms with free time windows.
-   **Identity Engine**: Reinforces positive self-perception based on behavioral data, progressing through 4 identity stages (Early, Developing, Stabilized, Advanced) and providing observational reflections.
-   **Return Protocol System**: Intelligently responds to user inactivity with tiered absence protocols (e.g., reset rituals, Simplify Mode, Soft Restart) without using guilt language.
-   **Stability Engine**: A 3-state system (stabilizing/stable/expanding) with disruption detection, recovery mode, and progressive feature gating and habit limits, also adjusting coach tone.

### APGS Stat Progression System
-   **Level Curve**: Exponential XP scaling (XP_required(level) = 100 × level^1.5).
-   **XP Per Activity**: Duration-based with randomized ranges (10-100 XP).
-   **Stat Rule**: Stat value equals its level, derived from per-stat XP.
-   **HP/MP Scaling**: Increases by 5% per level (HP = 100 × 1.05^(level-1), MP = 50 × 1.05^(level-1)).
-   **Rank System**: E (1-4) through S (30+).
-   **Progressive Tab Unlocking**: HOME and COACH available from Day 1; HABITS unlocks Day 3; TRAIN unlocks Day 7.

### Guided Activity Engine
A reusable engine for step-based training activities (`instruction`, `timer`, `rep`, `breath`, `completion`).
-   **Voice Guidance**: Built-in speech synthesis with countdowns and beeps.
-   **Activity Flow**: Sequential step execution, progress tracking, XP granting, and activity recording to Sectograph.
-   **Workout App UX**: Features circular timers, animated exercise emojis, movement hints, and smooth transitions.
-   **Phase 1 Activities**: Includes Calm Breathing, Strength Micro Circuit, Light Movement Circuit, and Vitality Check.
-   **Daily Training Flow**: A guided sequence through all 4 activities, offering bonus XP for full completion.
-   **Adaptive Training Scaling**: 5 difficulty tiers per category, with progression and regression logic based on completion streaks and missed days, and XP multipliers.

### Language Evolution System
A 4-stage system that gradually introduces RPG terminology as users progress: Stage 1 (Onboarding), Stage 2 (Rhythm), Stage 3 (Growth), Stage 4 (Narrative).

### Technical Implementation
-   **Frontend**: React 18, TypeScript, Wouter, TanStack React Query, React Context. UI uses shadcn/ui (Radix UI) and Tailwind CSS v4. 3D rendering with React Three Fiber and Drei, animations with Framer Motion.
-   **Backend**: Node.js with Express, TypeScript, ESM modules, RESTful API.
-   **Data Layer**: PostgreSQL with Drizzle ORM, Zod schemas for validation.
-   **Core Design Principles**: Shared schema, stats derived from quests, stability-driven dynamics, positive reinforcement, gradual onboarding, guided sessions.

### Post-Onboarding Home Screen
Serves as a daily command center with Daily Status, Today's Training Flow, Suggested Time Window, and Quick Progress Snapshot. It also displays Coach insights and Identity reflections.

### Navigation
-   **Bottom Nav**: HOME, PROFILE, HABITS, COACH. (TRAIN tab removed; replaced by PROFILE tab at `/profile`, available from Day 1.)
-   **Sidebar Menu**: Profile, Analytics, Progress History, Library, Achievements, Weekly Planning, System Tools (including Sectograph).
-   **Sectograph**: A unified time system page with Timeline, Calendar, and Week views, including time awareness, behavioral anchoring, and focus session management.

### Habits Page (Upgraded)
Two-tab layout:
- **Build tab**: Active habits with daily progress bar, expandable habit loop details (cue/craving/response/reward), scheduled time, streak stats, edit/delete.
- **Break tab**: Bad habits tracking — each card shows trigger, craving, replacement plan, current streak, and daily "avoided" button. Stats overview: total tracked, best streak, total days avoided.
- **Add Habit Modal**: Includes habit name, stat, starting duration, optional scheduled time (hour:minute picker), optional stack-after, and collapsible Habit Loop section (cue/craving/response/reward).
- **Add Bad Habit Modal**: Now uses `BreakHabitModal.tsx` — standalone component with "Analyze with AI Coach" button that pattern-matches the habit name/category and pre-fills replacement strategy and cue.
- Habit loop fields stored in DB: `cue`, `craving`, `response`, `reward`, `scheduledHour`, `scheduledMinute`, `description` (all nullable).

### AI-Powered Habit Modals (Integrated)
- **`client/src/lib/aiCoachService.ts`**: Rule-based AI engine providing stat-specific habit recommendations (3 per stat: strength/sense/vitality/agility) with XP/HP/MP effect labels, full habit loop fields (cue/craving/response/reward), and tips. Also provides `analyzeBadHabit(name, category)` for pattern-matched replacement strategies.
- **`client/src/components/game/AddHabitModal.tsx`**: Standalone Add/Edit Habit Dialog with collapsible "AI Coach Suggestions" panel showing 3 recommendation cards per stat. Selecting a card auto-fills name, duration, and habit loop fields. Shows XP/HP/MP preview when a recommendation is selected.
- **`client/src/components/game/BreakHabitModal.tsx`**: Standalone Break Habit Dialog with "Analyze with AI Coach" button. Simulates a brief thinking delay then shows a replacement strategy + tip, auto-filling the replacement plan fields (editable).
- `HabitsPage.tsx` uses these components instead of inline Dialog blocks, with simplified handler functions.

### Coach Page (Upgraded)
Two-tab layout:
- **Chat tab**: Full conversational AI chat with bubble UI, mood check-in (energized/good/okay/low/grateful), quick question chips, suggestion chips in coach replies, typing indicator, new-conversation reset.
- **Insights tab**: Coach messages with priority sorting, nudge card, Habit Loop Science explainer, Breaking Bad Habits explainer with direct chat links.
- Chat route: `POST /api/player/:id/coach/chat` with full context (habits, completions, rhythm, identity, return protocol, stability tone modifiers).

### 5-Day Onboarding System
A modular, futuristic onboarding flow replacing old inline logic. It defines 5 days of guided sessions with a dashboard, start screens, completion screens, and a final completion screen, using specific design elements and animations. Features are progressively unlocked based on onboarding day.

### Day 6+ Home System (Post-Onboarding Dashboard)
The post-onboarding home screen is rendered by `Day6Home.tsx` and powered by three modular client-side libraries:

- **`client/src/lib/xpSystem.ts`**: Computes XP state (level, exp, maxExp, percent) from backend data. Flat 100 XP per level. Provides rank labels (E→S) and XP bar colors.
- **`client/src/lib/statsSystem.ts`**: HP and Mana stat system persisted in localStorage (`ascend_stats_v2`). HP (Vitality) decreases 1% after 2 missed sleep checks (tracked via `ascend:sleep-check` window event). Mana (Calm Breathing/Meditation) decreases 1% after 2 consecutive missed Calm Breathing sessions. Good streaks restore 0.5% per session after 3 consecutive days.
- **`client/src/lib/userState.ts`**: Combines flow completion tracking with stat updates. `markFlowCompleted(ids)` records date, updates breathing stats, and triggers daily decay.
- **`client/src/components/game/Day6Home.tsx`**: Simplified home layout:
  1. Header: player name, phase, Level chip, E-Rank label
  2. XP bar (0/100 at Level 2)
  3. HP bar (green→yellow→red) and Mana bar (blue→purple), with live values from localStorage
  4. Begin Daily Flow button (full-width neon) OR "Flow completed today" state
  5. Coach message card (from `homeData.insight`)
  6. Show/Hide toggle for Today's Sessions (Calm Breathing, Agility Flow, Physical Circuit, Vitality Check) with completion checkmarks

**Sleep check wiring**: `GuidedActivityEngine.tsx` dispatches `ascend:sleep-check` custom event (with `detail.sleptWell: boolean`) when the user answers the sleep check step. `Day6Home` listens for this event and calls `recordSleepCheck()` to update HP in real time.

### Level-Up Animation System (End of Onboarding)
On Day 5 completion, the `OnboardingCompleteScreen` triggers a multi-phase level-up animation sequence before navigating to the home dashboard:
- **Phase "filling-earned"**: XP bar animates 0 → 25 (earned XP during onboarding).
- **Phase "filling-levelup"**: Bar continues 25 → 100 with gold glow, "⚡ LEVEL UP" label (visual only).
- **Phase "showing-modal"**: `LevelUpModal` fullscreen overlay appears. Backend `POST /api/player/:id/onboarding-complete` is called — marks onboarding complete but **does NOT force Level 2**. Player stays at Level 1 with naturally earned XP (25 XP from 5 days × 5 XP each).
- **Phase "done"**: `onEnter()` fires → navigates to the post-onboarding home dashboard at **Level 1 with 25/100 XP**.
- **New files**: `client/src/components/game/LevelUpModal.tsx`, `client/src/components/game/XPProgressBar.tsx`, `client/src/hooks/useLevelSystem.ts`.
- **New endpoint**: `POST /api/player/:id/onboarding-complete` — idempotent; just sets `onboardingCompleted: 1`. Guards against double-calling.
- **Dev tool**: `POST /api/player/:id/dev/fix-onboarding-xp` — resets corrupted player XP back to Level 1 / 25 XP (for players with wrong data from old logic). Accessible via "Fix XP" button in DevPanel.

### Level System
- `GROWTH = 0` in `server/gameLogic/levelSystem.ts` → every level requires exactly **100 XP** (flat curve).
- `getXPForNextLevel(any level)` returns `100` always.
- `getTotalXPForLevel(N)` = `100 × (N-1)`.

### Guided Training — Exercise Definitions
- **Push-Ups replace Backward Shoulder Roll** in `LightMovementEngine.tsx` (Light Movement session).
- **All Agility Flow steps flagged `loop: false`** — Cross Arm (L/R), Tricep Stretch (L/R), Toe Touch Hold, Hip Opener all play video once and hold frame (static hold UX).
- **Plank Hold** also flagged `loop: false` in Physical Circuit.
- **Sleep Check** step changed from `"instruction"` type to `"check"` type → renders Yes / Not yet buttons with a "Why sleep matters" info tooltip.
- **Vitality Check** completion auto-calls `/api/player/:id/complete-guided-session` via `completeMutation`, awards XP. After tapping Continue, the `DailyFlowEngine` flow-complete screen auto-dismisses to Home after 2.5 seconds (or user taps "Return Home" immediately).

### Daily Flow Order
Defined by `DAILY_FLOW_ORDER` constant inside `buildPhase1Activities`:
1. Calm Breathing (meditation / sense)
2. Agility Flow (agility / agility)
3. Physical Circuit (strength / strength)
4. Vitality Check (vitality / vitality)

### Calm Breathing Pattern
`breathTiming: { inhaleSeconds: 4, holdSeconds: 4, exhaleSeconds: 6 }` — the 4-4-6 rhythm.

## External Dependencies

### Database
-   **PostgreSQL**: Primary relational data store.

### UI/Component Libraries
-   **Radix UI**: Headless component library.
-   **shadcn/ui**: Pre-styled UI components.
-   **Lucide React**: Icon library.

### 3D Graphics
-   **Three.js**: Core 3D rendering library.
-   **@react-three/fiber**: React renderer for Three.js.
-   **@react-three/drei**: Helpers for React Three Fiber.