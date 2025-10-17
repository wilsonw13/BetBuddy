# BetBuddy GraphQL Authentication System

Complete authentication system using **GraphQL** with Apollo Server and Apollo Client.

## Architecture

- **Backend**: Apollo Server + PostgreSQL
- **Frontend**: React Native with Apollo Client
- GraphQL mutations for all auth operations
- JWT tokens with automatic refresh
- Google OAuth integration
- Secure token storage

---

## Backend Setup (GraphQL)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` (same as before - database, JWT secrets, Google OAuth)

### 3. Run Migrations

```bash
npm run migrate
```

### 4. Start GraphQL Server

```bash
npm run dev
```

Server runs at `http://localhost:3000/graphql`
GraphQL Playground available at same URL

---

## GraphQL API

### Schema

```graphql
type User {
  id: ID!
  email: String!
  displayName: String!
  profilePicture: String
  emailVerified: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  lastLogin: DateTime
}

type AuthPayload {
  user: User!
  accessToken: String!
  refreshToken: String!
}

type Mutation {
  register(input: RegisterInput!): AuthPayload!
  login(input: LoginInput!): AuthPayload!
  googleAuth(input: GoogleAuthInput!): AuthPayload!
  refreshToken(input: RefreshTokenInput!): TokenPayload!
  logout(refreshToken: String!): SuccessResponse!
  logoutAll: SuccessResponse!
}

type Query {
  me: User
  health: String!
}
```

### Mutations

#### 1. Register

```graphql
mutation Register($input: RegisterInput!) {
  register(input: $input) {
    user {
      id
      email
      displayName
      emailVerified
    }
    accessToken
    refreshToken
  }
}
```

**Variables:**
```json
{
  "input": {
    "email": "user@example.com",
    "password": "Password123",
    "displayName": "John Doe"
  }
}
```

#### 2. Login

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    user {
      id
      email
      displayName
    }
    accessToken
    refreshToken
  }
}
```

**Variables:**
```json
{
  "input": {
    "email": "user@example.com",
    "password": "Password123"
  }
}
```

#### 3. Google OAuth

```graphql
mutation GoogleAuth($input: GoogleAuthInput!) {
  googleAuth(input: $input) {
    user {
      id
      email
      displayName
      profilePicture
    }
    accessToken
    refreshToken
  }
}
```

**Variables:**
```json
{
  "input": {
    "idToken": "google_id_token_here"
  }
}
```

#### 4. Refresh Token

```graphql
mutation RefreshToken($input: RefreshTokenInput!) {
  refreshToken(input: $input) {
    accessToken
    refreshToken
  }
}
```

**Variables:**
```json
{
  "input": {
    "refreshToken": "your_refresh_token"
  }
}
```

#### 5. Logout

```graphql
mutation Logout($refreshToken: String!) {
  logout(refreshToken: $refreshToken) {
    success
    message
  }
}
```

#### 6. Logout All Devices (Protected)

```graphql
mutation LogoutAll {
  logoutAll {
    success
    message
  }
}
```

**Headers:**
```json
{
  "authorization": "Bearer YOUR_ACCESS_TOKEN"
}
```

### Queries

#### Get Current User (Protected)

```graphql
query GetMe {
  me {
    id
    email
    displayName
    profilePicture
    emailVerified
    lastLogin
  }
}
```

**Headers:**
```json
{
  "authorization": "Bearer YOUR_ACCESS_TOKEN"
}
```

---

## React Native Setup

### 1. Install Dependencies

```bash
cd /Users/chang/repos/betbuddy
npm install
```

New packages:
- `@apollo/client` - GraphQL client
- `graphql` - GraphQL implementation

### 2. Configure Apollo Client

Edit `src/config/apolloClient.ts`:

```typescript
const GRAPHQL_ENDPOINT = 'http://YOUR_LOCAL_IP:3000/graphql';
```

### 3. Run the App

```bash
npm start
```

---

## How It Works

### Authentication Flow

1. **User logs in/registers**
   - GraphQL mutation sent to backend
   - Returns user data + tokens

2. **Tokens stored**
   - Access token in memory
   - Refresh token in SecureStore

3. **Authenticated requests**
   - Apollo Client adds `Authorization: Bearer <token>` header
   - GraphQL context extracts user from token

4. **Token expiration**
   - Apollo Client error link detects expired token
   - Automatically calls refresh mutation
   - Retries original request with new token

5. **Logout**
   - Revokes refresh token in database
   - Clears tokens from client

### Apollo Client Features

**Auto-refresh on token expiration:**
```typescript
// In apolloClient.ts
const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        // Automatically refresh token and retry
        return fromPromise(refreshAccessToken())
          .flatMap((newToken) => {
            // Retry with new token
            operation.setContext({
              headers: {
                authorization: `Bearer ${newToken}`,
              },
            });
            return forward(operation);
          });
      }
    }
  }
});
```

**Auth context in every request:**
```typescript
// In authLink
const authLink = setContext(async (_, { headers }) => {
  const token = getAccessToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});
