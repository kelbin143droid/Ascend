# replit.md

## Overview

**Ascend OS** — a full-stack self-growth RPG where real-life habits drive game world progression. Built as an immersive "Awakened Hunter System" with 7 modular systems: Phase, Stability Score, Task Engine, AI Coach, Visual Evolution, Notifications, and Rewards. Stats increase ONLY through task completion. Players progress through 5 phases (Stabilization → Sovereignty) driven by stability score and consistency.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### The 7 Modular Systems

1. **Phase System** (`phaseEngine.ts`) — 5 phases: Stabilization, Foundation, Expansion, Optimization, Sovereignty. Progression driven by stability score, streak, and habit count. Regression is strategic recalibration, not punishment.

2. **Stability Score** (`stabilityEngine.ts`) — Composite 0-100 score: habit completion (35%), sleep consistency (20%), energy compliance (15%), emotional stability (15%), task timing adherence (15%). Drives phase progression, regression, difficulty adjustments, and visual evolution.

3. **Task Engine** (`taskEngine.ts`) — Orchestrates habit completion: `getTasksForToday()` returns prioritized habits with phase-adjusted durations, `completeTask()` handles momentum/XP/badge calculation, `getPhaseAdjustedDuration()` returns stability-aware duration.

4. **AI Coach** (`aiCoach.ts`) — Rule-based coaching engine (no external API). Calm strategist tone. Contextual suggestions based on habits, streaks, stability, time of day. Handles regression messaging strategically.

5. **Visual Evolution** (`visualEngine.ts`) — Phase+Stability-driven visuals: `getEnvironmentVisuals()` (stability-based dimming when <40, particle intensity modifier), `getAvatarAura()` (momentum-weighted glow), `getTaskCompletionVisuals()` (stat-colored micro-feedback).

6. **Notifications** (`notificationEngine.ts`) — Positive-framing only: `checkNotificationEligibility()` detects phase_up/phase_down/stability_warning/missed_habits/milestone, `buildNotification()` generates encouraging text. Regression = "Strategic Recalibration".

7. **Rewards** (`rewardEngine.ts`) — Behavior-tied only: momentum-driven XP, streak bonuses, badge eligibility checks. No arbitrary rewards.

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Context for game state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom theme variables, custom fonts (Orbitron, Rajdhani, JetBrains Mono)
- **3D Rendering**: React Three Fiber with Drei helpers for the 3D game mode
- **Animations**: Framer Motion for UI transitions, CSS @keyframes for micro-rewards
- **Visual Feedback Components**: TaskCompletionBurst (stat-colored aura pulse), StabilityShift (green/red tint overlay), PhaseEnvironment (dimming when stability <40, burst on completion)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under `/api/*`
- **Build Tool**: esbuild for server bundling, Vite for client

### Data Layer
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Validation**: Zod schemas with drizzle-zod integration

### Navigation & UX Structure
- **Bottom Nav (4 items)**: HOME (`/`), TRAIN (`/train`), HABITS (`/habits`), COACH (`/coach`)
- **Sidebar Menu** (hamburger icon, top-left): Profile, Analytics, Progress History, Stability Details, Library, Achievements, Weekly Planning, Calendar, Future Game
- **Home Page**: Action-first onboarding — greeting text, 4 recommended habits for new users (Calm Breathing, Light Movement, Hydration Check, Quick Reflection), "Start" primary button, "Create custom habit" secondary link. No system terminology (Phase/Stability/Flow hidden from Home). Primary "Start Here" card + "Other Options" section with habit selection. Dynamic button: "Start {SelectedHabitName}". 7-Day Behavioral Reflection system with day-specific subtitles and progressive feature disclosure.
- **Profile Page** (`/profile`): Identity + progress screen — Phase card, Stability score + label, Flow State meter, stat cap, phase history. All system metrics live here.
- **Train Page**: 4 expandable categories (Strength, Agility, Meditation/Sense, Night Recovery/Vitality) with quick-start sessions
- **Coach Page**: Full-page AI coach with Insights tab (mood check-in, prioritized messages, nudges) and Chat tab
- **Schedule Page** (`/schedule`): Sectograph-based daily schedule (previously the root route)
- **Stability Wording**: Supportive tier labels — Building, Developing, Solid, Strong, Excellent (no "Fragile"/"Critical")

