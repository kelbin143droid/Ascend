# Ascend OS

## Overview
Ascend OS is a full-stack self-growth RPG, an "Awakened Hunter System," that gamifies real-life daily rituals to foster personal development. It guides users through 5 phases (Stabilization to Sovereignty) determined by a stability score and quest completion. The project aims to transform everyday actions into in-game achievements within an immersive experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Systems
Ascend OS is built around seven interconnected modular systems:
-   **Phase System**: Manages user progression through 5 distinct phases based on stability, streaks, and daily ritual count.
-   **Stability Score**: A dynamic score (0-100) reflecting daily ritual completion and well-being metrics, influencing progression and visuals.
-   **Quest Engine**: Handles daily ritual management, processing completions (XP, badges), and adjusting durations based on stability.
-   **AI Coach**: A rule-based coaching engine with a defined personality (calm, observant, non-judgmental, concise, supportive). It follows an Acknowledge → Reframe → Suggest pattern and integrates with the Language Evolution System and behavioral anchors.
-   **Visual Evolution**: Adapts in-game visuals (environment, avatar auras, feedback) in real-time according to the user's phase and stability.
-   **Notifications**: Delivers positively framed alerts for milestones, phase changes, and warnings.
-   **Rewards**: Implements behavior-tied rewards like momentum-driven XP, streak bonuses, and badges for intrinsic motivation.
-   **Flow State System**: Tracks user engagement (0-100) based on momentum, completion ratio, and bonuses.
-   **Rhythm Detection Engine**: Analyzes completion history to detect recurring behavioral windows using 60-minute bucketing with recency weighting. Outputs `RhythmWindow` and `RhythmInsight`. Integrates with Sectograph (glow arcs), SectographPage (insight cards), and AI Coach chat. Located in `server/gameLogic/rhythmEngine.ts`. API: `GET /api/player/:id/rhythm`.
-   **Adaptive Habit Placement System (AHPS)**: Suggests optimal times for new habits by cross-referencing RhythmWindows with Sectograph free time windows. Generates up to 3 `PlacementSuggestion` entries filtered by stat and duration. Visual: semi-transparent cyan blocks with glow on Sectograph. HabitsPage creation dialog shows "Suggested Times" panel with accept/adjust/ignore options. Coach integration via `getCoachPlacementComment()`. Located in `server/gameLogic/habitPlacement.ts`. API: `GET /api/player/:id/habit-placement-suggestions?stat=&duration=`.
-   **Identity Engine**: Gradually reinforces positive self-perception based on behavioral data. Reads from Stability Engine, Rhythm Detection Engine, habit completions, focus sessions, and recovery history. 4 identity stages: Early (week 1-2, first patterns), Developing (weeks 3-4, rhythm forming), Stabilized (1-3 months, consistent engagement), Advanced (3+ months, reliable system). Generates observational reflections (never praise-based) and sparse reflection anchors (reflective questions, 1-2x/week). Tone: calm, concise, observational. Integrates with Home screen (identity card + anchor card), AI Coach chat (appends identity comments), and dedicated API endpoint. Located in `server/gameLogic/identityEngine.ts`. API: `GET /api/player/:id/identity`.
-   **Return Protocol System**: Responds intelligently to user inactivity with 3 absence tiers. Tier 1 (3-5 days): welcome-back screen + 60-second reset ritual (breathing + reflection). Tier 2 (10+ days): Simplify Mode — reduces habit load, shortens focus durations, hides complex analytics for 7 days. Tier 3 (30+ days): Soft Restart — guides user through reset, hides previous progress initially, minimal starting load for 14 days. Never uses guilt language (no "You missed"/"You failed"/"streak ended"). Integrates with Stability Engine (adjusts habit limits), AI Coach (tone-appropriate messages, banned phrase filtering), and Home screen (full-screen return flow with animated ritual steps). Located in `server/gameLogic/returnProtocol.ts`. Frontend: `client/src/components/game/ReturnProtocolScreen.tsx`.
-   **Stability Engine (Enhanced)**: 3-state system (stabilizing/stable/expanding) with disruption detection, recovery mode, and expansion logic. States: stabilizing (score<45 OR <5 consecutive active days), stable (score≥45 AND ≥5 days), expanding (score≥70 AND ≥2 weeks stable). Disruption triggers recovery mode (habit limit=2, gentle coach tone). Habit limits per state: stabilizing=3, stable=6, expanding=10. Feature gates control progressive feature access. Coach tone modifier (gentle/encouraging/challenging) adjusts message intensity. Located in `server/gameLogic/stabilityEngine.ts`. Integrated into home endpoint (systemState in response), coach chat (tone + recovery messages), and HabitsPage (habit limit enforcement + recovery/expansion banners).

