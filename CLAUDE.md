# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 语言规范

- 所有对话和文档都使用中文
- 文档使用 markdown 格式

## Project Overview

A multi-theme card game framework for iOS built with TypeScript, React Native/Expo, and pnpm workspaces. The architecture separates the core game engine from themed implementations, allowing multiple themed games to share the same engine.

## Common Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Type checking
pnpm typecheck

# Linting and formatting
pnpm lint          # Check for issues
pnpm lint:fix      # Auto-fix issues
pnpm format        # Format with Prettier
pnpm format:check  # Check formatting

# Testing
pnpm test          # Run tests (single run)
pnpm test:watch    # Watch mode
pnpm test:coverage # With coverage

# Run apps
pnpm app:bigtech   # Start bigtech-worker Expo app
pnpm app:startup   # Start startup Expo app
pnpm app:travel    # Start travel Expo app
pnpm app:parenting # Start parenting Expo app
```

## Architecture

### Package Structure

- **packages/core/**: Game engine - card system, state management, turn system, event bus, and advanced systems (combos, status effects, achievements, difficulty, daily challenges)
- **packages/ui/**: React Native UI components with `useGameEngine` hook, theming, and i18n support
- **packages/themes/**: Theme configurations (bigtech-worker is complete, others in progress)
- **apps/**: Expo apps for each theme

### Core Engine Flow

```
GameEngine
├── GameStateManager (central state + subsystems)
│   └── ComboSystem, StatusEffectSystem, CardUpgradeSystem,
│       RandomEventSystem, AchievementSystem, DifficultySystem,
│       DailyChallengeSystem
├── TurnManager (turn phases and flow)
├── EventBus (pub/sub for game events)
└── EffectResolver (processes card effects with custom handlers)
```

### Theme Integration

Themes export a `ThemeConfig` containing: card definitions, stat/resource definitions, game rules, win conditions, combo/status/upgrade definitions, random events, achievements, difficulty levels, daily challenge config, localization strings, and UI theme.

```typescript
import { GameEngine } from '@theme-card-games/core';
import { GameBoard, ThemeProvider } from '@theme-card-games/ui';
import { bigtechWorkerTheme } from '@theme-card-games/theme-bigtech-worker';
```

### Key Patterns

- **Constructor injection**: Options/Config interfaces passed to constructors
- **Custom handler registries**: Extend behavior via `CustomEffectHandler`, `RandomEventCustomHandler`, etc.
- **Event-driven**: EventBus enables decoupled communication between systems
- **Card lifecycle**: CardDefinition (blueprint) → CardInstance (runtime) → Card states: 'in_deck' | 'in_hand' | 'played' | 'discarded'

## Testing

Uses Vitest with tests co-located as `*.test.ts` files. Tests cover core systems (combo, status effects, card upgrades, random events, utilities).

```bash
# Run a specific test file
pnpm test packages/core/src/utils.test.ts
```

## Pre-commit Hooks

Husky runs on commit: `pnpm format` → `pnpm lint` → `pnpm typecheck`. The `.claude/settings.json` configures hooks to auto-format before git operations.

## Naming Conventions

- Classes: PascalCase (Card, GameEngine, TurnManager)
- Functions: camelCase (generateId, deepClone)
- Files: PascalCase for classes (Card.ts), camelCase for utilities (utils.ts)
- Private members: `_` prefix (`_theme`, `_stateManager`)
- Options interfaces: suffix with `Options` (GameEngineOptions)
- Config interfaces: suffix with `Config` or `Definition` (ThemeConfig, CardDefinition)