### Onboarding Flow
- 3-slide orientation: Slide 1 (Identity: "Your Life Is the System"), Slide 2 (Growth through action), Slide 3 (First Principle: "Real change starts small." with "Begin" button)
- On Begin: sets `onboardingCompleted = 1`, navigates to Home
- Old educational slides (stats, phases, sectograph) exported as `LEARN_CONTENT` in `OnboardingFlow.tsx` for future Coach → Learn section
- No skip button — intentional (minimal flow, 3 slides only)

### 7-Day Behavioral Reflection System
- `onboardingDay` (1–7): computed server-side from count of distinct days with habit completions, capped at 7. Returned in `/api/player/:id/home`.
- `hasCompletedHabitToday`: boolean computed from today's completions.
- `lastCompletionDate`: date of most recent completion (sorted, nullable).
- Day-specific reflection messages (subtitle + motivation) shown on Home screen.
- Progressive feature disclosure per day:
  - Day 1–2: Emphasize recommended habit only, custom habit minimized.
  - Day 3: "Create custom habit" visually highlighted (bolder text, no "(optional)").
  - Day 4: Encouragement fade-in animation on Home open.
  - Day 5: "Add another small habit?" suggestion after completing first habit today.
  - Day 6: "Learn how growth works" link to Coach page.
  - Day 7: Milestone banner "First Growth Cycle Complete."
- Completion feedback: glow overlay + "Action completed. Momentum increased." message on habit completion (auto-clears after 2s).

### First Completion Moment
- `client/src/components/game/FirstCompletionOverlay.tsx` — Full-screen overlay triggered on Day 1 first habit completion.
- 3-phase sequence: "Completed." (500ms) → "Momentum started." (1.5s) → "Day 1 complete. Tomorrow becomes easier." + "Return Home" button.
- Calm animations only (glow, fade-in). No confetti, no XP display, no loud celebrations.
- "Return Home" button closes overlay and navigates to `/`.
- Internal progression (flow, stability, XP) still processes via existing completion endpoint.
- Future-compatible: receives `onboardingDay` prop for day-specific messaging variants.

### Flow State System
- `server/gameLogic/flowEngine.ts` — `getFlowState()` returns 0-100 value based on momentum, completions, stacking, and return bonus. `updateFlowAfterCompletion()` returns updated FlowState after task completion. `applyDailyFlowDecay()` reduces flow by 8%/day of inactivity.
- Flow labels: 0 → "Awaiting Action", 1-29 → "Warming Up", 30-69 → "Building Flow", 70-100 → "In Flow". No negative wording.
- Drives visual intensity on Home page and AI recommendations.
- Habit completion returns `flow` in response; HomePage invalidated on completion for real-time feedback.

### Momentum Response & Micro-Feedback
- Completing a habit triggers: flow bar animation (spring easing), radial glow pulse on Home, haptic vibration (mobile), immediate status text update.
- AI Coach daily insight is a single dynamic sentence, context-aware (time of day, habit count, stability, completion state).

### Project Structure
```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/  # UI components (shadcn + game-specific)
│   │   │   └── game/    # SidebarMenu, MicroRewards, PhaseEnvironment, ExerciseAnimation, etc.
│   │   ├── context/     # React context providers
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utilities, intervalTraining, animationRegistry
│   │   └── pages/       # HomePage, TrainPage, CoachPage, HabitsPage, StatusPage (schedule), etc.
├── server/           # Express backend
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database operations (IStorage interface, normalizePlayer)
│   ├── db.ts         # Database connection
│   └── gameLogic/    # Game logic modules (7 systems + flow)
│       ├── flowEngine.ts        # Flow State (0-100), getFlowState, updateFlowAfterCompletion
│       ├── phaseEngine.ts       # Phase progression + regression checks
│       ├── stabilityEngine.ts   # Stability score calculation + regression detection
│       ├── taskEngine.ts        # Task orchestration: getTasksForToday, completeTask, getPhaseAdjustedDuration
│       ├── visualEngine.ts      # Visual evolution: getEnvironmentVisuals, getAvatarAura, getTaskCompletionVisuals
│       ├── notificationEngine.ts # Positive-only notifications: checkNotificationEligibility, buildNotification
│       ├── momentumEngine.ts    # Momentum scoring, streak resilience, recovery protection
│       ├── difficultyScaler.ts  # Adaptive difficulty within phases, dynamic training durations
│       ├── rewardEngine.ts      # Momentum-driven XP, bonuses, badge eligibility
│       ├── aiCoach.ts           # Interactive coaching engine with chat, contextual suggestions, getHomeInsight
│       ├── habitProgression.ts  # Habit stacking suggestions
│       ├── statProgression.ts   # Stat XP, fatigue, HP/MP updates
│       ├── xpProgressionSystem.ts # Task completion, MVD, penalties
│       ├── levelSystem.ts       # Level-up calculations
│       └── stats.ts             # Derived stats calculation
├── shared/           # Shared types and schemas
│   └── schema.ts     # Drizzle schema + Zod types
└── migrations/       # Drizzle database migrations
```