### APGS Stat Progression System
-   **Level Curve**: XP_required(level) = 100 × level^1.5 (exponential scaling).
-   **XP Per Activity**: Small tasks (≤3 min) = 10–15 XP, Medium tasks (≤10 min) = 25–40 XP, Large tasks (>10 min) = 60–100 XP. Duration-based with randomized range.
-   **Level Calculation**: Iterative subtraction — XP overflow carries forward to next level.
-   **Stat Rule**: Stat value equals that stat's level (derived from per-stat XP). XP ≠ stat value.
-   **HP/MP Scaling**: HP = 100 × 1.05^(level-1), MP = 50 × 1.05^(level-1). Increases by 5% per level.
-   **Rank System**: E (1-4), D (5-9), C (10-14), B (15-19), A (20-29), S (30+).
-   **Progressive tab unlocking**: HOME and COACH available from Day 1; HABITS unlocks Day 3; TRAIN unlocks Day 7. All tabs unlock after onboarding.
-   **Implementation**: `server/gameLogic/levelSystem.ts` contains all formulas. `storage.ts` gainExp uses scaled HP/MP + rank. Routes derive stats from per-stat XP levels.

### Guided Activity Engine
Reusable engine that runs any training activity through a common step-based system. New activities are created by defining steps in `ActivityDefinition` objects — no new code needed per activity.
-   **Step Types**: `instruction` (text display), `timer` (countdown), `rep` (repetition counter with count/label), `breath` (animated breathing circle with configurable inhale/hold/exhale timing), `completion` (final screen with XP claim).
-   **Voice Guidance**: Built-in speech synthesis reads each step's `voiceText` aloud. Counts down "3, 2, 1" at end of timed intervals. Toggle on/off via speaker icon in activity header. Preference persisted in localStorage.
-   **Activity Flow**: Load definition → run steps sequentially → show progress bar → complete → grant XP via `complete-guided-session` → record to Sectograph timeline via `record-activity`.
-   **Workout App UX**: Timer steps show a 3-2-1 "Get Ready" countdown before auto-starting. Circular timer display with animated exercise emoji and movement hints. Beep sounds (Web Audio API) on countdown ticks and triple-tone on exercise completion. Skip button during active timers. Smooth slide transitions between exercises.
-   **Phase 1 Activities** (flow order): Calm Breathing (4-2-6 pattern, 2 min) → Strength Micro Circuit (push-ups timer → cardio jog timer → crunches timer → rest, ~2 min, all time-based intervals) → Light Movement Circuit (neck rolls → shoulder rolls → arm circles → torso twist → hip circles → forward fold → rest, all time-based intervals, tier-scaled) → Vitality Check (hydration + sleep).
-   **Daily Training Flow**: Guided sequence through all 4 activities. Shows "Step X of 4" progress. Users can skip individual activities but +5 bonus XP only awarded for completing all. Each completed activity records separately to Sectograph. Completion screen: "Daily flow complete. Your rhythm is strengthening." Component: `client/src/components/game/DailyFlowEngine.tsx`. API: `POST /api/player/:id/daily-flow-bonus`.
-   **Adaptive Training Scaling**: 5 difficulty tiers per category. Phase 1 caps at Tier 3. Progression: 3 completions in a row → tier up. Regression: 3 missed days → tier down. XP multipliers: T1=1.0, T2=1.1, T3=1.2, T4=1.3, T5=1.5. Strength tiers define push-up seconds (20s→45s), cardio (30s→60s), crunch seconds (20s→45s). Agility tiers define neck rolls (15s→30s), shoulder rolls (15s→30s), arm circles (15s→30s), torso twist (20s→40s), hip circles (15s→30s), forward fold (15s→35s), rest (15s). Tracked per category: tier, completionStreak, missedDays, sessionsCompleted, lastSessionDate. Server: `server/gameLogic/trainingScaling.ts`. API: `GET /api/player/:id/training-scaling`. Schema field: `trainingScaling` (JSONB on players table).
-   **Files**: Engine component at `client/src/components/game/GuidedActivityEngine.tsx`, flow component at `client/src/components/game/DailyFlowEngine.tsx`, activity definitions at `client/src/lib/activityEngine.ts`, TrainPage at `client/src/pages/TrainPage.tsx`.
-   **API**: `POST /api/player/:id/record-activity` adds a schedule entry to the player's Sectograph timeline with timestamp, stat color, category, and XP earned.