```

---

## Testing with GraphQL Playground

### 1. Open Playground

Navigate to `http://localhost:3000/graphql` in your browser

### 2. Test Register

```graphql
mutation {
  register(input: {
    email: "test@test.com"
    password: "Test1234"
    displayName: "Test User"
  }) {
    user {
      id
      email
      displayName
    }
    accessToken
    refreshToken
  }
}
```

### 3. Test Login

```graphql
mutation {
  login(input: {
    email: "test@test.com"
    password: "Test1234"
  }) {
    user {
      id
      email
    }
    accessToken
    refreshToken
  }
}
```

### 4. Test Protected Query

First, copy the `accessToken` from above, then:

**Set HTTP Headers in Playground:**
```json
{
  "authorization": "Bearer YOUR_ACCESS_TOKEN_HERE"
}
```

**Run query:**
```graphql
query {
  me {
    id
    email
    displayName
    lastLogin
  }
}
```

---

## GraphQL vs REST Comparison

| Feature | REST | GraphQL |
|---------|------|---------|
| **Endpoints** | Multiple (`/register`, `/login`, etc.) | Single (`/graphql`) |
| **Over-fetching** | Returns all fields | Request only what you need |
| **Type Safety** | Manual typing | Auto-generated types |
| **Documentation** | Separate (Swagger) | Self-documenting (Schema) |
| **Playground** | Postman/Insomnia | Built-in GraphQL Playground |
| **Real-time** | Polling/WebSockets | GraphQL Subscriptions |

### Advantages of GraphQL for BetBuddy:

1. **Single endpoint** - Easier to maintain
2. **Flexible queries** - Get exactly what you need
3. **Strongly typed** - Better TypeScript integration
4. **Self-documenting** - Schema is the documentation
5. **Easier testing** - GraphQL Playground built-in
6. **Future-proof** - Easy to add subscriptions for real-time bets

---

## Project Structure

```
backend/
├── src/
│   ├── graphql/
│   │   ├── schema.ts          # GraphQL type definitions
│   │   └── resolvers.ts       # Query and mutation resolvers
│   ├── services/
│   │   ├── tokenService.ts    # JWT management
│   │   └── googleOAuth.ts     # Google OAuth
│   └── index.ts               # Apollo Server setup

betbuddy/
├── src/
│   ├── config/
│   │   └── apolloClient.ts    # Apollo Client config
│   ├── graphql/
│   │   ├── mutations.ts       # GraphQL mutations
│   │   └── queries.ts         # GraphQL queries
│   ├── contexts/
│   │   └── AuthContext.tsx    # Auth with useMutation hooks
│   └── screens/
│       ├── LoginScreen.tsx
│       └── RegisterScreen.tsx
└── App.tsx                    # Wrap with ApolloProvider
```

---

