# Ascend OS

## Overview
Ascend OS is a full-stack self-growth RPG designed to gamify real-life daily rituals. It transforms everyday actions into in-game achievements, guiding users through five phases (Stabilization to Sovereignty) based on a stability score and quest completion. The project aims to foster personal development and habit formation within an immersive experience, leveraging an "Awakened Hunter System" to enhance user engagement and facilitate positive behavioral change.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Systems
Ascend OS is built on modular, interconnected systems:
-   **Phase System**: Manages user progression through 5 phases based on stability, streaks, and ritual completion.
-   **Stability Score**: A dynamic score (0-100) reflecting daily ritual completion and well-being, influencing progression and visuals.
-   **Quest Engine**: Processes daily ritual completions, awarding XP and badges, and adjusting durations.
-   **AI Coach**: A rule-based coach with a calm, observant, non-judgmental, concise, and supportive personality, following an Acknowledge → Reframe → Suggest pattern, featuring enhanced chat UI and habit loop education.
-   **Bad Habits System**: Allows tracking of negative patterns, including triggers, cravings, and replacement habits, with daily "avoided" check-ins.
-   **Visual Evolution**: Adapts in-game visuals (environment, avatar auras) based on user phase and stability.
-   **Notifications**: Delivers positively framed alerts for milestones and phase changes.
-   **Rewards**: Implements behavior-tied rewards like momentum-driven XP, streak bonuses, and badges.
-   **Flow State System**: Tracks user engagement based on momentum, completion ratio, and bonuses.
-   **Rhythm Detection Engine**: Analyzes completion history to detect recurring behavioral windows.
-   **Adaptive Habit Placement System (AHPS)**: Suggests optimal times for new habits.
-   **Identity Engine**: Reinforces positive self-perception based on behavioral data, progressing through 4 identity stages.
-   **Return Protocol System**: Intelligently responds to user inactivity with tiered absence protocols without guilt language.
-   **Stability Engine**: A 3-state system (stabilizing/stable/expanding) with disruption detection, recovery mode, and progressive feature gating.

### Gender Theme System
After the intro splash, users select their gender (Male / Female), which applies a permanent game theme:
- **Iron Sovereign** (Male): Electric blue (#0ea5e9) + gold (#f59e0b), dark navy background — bold warrior feel.
- **Neon Empress** (Female): Vivid magenta (#d946ef) + purple (#8b5cf6) + cyan (#06b6d4), deep cosmic background.
Gender is stored in `localStorage` as `ascend_gender`. Theme is auto-applied on every load via `ThemeContext`. Users may still override the theme manually via the theme picker (their explicit choice is stored in `localStorage` as `background-theme`).

### Onboarding Flow
The 5-day onboarding is bypassed entirely. New users go through: **IntroScreen → GenderSelect → PlayerInfoScreen → Welcome → Day6Home**. `onboardingCompleted: 1` is set immediately after name + gender setup, so the app opens directly to the **Day6Home** (Begin Daily Flow) screen on every subsequent visit.

### App Tutorial Overlay
On first entry into Day6Home, a 4-step tooltip tour shows once (stored in `localStorage` as `ascend_app_tutorial_seen`). Each step highlights a bottom nav tab with an animated spotlight and explains its purpose (HOME → HABITS → COACH → PROFILE).

### Dual Progression System
Users progress through an **Overall XP → Level** system and **Stat-Specific XP** (STR/AGI/SNS/VIT). Level-ups award Stat Points for allocation, affecting bonus stats. A game intro tutorial explains this system. The level curve uses exponential XP scaling, and an E through S Rank System is implemented. All features are unlocked from day 1 (no progressive day-based gating).

### Guided Activity Engine
A reusable engine for step-based training activities (`instruction`, `timer`, `rep`, `breath`, `completion`) with voice guidance. Activities include Calm Breathing, Strength Micro Circuit, Light Movement Circuit, and Vitality Check, with adaptive training scaling across 5 difficulty tiers.

### Language Evolution System
A 4-stage system gradually introduces RPG terminology as users progress through onboarding, rhythm, growth, and narrative stages.

### Technical Implementation
The **Frontend** uses React 18, TypeScript, Wouter, TanStack React Query, and React Context. UI is built with shadcn/ui (Radix UI) and Tailwind CSS v4. 3D rendering uses React Three Fiber and Drei, with animations by Framer Motion. The **Backend** is Node.js with Express, TypeScript, and a RESTful API. The **Data Layer** uses PostgreSQL with Drizzle ORM and Zod for validation. Core design principles include shared schema, stability-driven dynamics, and positive reinforcement.

### User Interface and Navigation
The post-onboarding Home Screen serves as a daily command center. Navigation includes a bottom nav (HOME, PROFILE, HABITS, COACH) and a sidebar menu for analytics, progress history, and system tools like the Sectograph (unified time system). The Habits Page features separate tabs for building new habits and breaking bad ones, including AI-powered suggestions. The Coach Page offers a full conversational AI chat with mood check-ins and an Insights tab for coach messages.

### Onboarding and Post-Onboarding
A 5-day modular onboarding system guides users with progressively unlocked features. Post-onboarding, the `Day6Home` dashboard integrates XP, HP/Mana stats, and daily flow completion tracking. A Level-Up Animation System is triggered upon onboarding completion. The Level System requires a flat 100 XP per level. Guided training exercises, including Push-Ups, Agility Flow, and Plank Hold, are integrated. A Sleep Check mechanism and Vitality Check are part of the daily flow.

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

## Testing
Pure-logic unit tests live next to the modules they cover (e.g. `client/src/lib/remCycleEngine.test.ts`) and run on Node's built-in test runner via `tsx`.

Run all tests:
```
npx tsx --test client/src/lib/*.test.ts
```
The `remCycleEngine` suite locks in cycle-math edge cases (past wake target, too-short windows, midnight bedtime delta, HM round-trip) so the bedtime preview and wind-down notification stay in sync.