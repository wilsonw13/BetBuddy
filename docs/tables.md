<!--
INSTRUCTIONS FOR AI AGENTS:
Whenever you update this file, also update:
	- backend/prisma/schema.prisma
	- backend/src/config/dbStartup.ts
to ensure all documentation, schema, and seed data are consistent.

Whenever you update this file changes, update this file to:
1. Sort all tables alphabetically by name.
2. For each table, briefly explain its purpose.
3. For each field, briefly explain its name, type, and purpose.
4. Ensure formatting matches the current style (table name as heading, purpose, then fields list).
-->

## `bets`

Purpose: Stores bet details.
Fields:

- id (String): Unique bet ID (UUID)
- title (String): Bet title
- description (String?): Bet description
- betActivity (String): Activity to complete
- proofType (String): Type of proof (live_photo, location)
- frequency (String): How often activity must be done
- betLength (Int): Duration in days
- pointsStaked (Int): Points wagered
- startDate (DateTime): Bet start date
- endDate (DateTime): Bet end date
- status (String): Bet status (pending, active, completed, cancelled)
- creatorId (String): Creator’s user ID
- groupId (String?): Group ID (if group bet)
- isGroupBet (Boolean): Is this a group bet?
- createdAt (DateTime): Bet creation timestamp
- updatedAt (DateTime): Last update timestamp

## `bet_groups`

Purpose: Stores groups for group bets.
Fields:

- id (String): Unique group ID (UUID)
- name (String): Group name
- description (String?): Group description
- ownerId (String): Group owner’s user ID
- createdAt (DateTime): Group creation timestamp
- updatedAt (DateTime): Last update timestamp

## `bet_participants`

Purpose: Tracks users participating in bets.
Fields:

- id (String): Unique participant ID (UUID)
- betId (String): Associated bet ID
- userId (String): Participant’s user ID
- status (String): Participation status (pending, accepted, declined) (default: pending)
- acceptedAt (DateTime?): When participation was accepted
- outcome (String?): Outcome (won, lost, null)
- proofsSubmitted (Int): Count of submitted proofs (default: 0)
- proofsVerified (Int): Count of peer-verified proofs (default: 0)
- lastProofReminder (DateTime?): Last proof reminder timestamp
- createdAt (DateTime): Participation creation timestamp (default: now)

## `bet_proofs`

Purpose: Stores proof submissions for bets.
Fields:

- id (String): Unique proof ID (UUID)
- betId (String): Associated bet ID
- userId (String): User who submitted proof
- proofType (String): Type of proof
- imageUrl (String?): URL to proof image
- latitude (Float?): Latitude (if location proof)
- longitude (Float?): Longitude (if location proof)
- address (String?): Address (if location proof)
- verified (Boolean): Whether proof is verified
- verifiedBy (String?): Who verified the proof
- aiSuggestionSuspicious (Boolean?): AI flagged as suspicious
- aiSuggestionReason (String?): Reason for AI suspicion
- aiSuggestionConfidence (Float?): AI confidence score
- createdAt (DateTime): Proof submission timestamp

## `friend_requests`

Purpose: Tracks friend requests between users.
Fields:

- id (String): Unique request ID (UUID)
- fromUserId (String): Sender’s user ID
- toUserId (String): Recipient’s user ID
- status (String): Request status (pending, accepted, declined)
- createdAt (DateTime): Request creation timestamp
- updatedAt (DateTime): Last update timestamp

## `friendships`

Purpose: Represents established friendships between users.
Fields:

- id (String): Unique friendship ID (UUID)
- user1Id (String): First user’s ID
- user2Id (String): Second user’s ID
- createdAt (DateTime): Friendship creation timestamp

## `bet_group_members`

Purpose: Tracks bet group membership.
Fields:

- id (String): Unique membership ID (UUID)
- groupId (String): Bet group ID
- userId (String): User ID
- joinedAt (DateTime): Membership start timestamp

## `refresh_tokens`

Purpose: Stores refresh tokens for user authentication.
Fields:

- id (String): Unique token ID (UUID)
- userId (String): Associated user’s ID
- tokenHash (String): Hashed token value
- expiresAt (DateTime): Expiration timestamp
- revoked (Boolean): Whether token is revoked
- createdAt (DateTime): Token creation timestamp

## `users`

Purpose: Stores user account information and profile details.
Fields:

- id (String): Unique user ID (UUID)
- email (String): User’s email address
- passwordHash (String?): Hashed password
- googleId (String?): Google account ID (if linked)
- displayName (String): User’s display name
- profileImage (String?): Base64 encoded profile picture
- bannerImage (String?): Base64 encoded banner image
- emailVerified (Boolean): Whether email is verified (default: false)
- points (Int): Points for rewards/shop (default: 0)
- placeholderMoney (Float): Virtual currency for betting (default: 100)
- createdAt (DateTime): Account creation timestamp (default: now)
- updatedAt (DateTime): Last update timestamp (auto-updated)
