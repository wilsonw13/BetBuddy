import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "@apollo/client";
import { GET_MY_BET_GROUPS, GET_MY_FRIENDS } from "@/graphql/queries";
import { ADD_GROUP_MEMBERS, REMOVE_GROUP_MEMBER } from "@/graphql/mutations";

interface Member {
  id: string;
  user: {
    id: string;
    displayName: string;
    email: string;
    profilePicture?: string;
  };
  joinedAt: string;
}

interface BetGroup {
  id: string;
  name: string;
  description?: string;
  owner: {
    id: string;
    displayName: string;
    email: string;
  };
  members: Member[];
  bets: Array<any>;
  createdAt: string;
}

export default function GroupDetailsScreen({ route, navigation }: any) {
  const { groupId, groupName } = route.params;

  // Fetch group details
  const {
    data: groupsData,
    loading: groupLoading,
    refetch: refetchGroup,
  } = useQuery(GET_MY_BET_GROUPS, {
    fetchPolicy: "network-only",
  });

  const group: BetGroup | undefined = groupsData?.myBetGroups?.find(
    (g: BetGroup) => g.id === groupId
  );

  if (groupLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading group...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Ionicons name="alert-circle" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Group not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderMember = ({ item }: { item: Member }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>
          {item.user.displayName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.user.displayName}</Text>
        <Text style={styles.memberEmail}>{item.user.email}</Text>
        <Text style={styles.memberJoined}>
          Joined {new Date(item.joinedAt).toLocaleDateString()}
        </Text>
      </View>
      {group.owner.id === item.user.id && (
        <View style={styles.ownerBadge}>
          <Text style={styles.ownerBadgeText}>Owner</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{group.name}</Text>
          <Text style={styles.headerSubtitle}>
            {group.members.length} {group.members.length === 1 ? "member" : "members"}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Group Info */}
        <View style={styles.infoSection}>
          <View style={styles.groupIconLarge}>
            <Ionicons name="people-circle" size={80} color="#007AFF" />
          </View>
          {group.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionLabel}>Description</Text>
              <Text style={styles.description}>{group.description}</Text>
            </View>
          )}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{group.members.length}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{group.bets.length}</Text>
              <Text style={styles.statLabel}>Bets</Text>
            </View>
          </View>
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members</Text>
          </View>
          {group.members.map((member) => (
            <View key={member.id}>{renderMember({ item: member })}</View>
          ))}
        </View>

        {/* Bets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Group Bets</Text>
          </View>
          {group.bets.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyStateText}>No bets yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Create a bet to get started
              </Text>
            </View>
          ) : (
            <View style={styles.betsContainer}>
              {group.bets.map((bet) => (
                <View key={bet.id} style={styles.betCard}>
                  <Text style={styles.betTitle}>{bet.title}</Text>
                  <Text style={styles.betStatus}>{bet.status}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8E8E93",
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#FF3B30",
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  infoSection: {
    backgroundColor: "white",
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  groupIconLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  descriptionContainer: {
    width: "100%",
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#000",
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: "row",
    width: "100%",
    marginTop: 24,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#007AFF",
  },
  statLabel: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 4,
  },
  section: {
    backgroundColor: "white",
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberAvatarText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  memberEmail: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  memberJoined: {
    fontSize: 11,
    color: "#C7C7CC",
    marginTop: 4,
  },
  ownerBadge: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ownerBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#C7C7CC",
    marginTop: 4,
  },
  betsContainer: {
    gap: 8,
  },
  betCard: {
    padding: 16,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  betTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  betStatus: {
    fontSize: 14,
    color: "#8E8E93",
    textTransform: "capitalize",
  },
});