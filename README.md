# BetBuddy

A React Native betting app where friends can challenge each other with accountability bets, track progress with AI-powered photo verification, and compete on leaderboards.

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
