# Theme Card Games Framework

A multi-theme card game framework for iOS (Expo/React Native).

## Features

- **Multi-Theme Support**: Create different themed card games using a shared core engine
- **Modular Architecture**: Separate packages for core engine, UI components, and themes
- **iOS Ready**: Built with Expo for easy iOS App Store deployment
- **TypeScript First**: Full type safety across all packages
- **Extensible**: Easy to add new themes, cards, and game mechanics

## Architecture

```
Theme-Card-Games/
├── packages/
│   ├── core/           # Core game engine (card system, state, turns)
│   ├── ui/             # Shared React Native UI components
│   └── themes/         # Theme configurations
│       ├── bigtech-worker/  # 大厂打工
│       ├── startup/         # 创业
│       ├── travel/          # 旅游
│       └── parenting/       # 生育
└── apps/
    └── bigtech-worker/      # Expo app for 大厂打工 theme
```

## Available Themes

| Theme | Status | Description |
|-------|--------|-------------|
| 大厂打工 | ✅ Complete | 体验互联网大厂打工人的日常 |
| 创业 | 🚧 In Progress | 从0到1的创业冒险 |
| 旅游 | 🚧 In Progress | 说走就走的旅行 |
| 生育 | 🚧 In Progress | 新手父母的日常 |

## Quick Start

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- Expo CLI
- iOS Simulator or physical device

### Installation

```bash
# Install dependencies
pnpm install

# Build packages
pnpm build
```

### Run the App

```bash
# Start the 大厂打工 app
pnpm app:bigtech

# Or navigate to the app directory
cd apps/bigtech-worker
pnpm start
```

## Creating a New Theme

1. Create a new theme package in `packages/themes/`:

```typescript
// packages/themes/my-theme/src/index.ts
import { ThemeConfig } from '@theme-card-games/core';

export const myTheme: ThemeConfig = {
  id: 'my-theme',
  name: '我的主题',
  // ... theme configuration
};
```

2. Create a new app in `apps/`:

```bash
cd apps
npx create-expo-app my-theme-app
```

3. Import your theme and use the shared UI components:

```typescript
import { GameEngine } from '@theme-card-games/core';
import { GameBoard, ThemeProvider } from '@theme-card-games/ui';
import { myTheme } from '@theme-card-games/theme-my-theme';
```

## Core Concepts

### Card System
- **Card**: Basic unit with type, effects, and metadata
- **Deck**: Collection of cards with shuffle/draw operations
- **Hand**: Player's current cards with play/discard actions

### Game State
- **GameState**: Central state container
- **PlayerState**: Individual player data (stats, resources, cards)
- **EventBus**: Pub/sub system for game events

### Theme Configuration
Each theme defines:
- Card definitions (types, effects, visuals)
- Stat and resource definitions
- Win/lose conditions
- UI theming (colors, fonts)
- Localization strings

## Building for iOS

```bash
cd apps/bigtech-worker

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

## Tech Stack

- **Framework**: Expo SDK 51 / React Native 0.74
- **Language**: TypeScript
- **State Management**: Custom game engine
- **UI**: React Native components with theme support
- **Build**: EAS Build for iOS deployment
- **Package Management**: pnpm workspaces

## License

MIT
