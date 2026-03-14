# Ascend OS

## Overview
Ascend OS is a full-stack self-growth RPG designed as an "Awakened Hunter System." It gamifies real-life daily rituals to motivate personal development. The system progresses users through 5 phases (Stabilization to Sovereignty) based on a stability score and quest completion. It aims to transform daily hunter paths into in-game achievements, fostering continuous self-improvement within an immersive experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## Terminology & Language Evolution System
The app uses a 4-stage Language Evolution System that gradually introduces RPG terminology as the user progresses. Full RPG language only appears at Stage 4 (Narrative).

### Language Stages
- **Stage 1 (Onboarding)**: Simple, low-effort wording — Step, Reset, Moment, Begin, Continue, Focus. No RPG language.
- **Stage 2 (Rhythm)**: Structured language — Habit, Focus Session, Schedule, Flow, Consistency, Routine.
- **Stage 3 (Growth)**: Identity language — Growth, Path, Momentum, Development, Progress.
- **Stage 4 (Narrative)**: Full RPG language — Quest, Mission, Hunter Path, Power Growth, Daily Ritual.

### Stage Determination
- `onboardingDay ≤ 7 && !isOnboardingComplete` → Stage 1
- `completionDays < 14 || streak < 7` → Stage 2
- `completionDays ≥ 28 && streak ≥ 14` → Stage 4
- Otherwise → Stage 3

### Key Term Mappings (Stage 1 → 2 → 3 → 4)
- Quest → Step → Task → Challenge → Quest
- Mission → Goal → Goal → Goal → Mission
- Power Growth → Practice → Training → Growth → Power Growth
- Daily Ritual → Step → Habit → Habit → Daily Ritual
- Hunter Path → Routine → Routine → Path → Hunter Path
- Focus Session → Moment → Focus Session → Focus Session → Focus Session
- Momentum → Progress → Consistency → Momentum → Momentum

### Implementation
- **`client/src/lib/languageStage.ts`**: Client-side `applyLanguageStage(text, stage)` function and stage calculation
- **`server/gameLogic/languageStage.ts`**: Server-side duplicate for AI Coach integration
- **`client/src/context/LanguageStageContext.tsx`**: React context providing `stage` and `t()` function
- **`userLanguageStage`**: Returned from `/api/player/:id/home` endpoint
- **AI Coach**: `getHomeInsight()` and `handleCoachChat()` both accept `languageStage` parameter
- **Reset endpoint**: `POST /api/player/:id/reset-progress` resets player to Day 1 for testing

## System Architecture

### Core Systems
Ascend OS is built around seven interconnected modular systems:
-   **Phase System**: Manages user progression through 5 distinct phases based on stability, streaks, and daily ritual count.
-   **Stability Score**: A dynamic composite score (0-100) reflecting daily ritual completion, sleep, energy, emotional state, and quest timing, influencing progression and visual changes. Supportive tier labels: Building, Developing, Solid, Strong, Excellent.
-   **Quest Engine**: Handles daily ritual management, prioritizing quests, processing completions (XP, badges), and adjusting durations based on stability.
-   **AI Coach**: A rule-based, internal coaching engine that provides contextual, calm, and strategic suggestions, particularly during setbacks. Actionable steps are prioritized first. `getHomeInsight()` provides a short coach insight for the home screen.
-   **Visual Evolution**: Adapts in-game visuals (environment, avatar auras, feedback) in real-time according to the user's phase and stability.
-   **Notifications**: Delivers positively framed alerts for milestones, phase changes, stability warnings, and missed rituals, avoiding negative language.
-   **Rewards**: Implements behavior-tied rewards like momentum-driven XP, streak bonuses, and badges, focused on intrinsic motivation.
-   **Flow State System**: Tracks engagement (0-100) based on momentum, today's completion ratio, stacking bonuses, and return bonuses. Labels: "In Flow" (≥70), "Building Flow" (≥30), "Warming Up" (≥1), "Awaiting Action" (0). Located in `server/gameLogic/flowEngine.ts`.

