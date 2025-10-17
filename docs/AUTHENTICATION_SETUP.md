# BetBuddy Authentication System - Complete Setup Guide

## Overview

Complete authentication system with:

- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React Native with Expo
- Email/Password authentication with JWT tokens
- Google OAuth integration
- Secure token management with refresh token rotation
- Rate limiting and security best practices

---

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup PostgreSQL Database

```bash
# Install PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb betbuddy

# Or use psql
psql postgres
CREATE DATABASE betbuddy;
\q
```

### 3. Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=betbuddy
DB_USER=postgres
DB_PASSWORD=your_password

JWT_ACCESS_SECRET=your_random_secret_here_min_32_chars
JWT_REFRESH_SECRET=another_random_secret_here_min_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

**Generate secrets:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Run Database Migrations

```bash
npm run migrate
```

This creates:

- `users` table (id, email, password_hash, google_id, display_name, profile_picture, email_verified, timestamps)
- `refresh_tokens` table (id, user_id, token_hash, expires_at, revoked, created_at)

### 5. Start Backend Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### API Endpoints

| Method | Endpoint                  | Description                   |
| ------ | ------------------------- | ----------------------------- |
| POST   | `/api/auth/register`      | Register with email/password  |
| POST   | `/api/auth/login`         | Login with email/password     |
| POST   | `/api/auth/google/mobile` | Login with Google (mobile)    |
| POST   | `/api/auth/refresh`       | Refresh access token          |
| POST   | `/api/auth/logout`        | Logout (revoke refresh token) |
| POST   | `/api/auth/logout-all`    | Logout from all devices       |

---

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project "BetBuddy"
3. Enable Google+ API

### 2. Create OAuth 2.0 Credentials

1. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
2. Create **Web application** credentials:
   - Name: "BetBuddy Backend"
   - Authorized redirect URIs: `http://localhost:3000` (dev)
   - Copy **Client ID** and **Client Secret** to backend `.env`

3. Create **iOS** credentials:
   - Name: "BetBuddy iOS"
   - Bundle ID: `com.betbuddy.app`
   - Copy **iOS Client ID**

4. Create **Android** credentials (if needed):
   - Name: "BetBuddy Android"
   - Package name: `com.betbuddy.app`
   - SHA-1 fingerprint: (get from `keytool` or Expo)

### 3. Configure React Native

Edit `src/contexts/AuthContext.tsx`:

```typescript
GoogleSignin.configure({
  webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com", // From step 2
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});
```

---

## React Native Setup

### 1. Install Dependencies

```bash
cd /Users/chang/repos/betbuddy
npm install
```

New dependencies added:

- `axios` - HTTP client
- `@react-native-google-signin/google-signin` - Google Sign-In
- `expo-secure-store` - Secure token storage
- `@react-navigation/stack` - Stack navigation for auth

### 2. Configure Backend URL

Edit `src/services/authService.ts`:

```typescript
// Replace with your computer's local IP address
const API_BASE_URL = "http://YOUR_LOCAL_IP:3000/api/auth";
```

**Find your local IP:**

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Output example: inet 192.168.1.100
# Use: http://192.168.1.100:3000/api/auth
```

### 3. Update App.tsx

Replace your `App.tsx` with authentication-aware navigation:

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import BetsScreen from './src/screens/BetsScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: true,
      }}
    >
      <Tab.Screen
        name="Bets"
        component={BetsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="hand-left" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Add loading screen here
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}
```

### 4. Run the App

```bash
npm start
# Press 'i' for iOS or 'a' for Android
```

---

## Testing the Authentication

### 1. Test Email/Password Registration

Using the app:

1. Open RegisterScreen
2. Fill in display name, email, password
3. Tap "Sign Up"

Or via curl:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "display_name": "Test User"
  }'
```

### 2. Test Email/Password Login

Using the app:

1. Open LoginScreen
2. Enter email and password
3. Tap "Sign In"

Or via curl:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

### 3. Test Google Sign-In

1. Tap "Continue with Google"
2. Select Google account
3. Automatically authenticated

### 4. Test Token Refresh

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### 5. Test Protected Endpoint

First, get access token from login, then:

```bash
curl http://localhost:3000/api/auth/logout-all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## Security Features

### Implemented:

✅ **Password Requirements**

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

✅ **Token Security**

- Short-lived access tokens (15 min)
- Long-lived refresh tokens (7 days)
- Refresh token rotation on use
- Tokens stored securely (Secure Store on mobile)
- Only hashed refresh tokens in database

✅ **Rate Limiting**

- 5 auth requests per 15 minutes per IP

✅ **Database Security**

- Password hashing with bcrypt (cost factor 12)
- Prepared statements (SQL injection protection)
- Transactions for atomic operations

