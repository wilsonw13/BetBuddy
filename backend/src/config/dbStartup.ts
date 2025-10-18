import { prisma } from "@/config/prisma";

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
const DEFAULT_USER_PASSWORD = "Chang6767";

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
const _betids = {
  touch_grass: "betid_touch_grass",
  shower: "betid_shower",
  savings: "betid_savings",
  study: "betid_study",
  workout: "betid_workout",
};

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
      id: _betids.touch_grass,
      title: "Touch Grass Daily",
      description: "Go outside and touch grass every day for a week.",
      betActivity: "Touch grass",
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
    },
    {
      id: _betids.shower,
      title: "Shower Every Day",
      description: "Take a shower every day for a week.",
      betActivity: "Shower",
      proofType: "live_photo",
      frequency: "daily",
      betLength: 7,
      pointsStaked: 50,
      startDate: DEFAULT_DATE,
      endDate: DEFAULT_BET_END_DATE,
      status: "pending",
      creatorId: _uids[0],
      groupId: null,
      isGroupBet: false,
    },
    {
      id: _betids.savings,
      title: "Save Money Weekly",
      description: "Add money to your savings account once this week.",
      betActivity: "Add money to savings account",
      proofType: "live_photo",
      frequency: "1x/week",
      betLength: 7,
      pointsStaked: 75,
      startDate: DEFAULT_DATE,
      endDate: DEFAULT_BET_END_DATE,
      status: "pending",
      creatorId: _uids[0],
      groupId: null,
      isGroupBet: false,
    },
    {
      id: _betids.study,
      title: "Study 30 Minutes Daily",
      description: "Study for at least 30 minutes every day for a week.",
      betActivity: "Study for 30 mins",
      proofType: "live_photo",
      frequency: "daily",
      betLength: 7,
      pointsStaked: 60,
      startDate: DEFAULT_DATE,
      endDate: DEFAULT_BET_END_DATE,
      status: "pending",
      creatorId: _uids[0],
      groupId: _bgid_1,
      isGroupBet: true,
    },
    {
      id: _betids.workout,
      title: "Workout 30 Minutes Daily",
      description: "Work out for at least 30 minutes every day for a week.",
      betActivity: "Work out for 30 mins",
      proofType: "live_photo",
      frequency: "daily",
      betLength: 7,
      pointsStaked: 80,
      startDate: DEFAULT_DATE,
      endDate: DEFAULT_BET_END_DATE,
      status: "pending",
      creatorId: _uids[1],
      groupId: null,
      isGroupBet: false,
    },
  ],
  bet_participants: [
    // For bet 1 (group bet)
    {
      id: "bpid_1",
      bet_id: _betids.touch_grass,
      user_id: _uids[0],
      status: "accepted",
      accepted_at: DEFAULT_DATE,
    },
    {
      id: "bpid_2",
      bet_id: _betids.touch_grass,
      user_id: _uids[2],
      status: "accepted",
      accepted_at: DEFAULT_DATE,
    },
    {
      id: "bpid_3",
      bet_id: _betids.touch_grass,
      user_id: _uids[3],
      status: "pending",
      accepted_at: null,
    },
    // For bet 2 (1v1)
    {
      id: "bpid_4",
      bet_id: _betids.shower,
      user_id: _uids[1],
      status: "accepted",
      accepted_at: DEFAULT_DATE,
    },
    {
      id: "bpid_5",
      bet_id: _betids.shower,
      user_id: _uids[0],
      status: "pending",
      accepted_at: null,
    },
  ],
  bet_proofs: [
    {
      id: "bprf_1",
      bet_id: _betids.touch_grass,
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
      bet_id: _betids.shower,
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

/**
 * Seed the database with initial data if it doesn't already exist.
 * @param resetDb - If true, delete all data before seeding. Default: false
 */
export async function seedDatabase(resetDb: boolean = false) {
  // Optionally reset the database by deleting all data
  if (resetDb) {
    console.log("[Seed] Resetting database: deleting all data...");
    // Order matters due to foreign key constraints
    await prisma.betProof.deleteMany({});
    await prisma.betParticipant.deleteMany({});
    await prisma.bet.deleteMany({});
    await prisma.betGroupMember.deleteMany({});
    await prisma.betGroup.deleteMany({});
    await prisma.friendRequest.deleteMany({});
    await prisma.friendship.deleteMany({});
    await prisma.user.deleteMany({});
    console.log("[Seed] All tables cleared.");
  }

  // Seed users
  console.log("[Seed] Seeding users...");
  for (const user of TABLE_SEED_DATA.users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        passwordHash: user.password, // You may want to hash this in production
        displayName: user.displayName,
      },
    });
  }
  console.log("[Seed] Users seeded.");

  // Seed friendships
  console.log("[Seed] Seeding friendships...");
  for (const friendship of TABLE_SEED_DATA.friendships) {
    await prisma.friendship.upsert({
      where: {
        user1Id_user2Id: {
          user1Id: friendship.user1_id,
          user2Id: friendship.user2_id,
        },
      },
      update: {},
      create: {
        user1Id: friendship.user1_id,
        user2Id: friendship.user2_id,
      },
    });
  }
  console.log("[Seed] Friendships seeded.");

  // Seed friend requests
  console.log("[Seed] Seeding friend requests...");
  for (const req of TABLE_SEED_DATA.friend_requests) {
    await prisma.friendRequest.upsert({
      where: {
        fromUserId_toUserId: {
          fromUserId: req.from_user_id,
          toUserId: req.to_user_id,
        },
      },
      update: {},
      create: {
        fromUserId: req.from_user_id,
        toUserId: req.to_user_id,
      },
    });
  }
  console.log("[Seed] Friend requests seeded.");

  // Seed bet groups
  console.log("[Seed] Seeding bet groups...");
  for (const group of TABLE_SEED_DATA.bet_groups) {
    await prisma.betGroup.upsert({
      where: { id: group.id },
      update: {},
      create: {
        id: group.id,
        name: group.name,
        description: group.description,
        ownerId: group.owner_id,
      },
    });
  }
  console.log("[Seed] Bet groups seeded.");

  // Seed bet group members
  console.log("[Seed] Seeding bet group members...");
  for (const member of TABLE_SEED_DATA.bet_group_members) {
    await prisma.betGroupMember.upsert({
      where: {
        groupId_userId: {
          groupId: member.bet_group_id,
          userId: member.user_id,
        },
      },
      update: {},
      create: {
        groupId: member.bet_group_id,
        userId: member.user_id,
      },
    });
  }
  console.log("[Seed] Bet group members seeded.");

  // Seed bets
  console.log("[Seed] Seeding bets...");
  for (const bet of TABLE_SEED_DATA.bets) {
    await prisma.bet.upsert({
      where: { id: bet.id },
      update: {},
      create: {
        id: bet.id,
        title: bet.title,
        description: bet.description,
        betActivity: bet.betActivity,
        proofType: bet.proofType,
        frequency: bet.frequency,
        betLength: bet.betLength,
        pointsStaked: bet.pointsStaked,
        startDate: bet.startDate,
        endDate: bet.endDate,
        status: bet.status,
        creatorId: bet.creatorId,
        groupId: bet.groupId,
        isGroupBet: bet.isGroupBet,
        // createdAt/updatedAt handled by Prisma
      },
    });
  }
  console.log("[Seed] Bets seeded.");

  // Seed bet participants
  console.log("[Seed] Seeding bet participants...");
  for (const part of TABLE_SEED_DATA.bet_participants) {
    await prisma.betParticipant.upsert({
      where: {
        betId_userId: {
          betId: part.bet_id,
          userId: part.user_id,
        },
      },
      update: {},
      create: {
        id: part.id,
        betId: part.bet_id,
        userId: part.user_id,
        status: part.status,
        acceptedAt: part.accepted_at,
        // createdAt handled by Prisma
      },
    });
  }
  console.log("[Seed] Bet participants seeded.");

  // Seed bet proofs
  console.log("[Seed] Seeding bet proofs...");
  for (const proof of TABLE_SEED_DATA.bet_proofs) {
    await prisma.betProof.upsert({
      where: { id: proof.id },
      update: {},
      create: {
        id: proof.id,
        betId: proof.bet_id,
        userId: proof.user_id,
        proofType: proof.proof_type,
        imageUrl: proof.image_url,
        latitude: proof.latitude,
        longitude: proof.longitude,
        address: proof.address,
        verified: proof.verified,
        verifiedBy: proof.verified_by,
        aiSuggestionSuspicious: proof.ai_suggestion_suspicious,
        aiSuggestionReason: proof.ai_suggestion_reason,
        aiSuggestionConfidence: proof.ai_suggestion_confidence,
        createdAt: proof.created_at,
      },
    });
  }
  console.log("[Seed] Bet proofs seeded.");

  // Final log
  console.log(`[Seed] Database seeded${resetDb ? " (reset and seeded)" : " (if not already present)"}`);
}
