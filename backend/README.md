# BetBuddy Backend API

Node.js + Express + PostgreSQL authentication backend with JWT and Google OAuth.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Run migrations
npm run migrate

# Start development server
npm run dev
```

Server runs on `http://localhost:3000`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run migrate` | Run database migrations |
| `npm run migrate down` | Rollback last migration |

## Environment Variables

Required variables in `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=betbuddy
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_ACCESS_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
```

## API Endpoints

### Authentication

**POST /api/auth/register**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "display_name": "John Doe"
}
```

**POST /api/auth/login**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**POST /api/auth/google/mobile**
```json
{
  "idToken": "google_id_token_here"
}
```

**POST /api/auth/refresh**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**POST /api/auth/logout**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**POST /api/auth/logout-all** (Protected)
```
Headers: Authorization: Bearer <access_token>
```

## Database Schema

### users
- `id` (UUID, PK)
- `email` (VARCHAR, UNIQUE)
- `password_hash` (VARCHAR, nullable for OAuth users)
- `google_id` (VARCHAR, UNIQUE, nullable)
- `display_name` (VARCHAR)
- `profile_picture` (TEXT, nullable)
- `email_verified` (BOOLEAN, default false)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `last_login` (TIMESTAMP, nullable)

### refresh_tokens
- `id` (UUID, PK)
- `user_id` (UUID, FK to users)
- `token_hash` (VARCHAR)
- `expires_at` (TIMESTAMP)
- `revoked` (BOOLEAN, default false)
- `created_at` (TIMESTAMP)

## Security Features

- Password hashing with bcrypt (cost factor 12)
- JWT access tokens (15 min expiry)
- JWT refresh tokens (7 day expiry)
- Refresh token rotation
- Rate limiting (5 requests per 15 min)
- Google OAuth token verification
- SQL injection protection (parameterized queries)
- CORS configuration
- Helmet.js security headers

## Project Structure

```
src/
├── config/
│   └── database.ts           # PostgreSQL connection pool
├── controllers/
│   └── authController.ts     # Authentication endpoints
├── services/
│   ├── tokenService.ts       # JWT token management
│   └── googleOAuth.ts        # Google OAuth verification
├── middleware/
│   └── authMiddleware.ts     # JWT verification middleware
├── migrations/
│   ├── 001_create_users_table.ts
│   ├── 002_create_refresh_tokens_table.ts
│   └── run.ts                # Migration runner
├── routes/
│   └── authRoutes.ts         # Auth routes
├── types/
│   └── index.ts              # TypeScript types
└── index.ts                  # Express server
```

## Development

```bash
# Watch mode with auto-reload
npm run dev

# Run migrations
npm run migrate

# Rollback migration
npm run migrate down

# Build for production
npm run build

# Start production server
npm start
```

## Testing with curl

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234","display_name":"Test"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234"}'
```

**Refresh Token:**
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

**Protected Endpoint:**
```bash
curl -X POST http://localhost:3000/api/auth/logout-all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

**Database connection fails:**
```bash
# Check PostgreSQL is running
psql postgres -c "SELECT 1"

# Check database exists
psql postgres -c "\l" | grep betbuddy
```

**Port already in use:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Migration errors:**
```bash
# Rollback and retry
npm run migrate down
npm run migrate
```

## Production Deployment

1. Set environment variables
2. Set `NODE_ENV=production`
3. Build: `npm run build`
4. Start: `npm start`
5. Configure reverse proxy (nginx)
6. Enable SSL/TLS
7. Set up database backups

## License

MIT