### Technical Implementation
-   **Frontend**: React 18, TypeScript, Wouter for routing, TanStack React Query for server state, React Context for game state. UI uses shadcn/ui (Radix UI) and Tailwind CSS v4. 3D rendering is powered by React Three Fiber and Drei, with animations by Framer Motion.
-   **Backend**: Node.js with Express, TypeScript, and ESM modules, following a RESTful API pattern.
-   **Data Layer**: PostgreSQL database managed with Drizzle ORM. Zod schemas ensure shared validation between client and server.
-   **Core Design Principles**:
    -   **Shared Schema**: A single source of truth for types and validation.
    -   **Stats from Quests Only**: All progression and stats are derived solely from quest completion.
    -   **Stability-Driven Dynamics**: The stability score is central to progression, regression, and difficulty.
    -   **Positive Reinforcement**: All system feedback is framed positively, even for setbacks.
    -   **Gradual Onboarding**: Concise initial onboarding with progressive feature disclosure over 7 days.
    -   **Guided Sessions**: Pre-configured focus sessions for immediate user engagement.

### Navigation
-   **Bottom Nav (4 items)**: HOME (`/`), TRAIN (`/train`), RITUALS (`/habits`), COACH (`/coach`)
-   **Sidebar Menu**: Hamburger icon trigger, slide-out overlay. Items: Profile, Analytics, Progress History, Library, Achievements, Weekly Planning. System Tools section: Sectograph (unlocks Day 7). Also: Future Game (3D at `/game3d`).
-   **Sectograph** (`/sectograph`): Unified time system page with 3 tabbed views — Timeline (radial Sectograph clock, default), Calendar (monthly event management), and Week (weekly overview). Replaces standalone Calendar sidebar item. Locked before Day 7 with message "Sectograph unlocks once your rhythm begins." **Temporarily unlocked (unlockDay=1) for testing.**
    -   **Time Awareness Layer**: Present-moment indicator (pulsing green dot on outer ring), default time segments (Sleep/Work/Personal/Focus), free-time gap detection with dashed green arcs, contextual awareness insights (e.g. "You have a free window coming up"), segment legend, and "NOW" badge on current block. Users observe before editing — schedule editing unlocks later. Located in `client/src/components/game/Sectograph.tsx` (core SVG + `detectFreeWindows()` + `DEFAULT_SEGMENTS`) and `client/src/pages/SectographPage.tsx` (awareness UI + `getAwarenessInsight()`).

### Key Pages
-   **HomePage** (`client/src/pages/HomePage.tsx`): Default landing. Shows Phase Card (phase name + stability label), Flow State label, AI Coach insight card, Growth State indicator, primary action button, "View Schedule" secondary button. Adapts based on onboarding day and power growth mode.
-   **TrainPage** (`client/src/pages/TrainPage.tsx`): "Power Growth" header. 4 categories: Strength, Agility, Meditation (Sense), Night Recovery Hunter Path (Vitality). Quick-start buttons per category.
-   **CoachPage** (`client/src/pages/CoachPage.tsx`): Full AI Coach with insights, chat interface, and contextual suggestions. Deep Coach mode unlocks at Day 6.
-   **HabitsPage** (`client/src/pages/HabitsPage.tsx`): "Daily Rituals" header. Ritual management, creation, completion. Custom rituals unlock at Day 3.
-   **StatusPage** (`client/src/pages/StatusPage.tsx`): Schedule view, accessible via "View Schedule" button on home.

### 7-Day Onboarding Progression
Each day has a unique guided step:
- **Day 1**: 2-Minute Reset (calm breathing, 120s)
- **Day 2**: Light Movement (prompts, 150s)
- **Day 3**: Hydration Check (instant)
- **Day 4**: Quick Reflection (timer, 60s)
- **Day 5**: Focus Block (timer, 180s)
- **Day 6**: Plan Tomorrow (instant)
- **Day 7**: Weekly Reflection (instant)

Button labels use "Begin" language during onboarding (e.g., "Begin Today's Reset", "Begin Today's Practice").

