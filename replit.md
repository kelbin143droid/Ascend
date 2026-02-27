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