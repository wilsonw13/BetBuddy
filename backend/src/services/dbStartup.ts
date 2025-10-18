/**
INSTRUCTIONS FOR AI AGENTS:
Whenever you update this file, also update:
  - backend/prisma/schema.prisma
  - docs/tables.md
to ensure all seed data, schema, and documentation are consistent.
*/

/**
 * The login password for all initially created users.
 */
const DEFAULT_USER_PASSWORD = "ChangeMe123";

/**
 * The default image URL used for bet proofs and backgrounds.
 */
const DEFAULT_IMG_URL = "https://api.slingacademy.com/public/sample-photos/67.jpeg";

/**
 * Default date used for seed data.
 * October 17, 2025, 12:00 PM America/New_York (16:00 UTC)
 */
const DEFAULT_DATE = new Date("2025-10-17T16:00:00Z");
const DEFAULT_BET_END_DATE = new Date("2025-10-18T20:00:00Z");

/**
 * User IDs for initial seed users.
 * Order: Chang, Ryan, Anthony, Wilson, Friendless
 */
const _uids = ["uid_chang", "uid_ryan", "uid_anthony", "uid_wilson", "uid_friendless"];

/**
 * Bet group ID for the initial group.
 */
const _bgid_1 = "bgid_1";

/**
 * Bet IDs for initial seed bets.
 */
const _betid_1 = "betid_1";
const _betid_2 = "betid_2";

const TABLE_SEED_DATA = {
  users: [
    {
      id: _uids[0],
      email: "chang@gmail.com",
      password: DEFAULT_USER_PASSWORD,
      displayName: "Chang",
    },
    {
      id: _uids[1],
      email: "ryan@gmail.com",
      password: DEFAULT_USER_PASSWORD,
      displayName: "Ryan",
    },
    {
      id: _uids[2],
      email: "anthony@gmail.com",
      password: DEFAULT_USER_PASSWORD,
      displayName: "Anthony",
    },
    {
      id: _uids[3],
      email: "wilson@gmail.com",
      password: DEFAULT_USER_PASSWORD,
      displayName: "Wilson",
    },
    {
      id: _uids[4],
      email: "friendless@gmail.com",
      password: DEFAULT_USER_PASSWORD,
      displayName: "Friendless",
    },
  ],
  friendships: [
    { user1_id: _uids[0], user2_id: _uids[1] },
    { user1_id: _uids[0], user2_id: _uids[2] },
    { user1_id: _uids[0], user2_id: _uids[3] },
    { user1_id: _uids[1], user2_id: _uids[2] },
    { user1_id: _uids[1], user2_id: _uids[3] },
    { user1_id: _uids[2], user2_id: _uids[3] },
  ],
  friend_requests: [
    {
      from_user_id: _uids[4],
      to_user_id: _uids[0],
    },
    {
      from_user_id: _uids[4],
      to_user_id: _uids[2],
    },
    {
      from_user_id: _uids[4],
      to_user_id: _uids[3],
    },
  ],
  bet_groups: [
    {
      id: _bgid_1,
      name: "Cool Kids",
      description: "A group for cool kids to place bets.",
      owner_id: _uids[0],
    },
  ],
  bet_group_members: [
    { bet_group_id: _bgid_1, user_id: _uids[0] },
    { bet_group_id: _bgid_1, user_id: _uids[2] },
    { bet_group_id: _bgid_1, user_id: _uids[3] },
  ],
  bets: [
    {
      id: _betid_1,
      title: "No Sugar Week",
      description: "No sugar for a week!",
      betActivity: "No sugar",
      proofType: "live_photo",
      frequency: "daily",
      betLength: 7,
      pointsStaked: 100,
      startDate: DEFAULT_DATE,
      endDate: DEFAULT_BET_END_DATE,
      status: "active",
      creatorId: _uids[0],
      groupId: _bgid_1,
      isGroupBet: true,
      createdAt: DEFAULT_DATE,
      updatedAt: DEFAULT_DATE,
    },
    {
      id: _betid_2,
      title: "Gym Challenge",
      description: "Go to the gym 3x this week",
      betActivity: "Go to gym",
      proofType: "live_photo",
      frequency: "3x/week",
      betLength: 7,
      pointsStaked: 50,
      startDate: DEFAULT_DATE,
      endDate: DEFAULT_BET_END_DATE,
      status: "pending",
      creatorId: _uids[1],
      groupId: null,
      isGroupBet: false,
      createdAt: DEFAULT_DATE,
      updatedAt: DEFAULT_DATE,
    },
  ],
  bet_participants: [
    // For bet 1 (group bet)
    {
      id: "bpid_1",
      bet_id: _betid_1,
      user_id: _uids[0],
      status: "accepted",
      accepted_at: DEFAULT_DATE,
      created_at: DEFAULT_DATE,
    },
    {
      id: "bpid_2",
      bet_id: _betid_1,
      user_id: _uids[2],
      status: "accepted",
      accepted_at: DEFAULT_DATE,
      created_at: DEFAULT_DATE,
    },
    {
      id: "bpid_3",
      bet_id: _betid_1,
      user_id: _uids[3],
      status: "pending",
      accepted_at: null,
      created_at: DEFAULT_DATE,
    },
    // For bet 2 (1v1)
    {
      id: "bpid_4",
      bet_id: _betid_2,
      user_id: _uids[1],
      status: "accepted",
      accepted_at: DEFAULT_DATE,
      created_at: DEFAULT_DATE,
    },
    {
      id: "bpid_5",
      bet_id: _betid_2,
      user_id: _uids[0],
      status: "pending",
      accepted_at: null,
      created_at: DEFAULT_DATE,
    },
  ],
  bet_proofs: [
    {
      id: "bprf_1",
      bet_id: _betid_1,
      user_id: _uids[0],
      proof_type: "live_photo",
      image_url: DEFAULT_IMG_URL,
      latitude: 37.7749,
      longitude: -122.4194,
      address: "San Francisco, CA",
      verified: true,
      verified_by: _uids[2],
      ai_suggestion_suspicious: false,
      ai_suggestion_reason: null,
      ai_suggestion_confidence: 0.98,
      created_at: DEFAULT_DATE,
    },
    {
      id: "bprf_2",
      bet_id: _betid_2,
      user_id: _uids[1],
      proof_type: "live_photo",
      image_url: DEFAULT_IMG_URL,
      latitude: 34.0522,
      longitude: -118.2437,
      address: "Los Angeles, CA",
      verified: false,
      verified_by: null,
      ai_suggestion_suspicious: true,
      ai_suggestion_reason: "Photo appears to be reused",
      ai_suggestion_confidence: 0.75,
      created_at: DEFAULT_DATE,
    },
  ],
};
