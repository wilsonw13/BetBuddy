# BetBuddy

A React Native betting app where friends can challenge each other with accountability bets, track progress with AI-powered photo verification, and compete on leaderboards.

## Setting Up Development (Windows)

https://jsonobject.hashnode.dev/setting-up-android-development-environment-on-wsl-2

1. Install [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install)
   1. Choose any distro
2. Install [Docker Desktop](https://docs.docker.com/desktop/features/wsl/)
3. Install Node
4. Install pnpm
   1. `npm i -g pnpm@latest`

### Inside of WSL

1. Install OpenJDK17 (Java)
2. `mkdir -p ~/Android/sdk`
3. Download and Set Up Command-Line Tools

```bash
cd /tmp
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-*.zip

mkdir -p ~/Android/sdk/cmdline-tools
mv cmdline-tools ~/Android/sdk/cmdline-tools/latest
```

4. Install SDK Packages (Platform Tools and Platforms)

```bash
cd ~/Android/sdk/cmdline-tools/latest/bin
./sdkmanager --licenses
./sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"
```

5. Set Environment Variables in `.bashrc`

```
# Android SDK for Build Tools (Gradle)
export ANDROID_HOME="$HOME/Android/sdk"
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/build-tools/35.0.0 # Adjust if you installed a different build-tools version

# ADB Bridge to Windows Host
export WSL_HOST=$(tail -1 /etc/resolv.conf | cut -d' ' -f2)
export ADB_SERVER_SOCKET=tcp:$WSL_HOST:5037
```

6. Restart terminal or activate changes: `source ~/.bashrc`

## Running Development (Windows)

On Windows:

```ps
adb kill-server
adb -a nodaemon server start
```

## Running on Development (General)

1. Install pnpm packages

```bash
pnpm install
```

2. Start the postgres docker container

```bash
docker compose up -d
```

3. Start the backend

```bash
cd backend
pnpm dev
```

4. Start the frontend

```bash
pnpm start
```

## Features

### Bottom Navigation

- **Bets**: View and create bets with friends
- **Leaderboard**: See rankings based on weighted success rate and total wins
- **Profile**: View stats, achievements, and redeem points

### Bets System

- Create bets with custom activities (e.g., "Go to gym 3x a week")
- Choose opponent from friends
- Set frequency (1x-4x/week, daily, 1x-2x/month)
- Select proof type (Live Photo or Location)
- Stake points on each bet
- Track bet duration (typically 1 month)

### AI Integration

1. **Bet Suggestions**: Gemini AI suggests personalized bets based on interests
2. **Photo Verification**: AI analyzes submitted photos for suspicious content
   - Detects screenshots from internet
   - Identifies old/reused photos
   - Checks for photo manipulation
   - Verifies activity matches bet requirements

### Leaderboard

- Weighted ranking system (60% success rate, 40% total successful bets)
- Rankings: Beginner, Intermediate, Advanced, Legendary
- Filter by friend groups
- Medal icons for top 3 positions

### Profile & Points

- Profile picture with customizable banner
- Quick stats: success rate, total bets, wins, points
- Achievement badges
- Multiple friend group support

### Points Redemption Shop

Redeem points for pranks and cosmetics:

- **Draw on Banner** (200 pts): Draw on opponent's banner for 24h
- **Chinese Mode** (150 pts): Change opponent's app to Chinese for 12h
- **Icon Swap** (300 pts): Change opponent's app icon for 48h
- **Loading Screen** (250 pts): Customize opponent's loading screen for 24h
- **Profile Border** (500 pts): Add special border to profile
- **Custom Badge** (400 pts): Create custom achievement badge

## Setup Instructions

### Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Studio (for Android)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up Gemini AI API key:
   - Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Open `src/services/geminiService.ts`
   - Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key

3. Start the development server:

```bash
npm start
```

4. Run on your device:
   - iOS: Press `i` or scan QR code with Expo Go app
   - Android: Press `a` or scan QR code with Expo Go app
   - Web: Press `w`

## Project Structure

```
betbuddy/
├── App.tsx                      # Main app with navigation
├── src/
│   ├── screens/
│   │   ├── BetsScreen.tsx       # Bets list and creation
│   │   ├── LeaderboardScreen.tsx # Rankings and leaderboard
│   │   └── ProfileScreen.tsx     # User profile and shop
│   ├── services/
│   │   └── geminiService.ts     # Gemini AI integration
│   └── types/
│       └── index.ts             # TypeScript type definitions
├── app.json                     # Expo configuration
├── package.json                 # Dependencies
└── tsconfig.json               # TypeScript configuration
```

## Technology Stack

- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform and tooling
- **TypeScript**: Type-safe development
- **React Navigation**: Bottom tab navigation
- **Gemini AI**: Photo verification and bet suggestions
- **Expo Image Picker**: Photo uploads
- **Expo Location**: Location-based proof

## Key Components

### BetsScreen

- Displays active bets in card format
- Floating action button to create new bets
- Modal with form for bet creation
- Visual indicators for proof type and days remaining

### LeaderboardScreen

- Sortable friend rankings
- Visual rank badges (Beginner → Legendary)
- Medal icons for top performers
- Success rate and bet statistics

### ProfileScreen

- Banner with profile picture
- Rank badge overlay
- Stats cards (points, success rate, wins, total bets)
- Points redemption shop modal
- Friend groups list
- Achievement badges grid

### Gemini AI Service

- `verifyBetPhoto()`: Analyzes photos for authenticity
- `suggestBets()`: Generates personalized bet ideas
- Returns structured JSON responses

## Next Steps

### Backend Integration

Currently uses mock data. Implement:

- User authentication (Firebase, Auth0, etc.)
- Database (Firebase Firestore, Supabase, etc.)
- Real-time updates
- Push notifications for bet reminders

### Additional Features

- In-app camera for live photos
- Location tracking and geofencing
- Chat between bet participants
- Bet history and analytics
- Social sharing
- Custom friend groups management

### Production Setup

1. Configure environment variables
2. Set up backend API
3. Enable push notifications
4. Configure app icons and splash screens
5. Set up iOS/Android builds
6. Submit to App Store/Play Store

## Environment Variables

Create a `.env` file:

```
GEMINI_API_KEY=your_api_key_here
BACKEND_API_URL=your_backend_url
```

## License

MIT
