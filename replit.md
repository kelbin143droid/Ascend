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

### Dual Progression System
Users progress through an **Overall XP → Level** system and **Stat-Specific XP** (STR/AGI/SNS/VIT). Level-ups award Stat Points for allocation, affecting bonus stats. A game intro tutorial explains this system. The level curve uses exponential XP scaling, and an E through S Rank System is implemented. Features progressively unlock over the first few days of use.

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