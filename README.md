# FunMap

A map-based social app where users share real-time "fun" status at their location. The app visualizes live activity as a green heatmap — open the map and see where people are having fun right now.

## What It Does

- Toggle "Having Fun" at your current location
- Your status appears as a green heat blob on the map for everyone to see
- Blobs grow brighter and larger as more people mark fun nearby (🔥 for hotspots)
- Fun auto-expires after 8 hours or when you turn it off

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo) + TypeScript |
| Backend / DB | Supabase (PostgreSQL + Realtime + Auth) |
| Map | Google Maps (`react-native-maps`) |
| Location | `expo-location` |
| Deployment | EAS Build (Android APK) |

## Getting Started

### Prerequisites

Make sure you have all required tools installed and configured:

1. **Dev environment** — see [docs/SETUP.md](docs/SETUP.md)
2. **Supabase project** — see [docs/SUPABASE.md](docs/SUPABASE.md)
3. **Google Maps API key** — see [docs/GOOGLE_MAPS.md](docs/GOOGLE_MAPS.md)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/gilfe555/funmap.git
cd funmap

# Install dependencies
npm install

# Copy environment template and fill in your keys
cp .env.example .env
# Edit .env with your Supabase URL, anon key, and Google Maps key

# Start the dev server
npx expo start
```

Then:
- **Phone**: Install [Expo Go](https://expo.dev/go) and scan the QR code
- **Android Emulator**: Press `a` in the terminal (requires Android Studio)

## Project Structure

```
funmap/
├── app/                  # Screens (Expo Router)
│   ├── (auth)/           # Login & Sign Up
│   ├── (tabs)/           # Tab screens: Map, Groups, Alerts, Settings
│   ├── group/            # Group detail, create, invite
│   └── event/            # Event detail, create
├── src/
│   ├── components/       # UI components (map, groups, notifications)
│   ├── hooks/            # React hooks (heatmap, groups, events, notifications)
│   ├── lib/              # Supabase client
│   ├── types/            # TypeScript types
│   ├── utils/            # Clustering algorithm
│   └── constants/        # Colors, config values
├── supabase/migrations/  # SQL schema files (001–004)
├── scripts/              # Dev utilities (seed data)
└── docs/                 # Setup and architecture guides
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the branching strategy and PR workflow.

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/SETUP.md](docs/SETUP.md) | Dev environment setup |
| [docs/SUPABASE.md](docs/SUPABASE.md) | Supabase project + schema setup |
| [docs/GOOGLE_MAPS.md](docs/GOOGLE_MAPS.md) | Google Maps API key setup |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Data flow and heatmap logic |
| [docs/TESTING.md](docs/TESTING.md) | How to test and preview the app |
