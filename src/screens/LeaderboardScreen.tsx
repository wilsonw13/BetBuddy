import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@apollo/client";
import {
  GET_GLOBAL_LEADERBOARD,
  GET_FRIEND_LEADERBOARD,
  GET_GROUP_LEADERBOARD,
  GET_ME,
  GET_MY_BET_GROUPS,
} from "@/graphql/queries";

// Fetch leaderboard entries directly from backend

const getRankColor = (rank?: string): string => {
  switch (rank ?? "beginner") {
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
  const [tab, setTab] = useState<"global" | "friend" | "group">("global");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Get current user for friend leaderboard
  const { data: meData } = useQuery(GET_ME);
  const userId = meData?.me?.id;

  // Get user's groups for dropdown
  const { data: groupsData } = useQuery(GET_MY_BET_GROUPS);
  const groups = Array.isArray(groupsData?.myBetGroups) ? groupsData.myBetGroups : [];

  // Default to first group for group leaderboard
  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  // Fetch leaderboards
  const { data: globalData, loading: globalLoading } = useQuery(GET_GLOBAL_LEADERBOARD);
  const { data: friendData, loading: friendLoading } = useQuery(GET_FRIEND_LEADERBOARD, {
    variables: { ownerId: userId },
  });
  const { data: groupData, loading: groupLoading } = useQuery(GET_GROUP_LEADERBOARD, {
    variables: { groupId: selectedGroupId },
  });

  let leaderboard: any[] = [];
  if (tab === "global") {
    leaderboard = Array.isArray(globalData?.globalLeaderboard) ? globalData.globalLeaderboard : [];
  }
  if (tab === "friend") {
    leaderboard = Array.isArray(friendData?.friendLeaderboard) ? friendData.friendLeaderboard : [];
  }
  if (tab === "group") {
    leaderboard = Array.isArray(groupData?.groupLeaderboard) ? groupData.groupLeaderboard : [];
  }

  const renderLeaderboardItem = ({ item }: { item: any }) => {
    const rank = item.leaderboardRank ?? item.rank;
    const isTopThree = rank <= 3;
    return (
      <TouchableOpacity style={[styles.leaderboardCard, isTopThree && styles.topThreeCard]}>
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <Text style={styles.rankEmoji}>{getRankIcon(rank)}</Text>
          ) : (
            <Text style={styles.rankNumber}>{rank}</Text>
          )}
        </View>

        <View style={styles.avatarContainer}>
          {item.profileImage ? (
            <Image source={{ 
              uri: item.profileImage.startsWith('data:')
                ? item.profileImage
                : `data:image/png;base64,${item.profileImage}`
            }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={24} color="#8E8E93" />
            </View>
          )}
          <View style={[styles.rankBadge, { backgroundColor: getRankColor() }]}>
            <Text style={styles.rankBadgeText}>{item.displayName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.displayName}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="trophy-outline" size={14} color="#8E8E93" />
              <Text style={styles.statText}>
                {item.successfulBets}/{item.totalBets}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trending-up" size={14} color="#8E8E93" />
              <Text style={styles.statText}>{(item.successRate * 100).toFixed(0)}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.pointsContainer}>
          <Text style={styles.pointsValue}>{item.score}</Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rankings</Text>
        <View style={{ flexDirection: "row", marginTop: 8 }}>
          <TouchableOpacity
            style={[styles.tabButton, tab === "global" && styles.tabButtonActive]}
            onPress={() => setTab("global")}
          >
            <Text style={[styles.tabText, tab === "global" && styles.tabTextActive]}>Global</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, tab === "friend" && styles.tabButtonActive]}
            onPress={() => setTab("friend")}
          >
            <Text style={[styles.tabText, tab === "friend" && styles.tabTextActive]}>Friend</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, tab === "group" && styles.tabButtonActive]}
            onPress={() => setTab("group")}
          >
            <Text style={[styles.tabText, tab === "group" && styles.tabTextActive]}>Group</Text>
          </TouchableOpacity>
        </View>
        {tab === "group" && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 4 }}>Select Group:</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {groups.map((group: any) => (
                <TouchableOpacity
                  key={group.id}
                  style={[styles.groupDropdownItem, selectedGroupId === group.id && styles.groupDropdownItemActive]}
                  onPress={() => setSelectedGroupId(group.id)}
                >
                  <Text style={{ color: selectedGroupId === group.id ? "#007AFF" : "#333" }}>{group.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
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
        keyExtractor={(item) => item.userId || item.friendId || item.memberId}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F2F2F7",
    marginRight: 8,
  },
  tabButtonActive: {
    backgroundColor: "#007AFF",
  },
  tabText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#fff",
  },
  groupDropdownItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#F2F2F7",
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  groupDropdownItemActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
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
