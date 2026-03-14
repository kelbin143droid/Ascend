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
-   **Bottom Nav**: HOME, TRAIN, RITUALS, COACH.
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