## Common Operations

### Get User Info After Login

```typescript
// In your component
import { useQuery } from '@apollo/client';
import { GET_ME } from '../graphql/queries';

function MyComponent() {
  const { data, loading, error } = useQuery(GET_ME);

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error!</Text>;

  return <Text>Welcome {data.me.displayName}!</Text>;
}
```

### Perform Login Mutation

```typescript
import { useMutation } from '@apollo/client';
import { LOGIN } from '../graphql/mutations';

function LoginForm() {
  const [login, { loading, error }] = useMutation(LOGIN);

  const handleLogin = async () => {
    const { data } = await login({
      variables: {
        input: {
          email: 'user@test.com',
          password: 'Password123',
        },
      },
    });

    // Store tokens
    const { accessToken, refreshToken } = data.login;
    setAccessToken(accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
  };

  return <Button onPress={handleLogin} />;
}
```

---

## Error Handling

GraphQL errors are structured:

```json
{
  "errors": [
    {
      "message": "Invalid email or password",
      "extensions": {
        "code": "INVALID_CREDENTIALS"
      }
    }
  ]
}
```

**Error codes:**
- `BAD_USER_INPUT` - Validation error
- `USER_EXISTS` - Email already registered
- `INVALID_CREDENTIALS` - Wrong email/password
- `OAUTH_ONLY_ACCOUNT` - Account uses Google Sign-In
- `UNAUTHENTICATED` - Missing or invalid token
- `GOOGLE_AUTH_FAILED` - Google OAuth failed
- `INVALID_TOKEN` - Refresh token invalid/expired

**Access errors in React Native:**
```typescript
try {
  await login({ variables: { input } });
} catch (error) {
  const message = error.graphQLErrors?.[0]?.message || 'Login failed';
  const code = error.graphQLErrors?.[0]?.extensions?.code;
  console.log(message, code);
}
```

---

## Production Deployment

Same as REST version, but simpler:

1. **Single endpoint**: Only need to configure `/graphql`
2. **CORS**: Already handled by Apollo Server
3. **Rate limiting**: Implement with `graphql-rate-limit`
4. **Monitoring**: Use Apollo Studio (free tier available)

### Apollo Studio Integration

```typescript
// In backend/src/index.ts
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    ApolloServerPluginLandingPageProductionDefault({
      graphRef: 'your-graph-id@production',
    }),
  ],
});
```

---

## Next Steps

1. **Subscriptions** - Real-time bet updates
```graphql
subscription OnBetUpdate($betId: ID!) {
  betUpdated(betId: $betId) {
    id
    status
    proofs {
      id
      verified
    }
  }
}
```

2. **Pagination** - For bets list
```graphql
query GetBets($limit: Int!, $offset: Int!) {
  bets(limit: $limit, offset: $offset) {
    edges {
      node {
        id
        betActivity
      }
    }
    pageInfo {
      hasNextPage
    }
  }
}
```

3. **Batch Operations** - Multiple mutations at once
```graphql
mutation BatchVerifyProofs($proofIds: [ID!]!) {
  verifyProofs(ids: $proofIds) {
    success
    results {
      id
      verified
    }
  }
}
```

---

## Troubleshooting

**"Cannot query field 'me' on type 'Query'"**
- Schema not loaded correctly
- Restart server: `npm run dev`

**Token not being sent**
- Check `apolloClient.ts` authLink
- Verify token in memory with `getAccessToken()`

**CORS errors**
- Apollo Server has built-in CORS
- Check `GRAPHQL_ENDPOINT` URL is correct

**Playground not available**
- Only enabled in development
- Set `NODE_ENV=development`

---

## Resources

- [Apollo Server Docs](https://www.apollographql.com/docs/apollo-server/)
- [Apollo Client Docs](https://www.apollographql.com/docs/react/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [Apollo Studio](https://studio.apollographql.com)

---

Your GraphQL authentication system is now complete and ready to use!
