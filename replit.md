# replit.md

## Overview

This is a Solo Leveling-themed RPG game interface built as a full-stack web application. The project creates an immersive "Awakened Hunter System" experience with player stats, dungeon exploration, inventory management, skill trees, and a 3D game mode. Players can level up, allocate stat points, fight enemies in dungeons, and manage their character progression through a stylized cyberpunk/gaming UI.

The app features a comprehensive **Habit Formation System** with micro-sessions, progressive scaling, streak tracking with momentum, badge achievements, and an AI coaching assistant.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Context for game state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom theme variables, custom fonts (Orbitron, Rajdhani, JetBrains Mono)
- **3D Rendering**: React Three Fiber with Drei helpers for the 3D game mode
- **Animations**: Framer Motion for UI transitions, CSS @keyframes for micro-rewards

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under `/api/*`
- **Build Tool**: esbuild for server bundling, Vite for client

### Data Layer
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Validation**: Zod schemas with drizzle-zod integration

### Project Structure
```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/  # UI components (shadcn + game-specific)
│   │   │   └── game/    # AICoach, MicroRewards, ExerciseAnimation, etc.
│   │   ├── context/     # React context providers
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utilities, intervalTraining, animationRegistry
│   │   └── pages/       # Route page components (HabitsPage, AnalyticsPage, etc.)
├── server/           # Express backend
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database operations (IStorage interface)
│   ├── db.ts         # Database connection
│   └── gameLogic/    # Game logic modules
│       ├── phaseEngine.ts       # Consistency-based phase progression (replaces phaseConfig)
│       ├── momentumEngine.ts    # Momentum scoring, streak resilience, recovery protection
│       ├── difficultyScaler.ts  # Adaptive difficulty within phases, dynamic training durations
│       ├── rewardEngine.ts      # Momentum-driven XP, bonuses, badge eligibility
│       ├── aiCoach.ts           # Interactive coaching engine with chat, contextual suggestions
│       ├── habitProgression.ts  # Habit stacking suggestions
│       ├── statProgression.ts   # Stat XP, fatigue, HP/MP updates
│       ├── xpProgressionSystem.ts # Task completion, MVD, penalties
│       ├── levelSystem.ts       # Level-up calculations
│       └── stats.ts             # Derived stats calculation
├── shared/           # Shared types and schemas
│   └── schema.ts     # Drizzle schema + Zod types
└── migrations/       # Drizzle database migrations
```

### Key Design Decisions

1. **Shared Schema**: Types and validation schemas are defined once in `shared/schema.ts` and used by both frontend and backend, ensuring type safety across the stack.

2. **Storage Pattern**: Database operations are abstracted through an `IStorage` interface in `storage.ts`, making it easy to swap implementations.

3. **Player Persistence**: Player ID is stored in localStorage, with automatic player creation on first visit.

4. **Development vs Production**: Vite middleware is used in development for HMR; static files are served in production from the built `dist/public` directory.

5. **Animation Registry**: `animationRegistry.ts` abstracts exercise animations with a RendererType field to allow swapping SVG silhouettes for Unity 3D avatars per-animation.

6. **Habit System**: Habits use momentum-based tracking instead of pure streaks. Grace days prevent harsh penalties. Progressive scaling auto-adjusts duration and difficulty based on consistency.

7. **AI Coach**: Rule-based coaching engine (no external API) that provides contextual suggestions based on player habits, streaks, time of day, and recent activity.

### Database Tables
- `players` — Main player data, stats, inventory, schedule, XP, phase
- `daily_stat_snapshots` — Daily stat snapshots for analytics
- `roles` — User-defined life roles for weekly planning
- `weekly_goals` — Eisenhower Matrix goals per role per week
- `tasks` — Calendar tasks linked to roles and goals
- `trials` — Multi-day challenge system
- `calendar_events` — Google Calendar-style events
- `habits` — Habit definitions with streak, momentum, difficulty, stacking
- `habit_completions` — Individual habit completion records
- `badges` — Earned achievement badges

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connected via `DATABASE_URL` environment variable
- **Connection**: Uses `pg` Pool with Drizzle ORM

### UI/Component Libraries
- **Radix UI**: Headless component primitives (dialogs, menus, tooltips, etc.)
- **shadcn/ui**: Pre-styled components using Radix + Tailwind
- **Lucide React**: Icon library

### 3D Graphics
- **Three.js**: 3D rendering engine
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers for R3F (controls, environment, text)

### Build & Development
- **Vite**: Frontend dev server and bundler
- **esbuild**: Server bundling for production
- **Drizzle Kit**: Database migrations (`db:push` command)

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Development tooling
- **@replit/vite-plugin-dev-banner**: Development environment indicator
