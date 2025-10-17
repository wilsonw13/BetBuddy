# BetBuddy - Quick Setup Guide

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure Gemini AI API Key:**

Open `src/services/geminiService.ts` and replace the placeholder:

```typescript
const API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
```

Get your free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

3. **Start the app:**
```bash
npm start
```

4. **Run on your device:**
- **iOS**: Press `i` in the terminal (requires Mac with Xcode)
- **Android**: Press `a` in the terminal (requires Android Studio)
- **Physical Device**: Scan the QR code with the Expo Go app

## Features Overview

### 1. Bets Tab
- View all active bets
- Create new bets with the floating + button
- Use "AI Suggest" to get personalized bet ideas from Gemini
- Set bet parameters:
  - Activity (what you're betting on)
  - Opponent (friend to bet with)
  - Frequency (how often to complete the activity)
  - Proof type (Live Photo or Location)
  - Duration (how long the bet lasts)
  - Points to stake

### 2. Leaderboard Tab
- See rankings of all friends
- Weighted scoring (60% success rate + 40% total wins)
- Four rank levels:
  - Beginner (gray)
  - Intermediate (bronze)
  - Advanced (silver)
  - Legendary (gold)
- Filter by friend groups
- Top 3 get medal icons

### 3. Profile Tab
- View your stats (points, success rate, wins, total bets)
- Your current rank level
- Achievement badges
- Friend groups list
- **Points Shop** - Redeem points for:
  - **Pranks on opponents:**
    - Draw on their banner (200 pts)
    - Change app to Chinese (150 pts)
    - Change their app icon (300 pts)
    - Customize their loading screen (250 pts)
  - **Cosmetics for yourself:**
    - Profile border (500 pts)
    - Custom badge (400 pts)

### 4. AI Features

#### Bet Suggestions
When creating a new bet, tap "AI Suggest" to get 5 personalized bet ideas based on:
- Your interests
- Your past betting history
- Achievable and measurable activities

#### Photo Verification
When uploading proof for a bet, the AI analyzes the photo for:
- Screenshots from the internet
- Old/reused photos
- Photo manipulation
- Activity matching bet requirements

The AI provides:
- Suspicious/Not suspicious flag
- Confidence level (0-100%)
- Reasoning for the decision
- Suggestions for improvement

All photos must still be verified by your opponent, but AI flags suspicious ones automatically.

## Testing the App

Since this uses mock data, you can test all features immediately:

1. **Bets**: The app comes with one sample bet. Create more to see the list grow.

2. **Leaderboard**: Pre-populated with 4 mock users showing different rank levels.

3. **Profile**: View your stats and open the Points Shop to see redeemable items.

4. **AI Features**:
   - To test bet suggestions, you need to add your Gemini API key
   - To test photo verification, you need to add your API key and use the PhotoVerificationScreen component

## Project Structure

```
betbuddy/
├── App.tsx                           # Main app with navigation
├── src/
│   ├── screens/
│   │   ├── BetsScreen.tsx           # Bets list + create bet modal + AI suggestions
│   │   ├── LeaderboardScreen.tsx    # Rankings with weighted scoring
│   │   └── ProfileScreen.tsx        # Profile + stats + points shop
│   ├── components/
│   │   └── PhotoVerificationScreen.tsx  # Photo upload + AI verification
│   ├── services/
│   │   └── geminiService.ts         # Gemini AI integration
│   └── types/
│       └── index.ts                 # TypeScript types
├── package.json                      # Dependencies
└── app.json                         # Expo config
```

## Next Steps

### To make this production-ready:

1. **Backend Integration**
   - Set up Firebase, Supabase, or custom backend
   - Implement user authentication
   - Store bets, users, and proofs in database
   - Add real-time updates

2. **Push Notifications**
   - Bet reminders
   - Proof verification requests
   - Points earned/redeemed
   - Challenge notifications

3. **Social Features**
   - Friend requests and management
   - Friend groups creation/editing
   - In-app chat
   - Activity feed

4. **Advanced Features**
   - Live photo capture (with metadata verification)
   - Location tracking with geofencing
   - Bet history and analytics
   - Custom prank implementations
   - Social sharing

5. **Polish**
   - Add actual app icons and splash screen
   - Create placeholder images for empty states
   - Add animations and transitions
   - Implement error boundaries
   - Add comprehensive testing

## Troubleshooting

### "Cannot find module" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Metro bundler cache issues
```bash
npm start -- --clear
```

### Expo Go app not connecting
- Make sure your phone and computer are on the same WiFi network
- Try restarting the Expo dev server
- Check firewall settings

### Gemini API errors
- Verify your API key is correct
- Check you have quota remaining
- Ensure you're using a supported region (currently US only)

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [Gemini AI Documentation](https://ai.google.dev/docs)
- [React Native Documentation](https://reactnative.dev)

## Support

For issues or questions, check:
- README.md for detailed documentation
- GitHub issues (if applicable)
- Expo forums for platform-specific questions
