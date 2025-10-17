import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LeaderboardEntry, User } from "@/types";

// Mock data - replace with real data from your backend
const mockUsers: User[] = [
  {
    id: "user1",
    name: "John Doe",
    successRate: 0.85,
    totalBets: 20,
    successfulBets: 17,
    points: 850,
    rank: "advanced",
    friendGroups: [],
    pranksActive: [],
  },
  {
    id: "user2",
    name: "Jane Smith",
    successRate: 0.92,
    totalBets: 25,
    successfulBets: 23,
    points: 1200,
    rank: "legendary",
    friendGroups: [],
    pranksActive: [],
  },
  {
    id: "user3",
    name: "Bob Johnson",
    successRate: 0.75,
    totalBets: 12,
    successfulBets: 9,
    points: 450,
    rank: "intermediate",
    friendGroups: [],
    pranksActive: [],
  },
  {
    id: "user4",
    name: "Alice Williams",
    successRate: 0.6,
    totalBets: 10,
    successfulBets: 6,
    points: 300,
    rank: "beginner",
    friendGroups: [],
    pranksActive: [],
  },
];

const calculateScore = (user: User): number => {
  // Weighted average: 60% success rate, 40% total successful bets
  const normalizedSuccessRate = user.successRate;
  const normalizedSuccessfulBets = Math.min(user.successfulBets / 50, 1); // Cap at 50
  return normalizedSuccessRate * 0.6 + normalizedSuccessfulBets * 0.4;
};

const getRankColor = (rank: string): string => {
  switch (rank) {
    case "legendary":
      return "#FFD700";
    case "advanced":
      return "#C0C0C0";
    case "intermediate":
      return "#CD7F32";
    default:
      return "#8E8E93";
  }
};

const getRankIcon = (rank: number): string => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}`;
};

export default function LeaderboardScreen() {
  const [selectedGroup, setSelectedGroup] = useState("All Friends");

  const leaderboard: LeaderboardEntry[] = mockUsers
    .map((user) => ({
      user,
      score: calculateScore(user),
      rank: 0,
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => {
    const isTopThree = item.rank <= 3;

    return (
      <TouchableOpacity style={[styles.leaderboardCard, isTopThree && styles.topThreeCard]}>
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <Text style={styles.rankEmoji}>{getRankIcon(item.rank)}</Text>
          ) : (
            <Text style={styles.rankNumber}>{item.rank}</Text>
          )}
        </View>

        <View style={styles.avatarContainer}>
          {item.user.profilePicture ? (
            <Image source={{ uri: item.user.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={24} color="#8E8E93" />
            </View>
          )}
          <View style={[styles.rankBadge, { backgroundColor: getRankColor(item.user.rank) }]}>
            <Text style={styles.rankBadgeText}>{item.user.rank.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.user.name}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="trophy-outline" size={14} color="#8E8E93" />
              <Text style={styles.statText}>
                {item.user.successfulBets}/{item.user.totalBets}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trending-up" size={14} color="#8E8E93" />
              <Text style={styles.statText}>{(item.user.successRate * 100).toFixed(0)}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.pointsContainer}>
          <Text style={styles.pointsValue}>{item.user.points}</Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rankings</Text>
        <TouchableOpacity style={styles.groupSelector}>
          <Text style={styles.groupSelectorText}>{selectedGroup}</Text>
          <Ionicons name="chevron-down" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Rank Levels</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBadge, { backgroundColor: "#8E8E93" }]} />
            <Text style={styles.legendText}>Beginner</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBadge, { backgroundColor: "#CD7F32" }]} />
            <Text style={styles.legendText}>Intermediate</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBadge, { backgroundColor: "#C0C0C0" }]} />
            <Text style={styles.legendText}>Advanced</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBadge, { backgroundColor: "#FFD700" }]} />
            <Text style={styles.legendText}>Legendary</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.user.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  groupSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    padding: 10,
    borderRadius: 8,
  },
  groupSelectorText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
    marginRight: 4,
  },
  legendContainer: {
    backgroundColor: "white",
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 11,
    color: "#8E8E93",
  },
  listContainer: {
    padding: 16,
  },
  leaderboardCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  topThreeCard: {
    borderWidth: 2,
    borderColor: "#FFD700",
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  rankContainer: {
    width: 40,
    alignItems: "center",
  },
  rankEmoji: {
    fontSize: 24,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#8E8E93",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  rankBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  rankBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "white",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  pointsContainer: {
    alignItems: "flex-end",
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF",
  },
  pointsLabel: {
    fontSize: 12,
    color: "#8E8E93",
  },
});
