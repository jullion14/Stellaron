# Stellaron

A Honkai: Star Rail theory-crafting and build-planning web application focused on clean UI, accurate stat calculations, and future team simulation support.

![Stellaron Banner](./public/banner.png)

---

# Overview

Stellaron is a personal full-stack-style frontend project built to explore:
- Character stat calculations
- Trace systems
- Relic optimization
- Damage simulation
- Team composition theorycrafting

The project uses static game data from StarRailRes while preparing for future Mihomo API integration for real player UID imports.

---

# Features

## Current Features

### Character Browser
- Browse all playable characters
- Filter by:
  - Element
  - Path
  - Rarity
  - Name search

### Character Detail Page
- Dynamic level scaling (Lv.1–80)
- Live stat calculations
- Ascension tier handling
- Skill descriptions with parsed multipliers
- Skill level sliders
- Full skill value tables
- Eidolon display
- Major traces
- Aggregated minor trace stats

### UI / UX
- Dark sci-fi inspired theme
- Element-colored highlights
- Responsive layouts
- Smooth panel/card styling
- HSR-inspired visual hierarchy

---

# Planned Features

## Phase 3 — Relic System
- Relic input UI
- Main stat + substat support
- Set bonuses
- Real-time stat aggregation

## Phase 4 — Damage Calculator
- Damage formula engine
- Buff/debuff handling
- Break calculations
- Turn simulation

## Phase 5 — Team Builder
- Team synergy calculations
- Mihomo UID import
- Buff timeline simulation
- Rotation planning

---

# Tech Stack

| Technology | Purpose |
|---|---|
| React + TypeScript | Frontend framework |
| Vite | Build tooling |
| Zustand | State management |
| TanStack React Query | Data fetching + caching |
| React Router | Routing |
| Tailwind CSS v4 | Styling |
| StarRailRes | Static game data |
| Mihomo API | Future player import support |

---

# Project Structure

```txt
src/
├── api/
│   ├── staticData.ts
│   ├── characterMapper.ts
│   └── enka.ts
│
├── components/
│   ├── characters/
│   └── ui/
│
├── pages/
│   ├── Home.tsx
│   ├── Characters.tsx
│   ├── CharacterDetail.tsx
│   ├── Builder.tsx
│   └── Team.tsx
│
├── store/
│   └── characterStore.ts
│
├── types/
│   └── index.ts
│
└── utils/
    ├── constants.ts
    ├── levelUtils.ts
    └── skillUtils.ts
```

---

# Data Sources

## Static Data — StarRailRes

Used for:
- character info
- skills
- traces
- eidolons
- promotion values

Repository:
https://github.com/Mar-7th/StarRailRes

Files used:
- `characters.json`
- `character_promotions.json`
- `character_skills.json`
- `character_skill_trees.json`
- `character_ranks.json`

---

## Dynamic Data — Mihomo API

Planned usage:
- UID imports
- equipped relics
- light cones
- player-owned characters

API:
https://api.mihomo.me

---

# Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/stellaron.git
```

## Enter Project Directory

```bash
cd stellaron
```

## Install Dependencies

```bash
npm install
```

## Start Development Server

```bash
npm run dev
```

---

# Build Production

```bash
npm run build
```

---

# Future Goals

- Full relic optimizer
- Team DPS simulation
- Speed tuning assistant
- Rotation planner
- Damage breakdown visualizer
- Mobile-responsive builder layout
- Save/share builds
- Multi-language support

---

# Screenshots

## Character Page

_Add screenshot here_

## Skills Section

_Add screenshot here_

## Trace System

_Add screenshot here_

---

# License

This project is for educational and personal portfolio purposes.

Honkai: Star Rail and related assets belong to HoYoverse.

---

# Credits

## Data Sources
- StarRailRes
- Mihomo API

---

# Author

Developed by Julian Lim.
