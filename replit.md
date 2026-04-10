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
-   **AI Coach**: A rule-based coach with a calm, observant, non-judgmental, concise, and supportive personality, following an Acknowledge → Reframe → Suggest pattern.
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

### 5-Day Onboarding System
A modular, futuristic onboarding flow replacing old inline logic. It defines 5 days of guided sessions with a dashboard, start screens, completion screens, and a final completion screen, using specific design elements and animations. Features are progressively unlocked based on onboarding day.

### Level-Up Animation System (End of Onboarding)
On Day 5 completion, the `OnboardingCompleteScreen` triggers a multi-phase level-up animation sequence before navigating to the home dashboard:
- **Phase "filling-earned"**: XP bar animates 0 → 25 (earned XP during onboarding).
- **Phase "filling-levelup"**: Bar continues 25 → 100 with gold glow, "⚡ LEVEL UP" label.
- **Phase "showing-modal"**: `LevelUpModal` fullscreen overlay appears ("LEVEL UP! Welcome to Level 2"). Backend `POST /api/player/:id/onboarding-complete` is called to set the player to Level 2.
- **Phase "done"**: `onEnter()` fires → navigates to the post-onboarding home dashboard at Level 2 with 0/282 XP.
- **New files**: `client/src/components/game/LevelUpModal.tsx`, `client/src/components/game/XPProgressBar.tsx`, `client/src/hooks/useLevelSystem.ts`.
- **New endpoint**: `POST /api/player/:id/onboarding-complete` — idempotent; gives the remaining XP to reach Level 2 (threshold: 100 total XP). Guards against double-calling (level >= 2 check).

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