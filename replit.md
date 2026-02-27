# Ascend OS

## Overview
Ascend OS is a full-stack self-growth RPG designed as an "Awakened Hunter System." It gamifies real-life habits to motivate personal development. The system progresses users through 5 phases (Stabilization to Sovereignty) based on a stability score and task completion. It aims to transform daily routines into in-game achievements, fostering continuous self-improvement within an immersive experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Systems
Ascend OS is built around seven interconnected modular systems:
-   **Phase System**: Manages user progression through 5 distinct phases based on stability, streaks, and habit count.
-   **Stability Score**: A dynamic composite score (0-100) reflecting habit completion, sleep, energy, emotional state, and task timing, influencing progression and visual changes.
-   **Task Engine**: Handles habit management, prioritizing tasks, processing completions (XP, badges), and adjusting durations based on stability.
-   **AI Coach**: A rule-based, internal coaching engine that provides contextual, calm, and strategic suggestions, particularly during setbacks.
-   **Visual Evolution**: Adapts in-game visuals (environment, avatar auras, feedback) in real-time according to the user's phase and stability.
-   **Notifications**: Delivers positively framed alerts for milestones, phase changes, stability warnings, and missed habits, avoiding negative language.
-   **Rewards**: Implements behavior-tied rewards like momentum-driven XP, streak bonuses, and badges, focused on intrinsic motivation.

### Technical Implementation
-   **Frontend**: React 18, TypeScript, Wouter for routing, TanStack React Query for server state, React Context for game state. UI uses shadcn/ui (Radix UI) and Tailwind CSS v4. 3D rendering is powered by React Three Fiber and Drei, with animations by Framer Motion.
-   **Backend**: Node.js with Express, TypeScript, and ESM modules, following a RESTful API pattern.
-   **Data Layer**: PostgreSQL database managed with Drizzle ORM. Zod schemas ensure shared validation between client and server.
-   **Core Design Principles**:
    -   **Shared Schema**: A single source of truth for types and validation.
    -   **Stats from Tasks Only**: All progression and stats are derived solely from task completion.
    -   **Stability-Driven Dynamics**: The stability score is central to progression, regression, and difficulty.
    -   **Positive Reinforcement**: All system feedback is framed positively, even for setbacks.
    -   **Gradual Onboarding**: Concise initial onboarding with progressive feature disclosure over 7 days.
    -   **Guided Sessions**: Pre-configured sessions for immediate user engagement.

### Key Features
-   **7-Day Behavioral Reflection System**: Progressively introduces features and provides contextual feedback based on user engagement.
-   **Flow State System (Internal)**: Tracks engagement and momentum (0-100) to influence AI recommendations and visuals.
-   **Momentum Response & Micro-Feedback**: Immediate visual, haptic, and textual feedback upon habit completion.
-   **Guided Session System**: Provides immediate, zero-setup activities like "calm breathing" or "light movement," recording completions without creating permanent habits.
-   **Growth State System (Unified Progress Indicator)**: A single visible progress concept for the user interface, synthesizing stability, flow, and momentum into qualitative states (e.g., "Beginning," "Thriving rhythm").

### Progressive Access (Soft-Lock System)
Features and detailed metrics are progressively unlocked based on `onboardingDay` (1-7), ensuring a gradual introduction to the system's complexity. This includes habit creation, detailed analytics, advanced Coach features, and schedule functionalities.

### Day 6: System Awareness Unlock
-   **Day6RevealModal** (`client/src/components/game/Day6RevealModal.tsx`): One-time modal revealing hidden progress. Title: "Your Progress Was Never Invisible." Stored in `ascend_day6_reveal_seen` localStorage flag.
-   **Momentum Meter**: First visible system meter, shown on HomePage when `onboardingDay >= 6`. Fades in after modal dismissal. Shows 0-100 bar with "Built through consistency" label. No stability/flow meters shown.
-   **Coach Unlock**: `DeepCoachView` activates at Day 6 with "System Insight Unlocked" header (one-time, `ascend_deep_coach_seen`) and "Understanding Momentum" explanation section.
-   **Schedule Unlock**: Editing enabled at Day 6. One-time banner: "You now control your full system." (`ascend_schedule_unlock_seen`).
-   **Day 6 Completion**: DayCloseOverlay shows "Momentum Activated" / "You showed up again. This is how change compounds." with "Continue to Day 7" button.
-   **Home subtitle**: "Day 6 · System awareness unlocked." with motivation "Your consistency has been building all along."
-   **Backend**: `/api/player/:id/home` returns `momentum` (0-100, rounded from avgMomentum * 100).

### Day 7: Identity Transition (Onboarding Completion)
-   **Day7TransitionModal** (`client/src/components/game/Day7TransitionModal.tsx`): One-time modal marking graduation into training mode. Title: "You Have Begun." Body describes identity shift from starting to training. Button: "Enter Training Mode." Stored in `ascend_day7_transition_seen` localStorage flag.
-   **Home Screen Transformation**: When `onboardingDay >= 7` or `isOnboardingComplete`, header changes from "Let's start small today." to "Today's Training" with subtext "Consistency builds strength." Beginner prompts and Day N references removed.
-   **Training Status Card**: Shows on HomePage in training mode with "Training Status: Active" label, current streak count, and momentum meter bar.
-   **Train Tab**: Fully enabled with info tooltip ("Train stats through real-world actions.") visible in training mode.
-   **Coach Update**: Shows "Phase 1 Training Guidance" header when in training mode. Coach tone shifts from instructional to advisory.
-   **Day 7 Task**: Button reads "Complete Today's Training" / "Complete [HabitName]" instead of "Start."
-   **Day 7 Completion**: DayCloseOverlay shows "Training Day Complete" / "You kept the promise to yourself today." with "Continue" button. Onboarding does not auto-advance past Day 7.
-   **State**: `isOnboardingComplete` returned by `/api/player/:id/home` (true when `onboardingDay >= 7` or `player.onboardingCompleted === 1`). `streak` also returned.
-   **Animation Style**: Slow fade transitions, subtle glow on Training Status card. No confetti or gamified rewards.

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