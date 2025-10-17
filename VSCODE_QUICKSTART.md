# VSCode Quick Start Guide for iOS Development

## One-Time Setup

1. **Install VSCode Extensions** (VSCode will prompt you automatically):
   - React Native Tools
   - Expo Tools
   - ESLint
   - Prettier

2. **Install Dependencies**:
```bash
npm install
```

3. **Add Gemini API Key**:
   - Open `src/services/geminiService.ts`
   - Replace `YOUR_GEMINI_API_KEY_HERE` with your key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Running the App (3 Ways)

### Method 1: Simple Terminal (Recommended for Expo Managed)
```bash
npm start
# Press 'i' when Metro bundler is ready
```

### Method 2: VSCode Tasks (Keyboard Shortcuts)
- Press `Cmd+Shift+B` → Select "Run iOS"
- Or `Cmd+Shift+P` → Type "Tasks: Run Task" → Select "Run iOS"

Available tasks:
- **Start Expo** - Start Metro bundler
- **Run iOS** - Build and run on iOS simulator (default build task)
- **Run Android** - Build and run on Android
- **Clear Cache and Start** - Clear Metro cache and restart
- **TypeScript Check** - Check for type errors
- **Install Dependencies** - Run npm install

### Method 3: VSCode Debug Panel (For Debugging)
1. Click Debug icon in sidebar (or `Cmd+Shift+D`)
2. Select "Debug iOS (Expo)" from dropdown
3. Press F5 or click green play button

This allows you to:
- Set breakpoints in your code
- Inspect variables
- Step through code execution
- View console logs

## Quick Commands

| Action | Command |
|--------|---------|
| Start dev server | `npm start` |
| Run iOS simulator | `npm run ios` |
| Run Android emulator | `npm run android` |
| Clear cache | `npm start -- --clear` |
| Install dependencies | `npm install` |
| Type check | `npx tsc --noEmit` |

## VSCode Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+B` | Run build task (Run iOS) |
| `Cmd+Shift+P` | Command palette |
| `F5` | Start debugging |
| `Cmd+Shift+D` | Open debug panel |
| `Cmd+`` | Toggle terminal |
| `Cmd+Shift+F` | Search across files |

## Project Structure in VSCode

```
betbuddy/
├── .vscode/                 # VSCode configuration (auto-setup)
│   ├── tasks.json          # Build and run tasks
│   ├── launch.json         # Debug configurations
│   ├── settings.json       # Editor settings
│   └── extensions.json     # Recommended extensions
├── src/
│   ├── screens/            # Main app screens
│   ├── components/         # Reusable components
│   ├── services/           # Gemini AI service
│   └── types/              # TypeScript types
├── App.tsx                 # App entry point
└── package.json            # Dependencies
```

## Debugging in VSCode

### Set Breakpoints:
1. Click in the left margin (gutter) of any line of code
2. Red dot appears = breakpoint set
3. Run "Debug iOS (Expo)" (F5)
4. App pauses when breakpoint is hit

### Debug Console:
- View variables, call stack, breakpoints
- Execute code in debug console
- View console.log output

### Example:
```typescript
// Set breakpoint on this line
const handleAddBet = () => {
  console.log('Creating bet:', newBet); // Inspect newBet here
  // ... rest of code
};
```

## Troubleshooting

### "Metro bundler already running"
```bash
# Kill existing process
killall node
# Or find and kill specific process
lsof -ti:8081 | xargs kill -9
npm start
```

### "No simulator found"
```bash
# Check available simulators
xcrun simctl list devices

# Open Simulator app
open -a Simulator

# Then run iOS again
npm run ios
```

### VSCode not recognizing TypeScript
1. `Cmd+Shift+P`
2. Type "TypeScript: Select TypeScript Version"
3. Choose "Use Workspace Version"

### Extensions not working
1. Reload VSCode window: `Cmd+Shift+P` → "Reload Window"
2. Or restart VSCode completely

## Comparing to Xcode

| Feature | Xcode | VSCode + Expo |
|---------|-------|---------------|
| **Build & Run** | Click Run button | `npm run ios` or F5 |
| **Simulator** | Built-in | Uses Xcode's simulator |
| **Hot Reload** | Limited | ✅ Fast Refresh |
| **JS Debugging** | ❌ | ✅ Excellent |
| **Native Debugging** | ✅ Full | Limited |
| **CocoaPods** | Automatic | Manual (if needed) |
| **File Size** | ~15GB | ~500MB |
| **Speed** | Similar | Similar |

## When to Use Xcode vs VSCode

**Use VSCode for:**
- React Native / JavaScript development
- Quick iterations and hot reload
- Debugging JS logic
- Most day-to-day development

**Use Xcode for:**
- Native iOS debugging
- Viewing native crash logs
- Modifying iOS-specific settings
- Interface Builder (storyboards)
- Provisioning profiles / certificates

## Current Workflow Recommendation

Since BetBuddy uses Expo managed workflow:

```bash
# Terminal in VSCode
npm start

# Wait for QR code and options
# Press 'i' for iOS simulator

# Make changes to code → auto-refreshes
# Set breakpoints in VSCode for debugging
```

**You don't need Xcode or CocoaPods unless:**
- You add custom native modules
- You need to customize native iOS code
- You want to build for App Store

## Next Steps

1. **Start developing:**
   ```bash
   npm start
   ```

2. **Make changes** to any `.tsx` file and see instant updates

3. **Add breakpoints** in VSCode to debug issues

4. **Use Expo Go app** on your physical iPhone for testing:
   - Install Expo Go from App Store
   - Scan QR code from terminal
   - Test on real device instantly

## Resources

- [React Native Tools Extension](https://marketplace.visualstudio.com/items?itemName=msjsdiag.vscode-react-native)
- [Expo Documentation](https://docs.expo.dev)
- [VSCode Debugging Guide](https://code.visualstudio.com/docs/editor/debugging)
