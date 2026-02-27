# Ascend OS

## Overview
Ascend OS is a full-stack self-growth RPG, an "Awakened Hunter System" where real-life habits directly influence progression within a game world. It aims to motivate users toward personal development through gamification. The system is built around 7 modular components: Phase, Stability Score, Task Engine, AI Coach, Visual Evolution, Notifications, and Rewards. Player stats and progression are exclusively tied to task completion, guiding users through 5 distinct phases from "Stabilization" to "Sovereignty," primarily driven by their stability score and consistency. The project envisions an immersive experience that transforms daily routines into meaningful in-game achievements, fostering continuous self-improvement.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Systems
The architecture is composed of seven interconnected modular systems:
1.  **Phase System**: Manages player progression through 5 phases (Stabilization, Foundation, Expansion, Optimization, Sovereignty) based on stability, streaks, and habit count. Regression is framed as "Strategic Recalibration."
2.  **Stability Score**: A composite score (0-100) influenced by habit completion, sleep, energy, emotional stability, and task timing. It dictates phase progression, difficulty, and visual changes.
3.  **Task Engine**: Orchestrates habit management, including retrieving prioritized habits, handling completion logic (momentum, XP, badges), and adjusting task durations based on stability.
4.  **AI Coach**: A rule-based, non-external API coaching engine providing contextual, calm, and strategic suggestions, especially during periods of regression.
5.  **Visual Evolution**: Dynamically adjusts in-game visuals (environment, avatar auras, task completion feedback) according to the player's phase and stability score.
6.  **Notifications**: Delivers positively framed notifications for milestones, phase changes, stability warnings, and missed habits, avoiding negative language.
7.  **Rewards**: Implements behavior-tied rewards such as momentum-driven XP, streak bonuses, and badge eligibility, avoiding arbitrary incentives.

### Technical Implementation
-   **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack React Query for server state, and React Context for game state. UI components are built with shadcn/ui (Radix UI primitives) and styled with Tailwind CSS v4. 3D rendering is handled by React Three Fiber with Drei, and animations use Framer Motion.
-   **Backend**: Node.js with Express, written in TypeScript with ESM modules. Follows a RESTful API pattern.
-   **Data Layer**: Utilizes Drizzle ORM with PostgreSQL as the database. Zod schemas are used for validation and shared between client and server.
-   **Core Design Principles**:
    -   **Shared Schema**: A single source of truth for types and validation (`shared/schema.ts`).
    -   **Stats from Tasks Only**: All player stats and progression are exclusively derived from task completion.
    -   **Stability-Driven Dynamics**: Stability score is central to progression, regression, and difficulty scaling.
    -   **Positive Reinforcement**: All system feedback, including notifications and messaging around setbacks, is framed positively.
    -   **Gradual Onboarding**: A concise 3-slide onboarding with progressive feature disclosure over 7 days.
    -   **Guided Sessions**: Pre-configured guided sessions (`/guided-session/:sessionId`) for initial user engagement.

### Project Structure
The codebase is organized into `client/` (React frontend), `server/` (Express backend with game logic modules), `shared/` (shared types and schemas), and `migrations/` (Drizzle migrations).

### Key Features
-   **7-Day Behavioral Reflection System**: Progressively introduces features and provides contextual feedback based on `onboardingDay`.
-   **Flow State System**: Tracks a player's engagement and momentum (0-100), influencing visuals and AI recommendations.
-   **Momentum Response & Micro-Feedback**: Immediate visual, haptic, and textual feedback upon habit completion.
-   **Onboarding Flow**: A streamlined 3-slide orientation that emphasizes action and gradual growth, leading directly into core gameplay.
-   **Guided Session System**: Provides immediate, zero-setup guided activities (e.g., breathing, movement) for new users.

## External Dependencies

### Database
-   **PostgreSQL**: Primary data store, accessed via Drizzle ORM.

### UI/Component Libraries
-   **Radix UI**: Headless component library.
-   **shadcn/ui**: Pre-styled UI components built on Radix UI and Tailwind CSS.
-   **Lucide React**: Icon library.

### 3D Graphics
-   **Three.js**: 3D rendering engine.
-   **@react-three/fiber**: React renderer for Three.js.
-   **@react-three/drei**: Helper utilities for React Three Fiber.

### Build & Development Tools
-   **Vite**: Frontend development server and bundler.
-   **esbuild**: Backend bundling.
-   **Drizzle Kit**: Database migration tool.

### Replit-Specific Tooling
-   **@replit/vite-plugin-runtime-error-modal**
-   **@replit/vite-plugin-cartographer**
-   **@replit/vite-plugin-dev-banner**

## Feature Details

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

### Day 3 Turning Point
- `client/src/components/game/Day3IntroFlow.tsx` — Multi-step overlay for identity formation on Day 3.
- Triggered when: `onboardingDay === 3`, first open today (localStorage check), previous day completed, not yet completed today.
- Flow: Reentry message ("You're building consistency.") → Reflection question ("How did yesterday feel?" with 4 options) → Adaptive response (2s) → Choice moment ("Repeat yesterday's habit" recommended or "Try a different micro habit").
- Reflection responses saved to localStorage (`ascend_reflections`).
- "Repeat" navigates to guided session; "Different" returns to Home for selection.
- Calm animations only, no stats or rewards shown.

### Day Close Overlay
- `client/src/components/game/DayCloseOverlay.tsx` — Full-screen overlay triggered on first habit completion of each day.
- 2-phase sequence: "Day N complete." (1.5s) → day-specific continuation message + "See you Day N+1" button.
- Day-specific messages for all 7 onboarding days, encouraging return rather than achievement.
- Calm animations only (glow, fade-in). No confetti, no XP display, no loud celebrations.
- Button closes overlay and navigates to `/`.
- During onboardingDay 1–3: HomePage shows "Complete anytime today" instead of task durations (no scheduling pressure).

### Guided Session System
- Route: `/guided-session/:sessionId` — fullscreen self-contained sessions, zero setup required.
- Session types: `calm-breathing` (2min breathing animation with Inhale/Hold/Exhale + 5s countdown), `light-movement` (2.5min sequential prompts), `hydration-check` (instant with Done button), `quick-reflection` (1min timer).
- Backend: `POST /api/player/:id/complete-guided-session` records `habit_completion` with `guided_` prefix, updates stability (+2) and XP (+5). No permanent habit created.
- HomePage routes new users (no habits) to guided sessions instead of /habits.
- On completion: DayCloseOverlay triggers if first completion of the day; otherwise shows "Session complete." with "Return Home" button.
- `client/src/pages/GuidedSessionPage.tsx` — session page with type-specific UI.

### Flow State System
- `server/gameLogic/flowEngine.ts` — `getFlowState()` returns 0-100 value based on momentum, completions, stacking, and return bonus. `updateFlowAfterCompletion()` returns updated FlowState after task completion. `applyDailyFlowDecay()` reduces flow by 8%/day of inactivity.
- Flow labels: 0 → "Awaiting Action", 1-29 → "Warming Up", 30-69 → "Building Flow", 70-100 → "In Flow". No negative wording.
- Drives visual intensity on Home page and AI recommendations.
- Habit completion returns `flow` in response; HomePage invalidated on completion for real-time feedback.