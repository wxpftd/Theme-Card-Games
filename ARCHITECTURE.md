# Theme Card Games Framework Architecture

## Overview

This framework is designed to support multiple themed card games with a shared core engine. Each theme can be packaged as a standalone app for iOS distribution.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ 大厂打工  │  │   创业   │  │   旅游   │  │   生育   │  ...   │
│  │   App    │  │   App   │  │   App   │  │   App   │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
└───────┼─────────────┼─────────────┼─────────────┼───────────────┘
        │             │             │             │
        └─────────────┴──────┬──────┴─────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                    Theme Configuration Layer                     │
│                            │                                     │
│  ┌─────────────────────────▼─────────────────────────────────┐  │
│  │                    Theme Registry                          │  │
│  │  • Theme Config (cards, rules, assets, localization)      │  │
│  │  • Card Definitions                                        │  │
│  │  • Event Definitions                                       │  │
│  │  • Resource Mappings                                       │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                         UI Layer                                 │
│                            │                                     │
│  ┌─────────────────────────▼─────────────────────────────────┐  │
│  │                 Themed Components                          │  │
│  │  • CardView, DeckView, HandView                           │  │
│  │  • GameBoard, PlayerStatus                                │  │
│  │  • Animations, Effects                                    │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                      Core Game Engine                            │
│                            │                                     │
│  ┌──────────────┬──────────┴───────────┬──────────────────────┐ │
│  │              │                      │                      │ │
│  │  Card System │   State Management   │    Turn System      │ │
│  │  • Deck      │   • GameState        │    • TurnManager    │ │
│  │  • Hand      │   • PlayerState      │    • PhaseManager   │ │
│  │  • Effects   │   • EventBus         │    • ActionQueue    │ │
│  │              │                      │                      │ │
│  └──────────────┴──────────────────────┴──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
Theme-Card-Games/
├── packages/
│   ├── core/                    # Core game engine
│   │   ├── src/
│   │   │   ├── card/           # Card system
│   │   │   ├── state/          # State management
│   │   │   ├── turn/           # Turn system
│   │   │   ├── event/          # Event system
│   │   │   └── types/          # TypeScript types
│   │   └── package.json
│   │
│   ├── ui/                      # Shared UI components
│   │   ├── src/
│   │   │   ├── components/     # React Native components
│   │   │   ├── animations/     # Animation utilities
│   │   │   ├── hooks/          # Custom hooks
│   │   │   └── theme/          # Theming utilities
│   │   └── package.json
│   │
│   └── themes/                  # Theme configurations
│       ├── bigtech-worker/     # 大厂打工主题
│       ├── startup/            # 创业主题
│       ├── travel/             # 旅游主题
│       └── parenting/          # 生育主题
│
├── apps/
│   ├── bigtech-worker/          # 大厂打工 App (Expo)
│   ├── startup/                 # 创业 App (Expo)
│   ├── travel/                  # 旅游 App (Expo)
│   └── parenting/               # 生育 App (Expo)
│
├── package.json                 # Root workspace config
├── tsconfig.json               # TypeScript config
└── turbo.json                  # Turborepo config (optional)
```

## Core Concepts

### 1. Card System
- **Card**: Basic unit with type, effects, and metadata
- **Deck**: Collection of cards with shuffle/draw operations
- **Hand**: Player's current cards
- **Effect**: Actions triggered by cards

### 2. State Management
- **GameState**: Central state container
- **PlayerState**: Individual player data
- **EventBus**: Pub/sub for game events

### 3. Turn System
- **TurnManager**: Controls turn flow
- **Phase**: Game phases (draw, play, resolve, end)
- **ActionQueue**: Queued player actions

### 4. Theme Configuration
Each theme defines:
- Card definitions (types, effects, visuals)
- Game rules and win conditions
- UI theming (colors, fonts, assets)
- Localization strings

## Key Design Principles

1. **Separation of Concerns**: Core engine knows nothing about themes
2. **Dependency Injection**: Themes inject their configuration into the engine
3. **Plugin Architecture**: Easy to add new themes without modifying core
4. **Type Safety**: Full TypeScript support with strict typing
5. **Testability**: Core engine can be tested independently
