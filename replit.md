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

### Navigation
-   **Bottom Nav**: HOME, TRAIN, HABITS, COACH.
-   **Sidebar Menu**: Profile, Analytics, Progress History, Library, Achievements, Weekly Planning, System Tools (including Sectograph).
-   **Sectograph**: A unified time system page with Timeline, Calendar, and Week views. It includes a time awareness layer, behavioral anchoring markers, and active focus session management.

### Progressive Access
Features are progressively unlocked based on `onboardingDay` (1-7) to gradually introduce complexity. This includes daily guided steps for the first 7 days, and specific reveals such as the Momentum Meter, Deep Coach View, and Schedule editing on Day 6, and a full "Power Growth" transition on Day 7.

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