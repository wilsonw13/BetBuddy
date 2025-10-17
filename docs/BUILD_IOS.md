# Building for iOS - VSCode Guide

## Option 1: Managed Expo Workflow (Recommended - No Xcode needed)

This is the easiest way and doesn't require CocoaPods or Xcode projects:

```bash
# Start development server
npm start

# Press 'i' to open in iOS simulator
# Or run directly:
npm run ios
```

**Advantages:**

- No native code management
- Automatic dependency updates
- OTA updates
- Faster development

## Option 2: Bare Workflow (For Custom Native Code)

If you need to add custom native modules or modify iOS code:

### Step 1: Prebuild (Generates native folders)

```bash
# This creates ios/ and android/ folders with native code
npx expo prebuild
```

This will:

- Create `ios/` folder with Xcode project
- Auto-configure CocoaPods
- Set up native dependencies

### Step 2: Install CocoaPods Dependencies

```bash
cd ios
pod install
cd ..
```

### Step 3: Build Options

**A. Using VSCode Terminal (Recommended):**

```bash
# Run on iOS simulator
npx expo run:ios

# Run on specific simulator
npx expo run:ios --simulator="iPhone 15 Pro"

# Run on physical device
npx expo run:ios --device
```

**B. Using Xcode (If you prefer GUI):**

```bash
# Open the workspace in Xcode
open ios/betbuddy.xcworkspace
```

Then in Xcode:

1. Select simulator/device from top bar
2. Press ⌘R or click Run button

### Step 4: Development Workflow

```bash
# Start Metro bundler in one terminal
npm start

# In another terminal, rebuild and run
npx expo run:ios
```

## Option 3: VSCode Extensions for Better iOS Development

Install these VSCode extensions:

1. **React Native Tools** (Microsoft)
   - Debug React Native apps
   - IntelliSense for React Native
   - Command palette shortcuts

2. **Expo Tools**
   - Expo project management
   - Quick commands for running on devices

### Using React Native Tools Extension:

1. Install: `ext install msjsdiag.vscode-react-native`
2. Press `Cmd+Shift+P` → "React Native: Run iOS"
3. Select simulator from dropdown

## Quick Command Reference

```bash
# List available simulators
xcrun simctl list devices

# Boot specific simulator
xcrun simctl boot "iPhone 15 Pro"

# Install app on running simulator
xcrun simctl install booted path/to/YourApp.app

# Clean build
cd ios
rm -rf build
pod deintegrate
pod install
cd ..
npm start -- --reset-cache
```

## VSCode Tasks Configuration

Create `.vscode/tasks.json` for quick builds:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Run iOS Simulator",
      "type": "shell",
      "command": "npm run ios",
      "problemMatcher": [],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    },
    {
      "label": "Start Metro Bundler",
      "type": "shell",
      "command": "npm start",
      "isBackground": true,
      "problemMatcher": []
    },
    {
      "label": "Clean iOS Build",
      "type": "shell",
      "command": "cd ios && rm -rf build && pod install && cd ..",
      "problemMatcher": []
    }
  ]
}
```

Then use `Cmd+Shift+B` to run tasks.

## VSCode Launch Configuration

Create `.vscode/launch.json` for debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug iOS",
      "type": "reactnative",
      "request": "launch",
      "platform": "ios"
    },
    {
      "name": "Attach to packager",
      "type": "reactnative",
      "request": "attach"
    }
  ]
}
```

## Troubleshooting

### "No simulators available"

```bash
# Check if Xcode Command Line Tools are set
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### CocoaPods errors

```bash
# Update CocoaPods
sudo gem install cocoapods

# Clean and reinstall
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
```

### Metro bundler issues

```bash
# Clear all caches
npm start -- --reset-cache
rm -rf node_modules
npm install
```

### Build errors after adding dependencies

```bash
# For managed workflow
npm install

# For bare workflow
npm install
cd ios && pod install && cd ..
npx expo run:ios
```

## Comparison: Xcode vs VSCode

| Feature           | Xcode     | VSCode       |
| ----------------- | --------- | ------------ |
| Native debugging  | ✅ Better | ⚠️ Limited   |
| JS debugging      | ❌ No     | ✅ Excellent |
| Build speed       | ✅ Faster | ⚠️ Same      |
| Interface Builder | ✅ Yes    | ❌ No        |
| Terminal-based    | ❌ No     | ✅ Yes       |
| Lighter weight    | ❌ Heavy  | ✅ Light     |

## Recommended Workflow

**For most development (Expo managed):**

```bash
# Terminal 1: Metro bundler
npm start

# Press 'i' when ready
```

**When you need native modules:**

```bash
npx expo prebuild
cd ios && pod install && cd ..
npx expo run:ios
```

**For debugging:**

- Use VSCode for JS debugging (breakpoints, console)
- Use Xcode for native iOS debugging (crashes, native logs)

## Current Project Status

Your BetBuddy app is currently in **managed Expo workflow**, so you can:

```bash
npm install
npm start
# Press 'i' for iOS simulator
```

No CocoaPods or Xcode project needed unless you want to add custom native code!