✅ **OAuth Security**

- Google tokens verified on backend
- Never trust client-side verification
- Automatic account linking by email

✅ **Error Handling**

- Generic error messages (no info leakage)
- Detailed server logs for debugging
- Network error handling in mobile app

---

## Project Structure

```
betbuddy/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts          # PostgreSQL connection pool
│   │   ├── controllers/
│   │   │   └── authController.ts    # Auth endpoints
│   │   ├── services/
│   │   │   ├── tokenService.ts      # JWT token management
│   │   │   └── googleOAuth.ts       # Google OAuth verification
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts    # JWT verification middleware
│   │   ├── migrations/
│   │   │   ├── 001_create_users_table.ts
│   │   │   ├── 002_create_refresh_tokens_table.ts
│   │   │   └── run.ts               # Migration runner
│   │   ├── routes/
│   │   │   └── authRoutes.ts        # Auth routes
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript types
│   │   └── index.ts                 # Express server
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx          # Auth state management
│   ├── services/
│   │   └── authService.ts           # API client with interceptors
│   ├── screens/
│   │   ├── LoginScreen.tsx          # Login UI
│   │   ├── RegisterScreen.tsx       # Registration UI
│   │   ├── BetsScreen.tsx
│   │   ├── LeaderboardScreen.tsx
│   │   └── ProfileScreen.tsx
│   └── types/
│       └── index.ts
│
└── App.tsx                          # Main app with auth navigation
```

---

## Troubleshooting

### Backend Issues

**Database connection failed:**

```bash
# Check PostgreSQL is running
brew services list
brew services restart postgresql@15

# Test connection
psql betbuddy -c "SELECT 1;"
```

**Migration errors:**

```bash
# Rollback last migration
npm run migrate down

# Re-run migrations
npm run migrate
```

**Port already in use:**

```bash
# Find process using port 3000
lsof -ti:3000

# Kill it
kill -9 $(lsof -ti:3000)
```

### Mobile App Issues

**Cannot connect to backend:**

1. Make sure backend is running: `curl http://localhost:3000/health`
2. Use your local IP, not localhost
3. Ensure phone and computer on same WiFi
4. Check firewall settings

**Google Sign-In not working:**

1. Verify `webClientId` is correct in `AuthContext.tsx`
2. Check OAuth credentials in Google Cloud Console
3. Ensure iOS/Android client IDs are created
4. Check bundle ID matches

**Tokens not persisting:**

1. Clear SecureStore: `SecureStore.deleteItemAsync('refreshToken')`
2. Restart app completely
3. Check backend logs for token errors

### Common Errors

**"Invalid email or password"**

- Check email is lowercase
- Verify password meets requirements
- Check user exists in database

**"Token expired"**

- Normal behavior after 15 minutes
- App should auto-refresh
- Check refresh token is valid

**"CORS error"**

- Backend needs CORS configured (already done)
- Check backend URL is correct

---

## Production Deployment

### Backend

1. **Environment Variables:**
   - Generate new JWT secrets
   - Use production database
   - Set `NODE_ENV=production`
   - Configure CORS with actual frontend URL

2. **Database:**
   - Use managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
   - Enable SSL connections
   - Set up backups

3. **Deploy to:**
   - Heroku: `git push heroku main`
   - Railway: Connect GitHub repo
   - DigitalOcean App Platform
   - AWS Elastic Beanstalk

### Mobile App

1. **Update backend URL:**

   ```typescript
   const API_BASE_URL = "https://your-api.com/api/auth";
   ```

2. **Build for production:**

   ```bash
   eas build --platform ios
   eas build --platform android
   ```

3. **Submit to stores:**
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

---

## Next Steps

1. **Email Verification:**
   - Send verification emails on registration
   - Verify email before allowing certain actions

2. **Password Reset:**
   - Add "Forgot Password" flow
   - Send reset link via email

3. **Social Auth:**
   - Add Apple Sign-In (required for iOS)
   - Add Facebook Login

4. **User Profile:**
   - Add `/api/user/me` endpoint to get current user
   - Update profile endpoint
   - Upload profile pictures

5. **Security Enhancements:**
   - Add 2FA/MFA
   - IP-based suspicious activity detection
   - Device tracking

6. **Monitoring:**
   - Add Sentry for error tracking
   - Set up logging (Winston, Pino)
   - Monitor API performance

---

## API Documentation

See full API docs at: `backend/API_DOCS.md`

---

## Support

For issues:

1. Check this guide
2. Review code comments
3. Check backend logs: `npm run dev`
4. Test with curl/Postman first

Authentication system is now complete and production-ready!