### Language Evolution System
The application features a 4-stage Language Evolution System that gradually introduces RPG terminology as the user progresses:
-   **Stage 1 (Onboarding)**: Simple, non-RPG language.
-   **Stage 2 (Rhythm)**: Structured language.
-   **Stage 3 (Growth)**: Identity language.
-   **Stage 4 (Narrative)**: Full RPG terminology (e.g., Quest, Hunter Path).

### Technical Implementation
-   **Frontend**: React 18, TypeScript, Wouter for routing, TanStack React Query for server state, React Context for game state. UI uses shadcn/ui (Radix UI) and Tailwind CSS v4. 3D rendering uses React Three Fiber and Drei, with animations by Framer Motion.
-   **Backend**: Node.js with Express, TypeScript, and ESM modules, following a RESTful API pattern.
-   **Data Layer**: PostgreSQL database managed with Drizzle ORM. Zod schemas ensure shared validation.
-   **Core Design Principles**: Shared schema, stats derived from quests only, stability-driven dynamics, positive reinforcement, gradual onboarding, and guided sessions.

### Post-Onboarding Home Screen
After completing the 7-day onboarding, the Home screen becomes a daily command center with 4 sections:
1. **Daily Status**: Phase name + "Day X of Consistency" (consecutive active days).
2. **Today's Training Flow**: Card listing all 4 activities with "Begin Flow" button (launches DailyFlowEngine). Shows "Flow completed today" after completion.
3. **Suggested Time Window**: Uses current time to suggest an available window for training, with "View in Sectograph" link.
4. **Quick Progress Snapshot**: 4-column grid showing current level for Strength, Agility, Focus, Vitality (from `statLevels`).
Also displays Coach insight and Identity reflection cards when available. Return Protocol screen takes priority when active.

### Navigation
-   **Bottom Nav**: HOME, TRAIN, HABITS, COACH.
-   **Sidebar Menu**: Profile, Analytics, Progress History, Library, Achievements, Weekly Planning, System Tools (including Sectograph).
-   **Sectograph**: A unified time system page with Timeline, Calendar, and Week views. It includes a time awareness layer, behavioral anchoring markers, and active focus session management.

### Progressive Access
Features are progressively unlocked based on `onboardingDay` (1-5) to gradually introduce complexity. This includes daily guided steps for the first 5 days: Day 1=Breathing, Day 2=Light Movement, Day 3=Hydration+Reflection, Day 4=Light Cardio, Day 5=Plan & Reflect. After Day 5 is complete, `isOnboardingComplete` becomes true and the app enters Daily Flow (training) mode. TRAIN tab unlocks on Day 5. HABITS unlocks on Day 3.

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