### Key Features
-   **7-Day Behavioral Reflection System**: Progressively introduces features and provides contextual feedback based on user engagement.
-   **Flow State System (Internal)**: Tracks engagement and momentum (0-100) to influence AI recommendations and visuals.
-   **Momentum Response & Micro-Feedback**: Immediate visual, haptic, and textual feedback upon daily ritual completion.
-   **Guided Session System**: Provides immediate, zero-setup activities like "2-Minute Reset" or "Light Movement," recording completions without creating permanent rituals. Calm Breathing includes ambient background music (Web Audio API sine-wave pad at 174/261/349 Hz) and voice-guided phase cues (SpeechSynthesis API for "Inhale", "Hold", "Exhale").
-   **Growth State System (Unified Progress Indicator)**: A single visible progress concept for the user interface, synthesizing stability, flow, and momentum into qualitative states (e.g., "Beginning," "Thriving rhythm").

### Progressive Access (Soft-Lock System)
Features and detailed metrics are progressively unlocked based on `onboardingDay` (1-7), ensuring a gradual introduction to the system's complexity. This includes ritual creation, detailed analytics, advanced Coach features, and schedule functionalities.

### Day 6: System Awareness Unlock
-   **Day6RevealModal** (`client/src/components/game/Day6RevealModal.tsx`): One-time modal revealing hidden progress. Title: "Your Progress Was Never Invisible." Stored in `ascend_day6_reveal_seen` localStorage flag.
-   **Momentum Meter**: First visible system meter, shown on HomePage when `onboardingDay >= 6`. Fades in after modal dismissal. Shows 0-100 bar with "Built through consistency" label. No stability/flow meters shown.
-   **Coach Unlock**: `DeepCoachView` activates at Day 6 with "System Insight Unlocked" header (one-time, `ascend_deep_coach_seen`) and "Understanding Momentum" explanation section.
-   **Schedule Unlock**: Editing enabled at Day 6. One-time banner: "You now control your full system." (`ascend_schedule_unlock_seen`).
-   **Day 6 Completion**: DayCloseOverlay shows "Momentum Activated" / "You showed up again. This is how change compounds." with "Continue to Day 7" button.

### Day 7: Identity Transition (Onboarding Completion)
-   **Day7TransitionModal** (`client/src/components/game/Day7TransitionModal.tsx`): One-time modal marking graduation into power growth mode. Title: "You Have Begun." Body describes identity shift from starting to growing. Button: "Enter Power Growth." Stored in `ascend_day7_transition_seen` localStorage flag.
-   **Home Screen Transformation**: When `onboardingDay >= 7` or `isOnboardingComplete`, header changes to "Today's Power Growth" with subtext "Consistency builds strength." Beginner prompts and Day N references removed.
-   **Power Growth Status Card**: Shows on HomePage in power growth mode with "Power Growth: Active" label, current streak count, and momentum meter bar.
-   **Train Tab**: Fully enabled with info tooltip ("Grow stats through real-world actions.") visible in power growth mode.
-   **Coach Update**: Shows "Phase 1 Power Growth Guidance" header when in power growth mode. Coach tone shifts from instructional to advisory.
-   **Day 7 Completion**: DayCloseOverlay shows "Power Growth Day Complete" / "You kept the promise to yourself today." with "Continue" button. Onboarding does not auto-advance past Day 7.
-   **State**: `isOnboardingComplete` returned by `/api/player/:id/home` (true when `onboardingDay >= 7` or `player.onboardingCompleted === 1`). `streak` also returned.
-   **Animation Style**: Slow fade transitions, subtle glow on Power Growth Status card. No confetti or gamified rewards.

## External Dependencies

### Database
-   **PostgreSQL**: Primary relational data store.

### UI/Component Libraries
-   **Radix UI**: Headless component library for building accessible UI.
-   **shadcn/ui**: Pre-styled UI components built on Radix UI and Tailwind CSS.
-   **Lucide React**: Icon library.

### 3D Graphics
-   **Three.js**: Core 3D rendering library.
-   **@react-three/fiber**: React renderer for Three.js.
-   **@react-three/drei**: Collection of useful helpers for React Three Fiber.
