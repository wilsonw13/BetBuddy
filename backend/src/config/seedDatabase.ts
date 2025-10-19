/**
INSTRUCTIONS FOR AI AGENTS:
Whenever you update this file, also update:
  - backend/prisma/schema.prisma
  - docs/tables.md
  - backend/prisma/migrations/views_and_functions.sql
to ensure all seed data, schema, and documentation are consistent.
*/

import { prisma } from "@/config/prisma";
import bcrypt from "bcrypt";
import { BCRYPT_ROUNDS, DEFAULT_USER_PASSWORD } from "@/config/env";
import { getRandomBanner, getRandomProfilePicture } from "@/config/defaultImage";

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
      profileImage: getRandomProfilePicture() || "",
      bannerImage: getRandomBanner() || "",
    },
    {
      id: _uids[1],
      email: "ryan@gmail.com",
      password: DEFAULT_USER_PASSWORD,
      displayName: "Ryan",
      profileImage: getRandomProfilePicture() || "",
      bannerImage: getRandomBanner() || "",
    },
    {
      id: _uids[2],
      email: "anthony@gmail.com",
      password: DEFAULT_USER_PASSWORD,
      displayName: "Anthony",
      profileImage: getRandomProfilePicture() || "",
      bannerImage: getRandomBanner() || "",
    },
    {
      id: _uids[3],
      email: "wilson@gmail.com",
      password: DEFAULT_USER_PASSWORD,
      displayName: "Wilson",
      profileImage: getRandomProfilePicture() || "",
      bannerImage: getRandomBanner() || "",
    },
    {
      id: _uids[4],
      email: "friendless@gmail.com",
      password: DEFAULT_USER_PASSWORD,
      displayName: "Friendless",
      profileImage: getRandomProfilePicture() || "",
      bannerImage: getRandomBanner() || "",
    },
  ],
  friendships: [
    { user1Id: _uids[0], user2Id: _uids[1] },
    { user1Id: _uids[0], user2Id: _uids[2] },
    { user1Id: _uids[0], user2Id: _uids[3] },
    { user1Id: _uids[1], user2Id: _uids[2] },
    { user1Id: _uids[1], user2Id: _uids[3] },
    { user1Id: _uids[2], user2Id: _uids[3] },
  ],
  friendRequests: [
    {
      fromUserId: _uids[4],
      toUserId: _uids[0],
    },
    {
      fromUserId: _uids[4],
      toUserId: _uids[2],
    },
    {
      fromUserId: _uids[4],
      toUserId: _uids[3],
    },
  ],
  betGroups: [
    {
      id: _bgid_1,
      name: "Cool Kids",
      description: "A group for cool kids to place bets.",
      ownerId: _uids[0],
    },
  ],
  betGroupMembers: [
    { groupId: _bgid_1, userId: _uids[0] },
    { groupId: _bgid_1, userId: _uids[2] },
    { groupId: _bgid_1, userId: _uids[3] },
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
      moneyStaked: 100,
      pointsReward: 10,
      proofsRequired: 1,
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
      moneyStaked: 50,
      pointsReward: 10,
      proofsRequired: 1,
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
      moneyStaked: 75,
      pointsReward: 10,
      proofsRequired: 1,
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
      moneyStaked: 60,
      pointsReward: 10,
      proofsRequired: 1,
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
      moneyStaked: 80,
      pointsReward: 10,
      proofsRequired: 1,
      startDate: DEFAULT_DATE,
      endDate: DEFAULT_BET_END_DATE,
      status: "pending",
      creatorId: _uids[1],
      groupId: null,
      isGroupBet: false,
    },
  ],
  betParticipants: [
    // For bet 1 (group bet)
    {
      id: "bpid_1",
      betId: _betids.touch_grass,
      userId: _uids[0],
      status: "accepted",
      acceptedAt: DEFAULT_DATE,
    },
    {
      id: "bpid_2",
      betId: _betids.touch_grass,
      userId: _uids[2],
      status: "accepted",
      acceptedAt: DEFAULT_DATE,
    },
    {
      id: "bpid_3",
      betId: _betids.touch_grass,
      userId: _uids[3],
      status: "pending",
      acceptedAt: null,
    },
    // For bet 2 (1v1)
    {
      id: "bpid_4",
      betId: _betids.shower,
      userId: _uids[1],
      status: "accepted",
      acceptedAt: DEFAULT_DATE,
    },
    {
      id: "bpid_5",
      betId: _betids.shower,
      userId: _uids[0],
      status: "pending",
      acceptedAt: null,
    },
  ],
  betProofs: [
    {
      id: "bprf_1",
      betId: _betids.touch_grass,
      userId: _uids[0],
      proofType: "live_photo",
      latitude: 37.7749,
      longitude: -122.4194,
      address: "San Francisco, CA",
      verified: true,
      verifiedBy: _uids[2],
      aiSuggestionSuspicious: false,
      aiSuggestionReason: null,
      aiSuggestionConfidence: 0.98,
      createdAt: DEFAULT_DATE,
    },
    {
      id: "bprf_2",
      betId: _betids.shower,
      userId: _uids[1],
      proofType: "live_photo",
      latitude: 34.0522,
      longitude: -118.2437,
      address: "Los Angeles, CA",
      verified: false,
      verifiedBy: null,
      aiSuggestionSuspicious: true,
      aiSuggestionReason: "Photo appears to be reused",
      aiSuggestionConfidence: 0.75,
      createdAt: DEFAULT_DATE,
    },
  ],
  refresh_tokens: [],
  notifications: [],
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
    await prisma.refreshToken.deleteMany({});
    await prisma.notification.deleteMany({});
    console.log("[Seed] All tables cleared.");
  }

  // Seed users
  console.log("[Seed] Seeding users...");
  for (const user of TABLE_SEED_DATA.users) {
    // Hash the password before inserting (same rounds as registration)
    const hashedPassword = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        passwordHash: hashedPassword,
        displayName: user.displayName,
        profileImage: user.profileImage,
        bannerImage: user.bannerImage,
      },
    });
  }
  console.log("[Seed] Users seeded.");

  // Seed refresh tokens
  // console.log("[Seed] Seeding refresh tokens...");
  // for (const token of TABLE_SEED_DATA.refresh_tokens ?? []) {
  //   await prisma.refreshToken.upsert({
  //     where: { id: token.id },
  //     update: {},
  //     create: token,
  //   });
  // }
  // console.log("[Seed] Refresh tokens seeded.");

  // Seed notifications
  // console.log("[Seed] Seeding notifications...");
  // for (const notification of TABLE_SEED_DATA.notifications ?? []) {
  //   await prisma.notification.upsert({
  //     where: { id: notification.id },
  //     update: {},
  //     create: notification,
  //   });
  // }
  // console.log("[Seed] Notifications seeded.");

  // Seed friendships
  console.log("[Seed] Seeding friendships...");
  for (const friendship of TABLE_SEED_DATA.friendships) {
    await prisma.friendship.upsert({
      where: {
        user1Id_user2Id: {
          user1Id: friendship.user1Id,
          user2Id: friendship.user2Id,
        },
      },
      update: {},
      create: {
        user1Id: friendship.user1Id,
        user2Id: friendship.user2Id,
      },
    });
  }
  console.log("[Seed] Friendships seeded.");

  // Seed friend requests
  console.log("[Seed] Seeding friend requests...");
  for (const req of TABLE_SEED_DATA.friendRequests) {
    await prisma.friendRequest.upsert({
      where: {
        fromUserId_toUserId: {
          fromUserId: req.fromUserId,
          toUserId: req.toUserId,
        },
      },
      update: {},
      create: {
        fromUserId: req.fromUserId,
        toUserId: req.toUserId,
      },
    });
  }
  console.log("[Seed] Friend requests seeded.");

  // Seed bet groups
  console.log("[Seed] Seeding bet groups...");
  for (const group of TABLE_SEED_DATA.betGroups) {
    await prisma.betGroup.upsert({
      where: { id: group.id },
      update: {},
      create: {
        id: group.id,
        name: group.name,
        description: group.description,
        ownerId: group.ownerId,
      },
    });
  }
  console.log("[Seed] Bet groups seeded.");

  // Seed bet group members
  console.log("[Seed] Seeding bet group members...");
  for (const member of TABLE_SEED_DATA.betGroupMembers) {
    await prisma.betGroupMember.upsert({
      where: {
        groupId_userId: {
          groupId: member.groupId,
          userId: member.userId,
        },
      },
      update: {},
      create: {
        groupId: member.groupId,
        userId: member.userId,
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
        moneyStaked: bet.moneyStaked,
        pointsReward: bet.pointsReward,
        proofsRequired: bet.proofsRequired,
        startDate: bet.startDate,
        endDate: bet.endDate,
        status: bet.status,
        creatorId: bet.creatorId,
        groupId: bet.groupId,
        isGroupBet: bet.isGroupBet,
      },
    });
  }
  console.log("[Seed] Bets seeded.");

  // Seed bet participants
  console.log("[Seed] Seeding bet participants...");
  for (const part of TABLE_SEED_DATA.betParticipants) {
    await prisma.betParticipant.upsert({
      where: {
        betId_userId: {
          betId: part.betId,
          userId: part.userId,
        },
      },
      update: {},
      create: {
        id: part.id,
        betId: part.betId,
        userId: part.userId,
        status: part.status,
        acceptedAt: part.acceptedAt,
      },
    });
  }
  console.log("[Seed] Bet participants seeded.");

  // Seed bet proofs
  console.log("[Seed] Seeding bet proofs...");
  for (const proof of TABLE_SEED_DATA.betProofs) {
    await prisma.betProof.upsert({
      where: { id: proof.id },
      update: {},
      create: {
        id: proof.id,
        betId: proof.betId,
        userId: proof.userId,
        proofType: proof.proofType,
        latitude: proof.latitude,
        longitude: proof.longitude,
        address: proof.address,
        verified: proof.verified,
        verifiedBy: proof.verifiedBy,
        aiSuggestionSuspicious: proof.aiSuggestionSuspicious,
        aiSuggestionReason: proof.aiSuggestionReason,
        aiSuggestionConfidence: proof.aiSuggestionConfidence,
        createdAt: proof.createdAt,
      },
    });
  }
  console.log("[Seed] Bet proofs seeded.");

  // Final log
  console.log(`[Seed] Database seeded${resetDb ? " (reset and seeded)" : " (if not already present)"}`);
}