### Key API Endpoints (New)
- `GET /api/player/:id/home` — Home screen data: phase, stability, flow state, coach insight, todaysFocus, next action
- `GET /api/player/:id/tasks-today` — Today's habits with completion status, phase-adjusted durations, priority ordering
- `GET /api/player/:id/visuals` — Environment visuals + avatar aura based on phase and stability
- `GET /api/player/:id/stability/trend?days=7` — Historical stability trend data
- `GET /api/player/:id/notifications` — Current notification eligibility
- `POST /api/player/:id/complete-task-unified` — Unified task completion: habit + stability update + visual response + notifications

### Key Design Decisions

1. **Shared Schema**: Types and validation schemas are defined once in `shared/schema.ts` and used by both frontend and backend.

2. **Storage Pattern**: Database operations abstracted through `IStorage` interface. `normalizePlayer()` defaults stability fields for legacy null rows.

3. **Player Persistence**: Player ID stored in localStorage, with automatic player creation on first visit.

4. **Unique Role Constraint**: `roles_user_name_idx` unique constraint on (userId, name) prevents duplicate "General" roles. Client uses try/catch for race conditions.

5. **Stats ONLY Through Tasks**: Stats increase exclusively through task completion — no free stat points.

6. **Phase Visual Evolution**: P1 (minimal/gray) → P5 (epic/gold layered aura). Stability < 40 triggers visual dimming (reduced particle opacity + slower animation). Task completion → stat-colored aura pulse micro-feedback.

7. **Stability-Driven Progression**: Stability score drives phase progression AND regression. Soft regression (stability < 40 for 2+ days) auto-reduces difficulty. Hard regression (stability < 50 for 5+ days) drops one phase.

8. **Positive-Only Notifications**: All notifications use encouraging framing. Phase regression = "Strategic Recalibration". Missed habits = "Ready When You Are".

### Database Tables
- `players` — Main player data, stats, inventory, schedule, XP, phase, stability
- `daily_stat_snapshots` — Daily stat snapshots for analytics
- `roles` — User-defined life roles (unique constraint on userId+name)
- `weekly_goals` — Eisenhower Matrix goals per role per week
- `tasks` — Calendar tasks linked to roles and goals
- `trials` — Multi-day challenge system
- `calendar_events` — Google Calendar-style events
- `habits` — Habit definitions with streak, momentum, difficulty, stacking
- `habit_completions` — Individual habit completion records
- `badges` — Earned achievement badges

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connected via `DATABASE_URL` environment variable
- **Connection**: Uses `pg` Pool with Drizzle ORM

### UI/Component Libraries
- **Radix UI**: Headless component primitives (dialogs, menus, tooltips, etc.)
- **shadcn/ui**: Pre-styled components using Radix + Tailwind
- **Lucide React**: Icon library

### 3D Graphics
- **Three.js**: 3D rendering engine
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers for R3F (controls, environment, text)

### Build & Development
- **Vite**: Frontend dev server and bundler
- **esbuild**: Server bundling for production
- **Drizzle Kit**: Database migrations (`db:push` command)

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Development tooling
- **@replit/vite-plugin-dev-banner**: Development environment indicator
