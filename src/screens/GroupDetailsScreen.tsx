import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "@apollo/client";
import { GET_MY_BET_GROUPS, GET_MY_FRIENDS, GET_ME } from "@/graphql/queries";
import {
  ADD_GROUP_MEMBERS,
  REMOVE_GROUP_MEMBER,
  UPDATE_BET_GROUP,
  LEAVE_GROUP,
  DELETE_GROUP,
  CANCEL_BET,
} from "@/graphql/mutations";
import { Member, BetGroup } from "@types";

export default function GroupDetailsScreen({ route, navigation }: any) {
  const { groupId, groupName } = route.params;
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [inviteMembersModalVisible, setInviteMembersModalVisible] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [selectedMembersToInvite, setSelectedMembersToInvite] = useState<string[]>([]);

  // Fetch current user
  const { data: meData } = useQuery(GET_ME);
  const currentUserId = meData?.me?.id;

  // Fetch group details
  const {
    data: groupsData,
    loading: groupLoading,
    refetch: refetchGroup,
  } = useQuery(GET_MY_BET_GROUPS, {
    fetchPolicy: "network-only",
  });

  // Fetch friends for inviting
  const { data: friendsData } = useQuery(GET_MY_FRIENDS);
  const friends = friendsData?.myFriends || [];

  const group: BetGroup | undefined = groupsData?.myBetGroups?.find((g: BetGroup) => g.id === groupId);

  // Mutations
  const [updateBetGroup, { loading: updating }] = useMutation(UPDATE_BET_GROUP, {
    onCompleted: () => {
      refetchGroup();
      setEditModalVisible(false);
      Alert.alert("Success", "Group updated successfully");
    },
  });

  const [addGroupMembers, { loading: adding }] = useMutation(ADD_GROUP_MEMBERS, {
    onCompleted: (data) => {
      console.log("Members added successfully:", data);
      refetchGroup();
      setInviteMembersModalVisible(false);
      setSelectedMembersToInvite([]);
      Alert.alert("Success", "Members invited successfully");
    },
    onError: (error) => {
      console.error("Error adding members:", error);
      Alert.alert("Error", error.message || "Failed to invite members");
    },
  });

  const [removeGroupMember, { loading: removing }] = useMutation(REMOVE_GROUP_MEMBER, {
    onCompleted: () => {
      refetchGroup();
      Alert.alert("Success", "Member removed from group");
    },
  });

  const [leaveGroup, { loading: leaving }] = useMutation(LEAVE_GROUP, {
    onCompleted: () => {
      Alert.alert("Success", "You have left the group", [{ text: "OK", onPress: () => navigation.goBack() }]);
    },
  });

  const [deleteGroup, { loading: deleting }] = useMutation(DELETE_GROUP, {
    onCompleted: () => {
      Alert.alert("Success", "Group deleted successfully", [{ text: "OK", onPress: () => navigation.goBack() }]);
    },
  });

  const [cancelBet] = useMutation(CANCEL_BET, {
    onCompleted: () => {
      refetchGroup();
      Alert.alert("Success", "Bet cancelled successfully");
    },
  });

  const isOwner = group?.owner.id === currentUserId;

  // Get friends not already in group
  const availableFriendsToInvite = friends.filter(
    (friend: any) => !group?.members.some((m) => m.user.id === friend.id),
  );

  const handleEditGroup = () => {
    if (!group) return;
    setEditedName(group.name);
    setEditedDescription(group.description || "");
    setEditModalVisible(true);
    setSettingsModalVisible(false);
  };

  const handleSaveEdit = async () => {
    if (!editedName.trim()) {
      Alert.alert("Error", "Group name cannot be empty");
      return;
    }

    try {
      await updateBetGroup({
        variables: {
          groupId,
          name: editedName,
          description: editedDescription || null,
        },
      });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update group");
    }
  };

  const handleInviteMembers = () => {
    setInviteMembersModalVisible(true);
    setSettingsModalVisible(false);
  };

  const handleSaveInvite = async () => {
    console.log("handleSaveInvite called");
    console.log("selectedMembersToInvite:", selectedMembersToInvite);
    console.log("groupId:", groupId);

    if (selectedMembersToInvite.length === 0) {
      Alert.alert("Error", "Please select at least one friend to invite");
      return;
    }

    try {
      console.log("Calling addGroupMembers mutation...");
      await addGroupMembers({
        variables: {
          groupId,
          displayNames: selectedMembersToInvite,
        },
      });
      console.log("Mutation completed");
    } catch (error: any) {
      console.error("Caught error in handleSaveInvite:", error);
      Alert.alert("Error", error.message || "Failed to invite members");
    }
  };

  const handleKickMember = (memberId: string, memberName: string) => {
    Alert.alert("Remove Member", `Are you sure you want to remove ${memberName} from this group?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeGroupMember({
              variables: { groupId, userId: memberId },
            });
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to remove member");
          }
        },
      },
    ]);
  };

  const handleLeaveGroup = () => {
    Alert.alert("Leave Group", "Are you sure you want to leave this group?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            await leaveGroup({ variables: { groupId } });
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to leave group");
          }
        },
      },
    ]);
  };

  const handleDeleteGroup = () => {
    Alert.alert("Delete Group", "Are you sure you want to delete this group? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteGroup({ variables: { groupId } });
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete group");
          }
        },
      },
    ]);
  };

  const handleCancelBet = (betId: string, betTitle: string) => {
    Alert.alert("Cancel Bet", `Are you sure you want to cancel "${betTitle}"?`, [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelBet({ variables: { betId } });
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to cancel bet");
          }
        },
      },
    ]);
  };

  const toggleMemberToInvite = (displayName: string) => {
    setSelectedMembersToInvite((prev) =>
      prev.includes(displayName) ? prev.filter((d) => d !== displayName) : [...prev, displayName],
    );
  };

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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderMember = ({ item }: { item: Member }) => (
    <View style={styles.memberCard}>
      {/* <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>{item.user.displayName.charAt(0).toUpperCase()}</Text>
      </View> */}
      <View style={styles.memberAvatar}>
        {item.user.profileImage ? (
          <Image
            source={{
              uri: item.user.profileImage.startsWith('data:')
                ? item.user.profileImage
                : `data:image/png;base64,${item.user.profileImage}`
            }}
            style={styles.memberAvatar}
            />
        ) : (
          <Ionicons name="person" size={32} color="#8E8E93" />
        )}
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.user.displayName}</Text>
        <Text style={styles.memberEmail}>{item.user.email}</Text>
        <Text style={styles.memberJoined}>Joined {new Date(item.joinedAt).toLocaleDateString()}</Text>
      </View>
      {group.owner.id === item.user.id && (
        <View style={styles.ownerBadge}>
          <Text style={styles.ownerBadgeText}>Owner</Text>
        </View>
      )}
      {isOwner && group.owner.id !== item.user.id && (
        <TouchableOpacity
          onPress={() => handleKickMember(item.user.id, item.user.displayName)}
          style={styles.kickButton}
        >
          <Ionicons name="close-circle" size={24} color="#FF3B30" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{group.name}</Text>
          <Text style={styles.headerSubtitle}>
            {group.members.length} {group.members.length === 1 ? "member" : "members"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setSettingsModalVisible(true)} style={styles.settingsButton}>
          <Ionicons name="settings" size={24} color="#000" />
        </TouchableOpacity>
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
            {isOwner && (
              <TouchableOpacity onPress={handleInviteMembers} style={styles.addButton}>
                <Ionicons name="person-add" size={20} color="#007AFF" />
                <Text style={styles.addButtonText}>Invite</Text>
              </TouchableOpacity>
            )}
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
              <Text style={styles.emptyStateSubtext}>Create a bet to get started</Text>
            </View>
          ) : (
            <View style={styles.betsContainer}>
              {group.bets.map((bet) => (
                <TouchableOpacity
                  key={bet.id}
                  style={styles.betCard}
                  onPress={() => navigation.navigate("SubmitProof", { bet })}
                >
                  <View style={styles.betCardLeft}>
                    <Text style={styles.betTitle}>{bet.title}</Text>
                    <Text style={styles.betStatus}>{bet.status}</Text>
                  </View>
                  {isOwner && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleCancelBet(bet.id, bet.title);
                      }}
                      style={styles.cancelBetButton}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={settingsModalVisible}
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Group Settings</Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.settingsList}>
              {isOwner && (
                <>
                  <TouchableOpacity style={styles.settingItem} onPress={handleEditGroup}>
                    <Ionicons name="create-outline" size={24} color="#007AFF" />
                    <Text style={styles.settingText}>Edit Group Info</Text>
                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.settingItem} onPress={handleInviteMembers}>
                    <Ionicons name="person-add-outline" size={24} color="#007AFF" />
                    <Text style={styles.settingText}>Invite Members</Text>
                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.settingItem} onPress={handleDeleteGroup}>
                    <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                    <Text style={[styles.settingText, styles.dangerText]}>Delete Group</Text>
                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                  </TouchableOpacity>
                </>
              )}
              {!isOwner && (
                <TouchableOpacity style={styles.settingItem} onPress={handleLeaveGroup}>
                  <Ionicons name="exit-outline" size={24} color="#FF3B30" />
                  <Text style={[styles.settingText, styles.dangerText]}>Leave Group</Text>
                  <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Group Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Group</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Group Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter group name"
                value={editedName}
                onChangeText={setEditedName}
              />
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter description"
                value={editedDescription}
                onChangeText={setEditedDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit} disabled={updating}>
                {updating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Invite Members Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={inviteMembersModalVisible}
        onRequestClose={() => setInviteMembersModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Members</Text>
              <TouchableOpacity
                onPress={() => {
                  setInviteMembersModalVisible(false);
                  setSelectedMembersToInvite([]);
                }}
              >
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Select Friends to Invite ({selectedMembersToInvite.length} selected)</Text>
              {availableFriendsToInvite.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>All friends are already members</Text>
                </View>
              ) : (
                availableFriendsToInvite.map((friend: any) => {
                  const isSelected = selectedMembersToInvite.includes(friend.displayName);
                  return (
                    <TouchableOpacity
                      key={friend.id}
                      style={[styles.friendSelectItem, isSelected && styles.friendSelectItemSelected]}
                      onPress={() => toggleMemberToInvite(friend.displayName)}
                    >
                      <View style={styles.friendAvatar}>
                        <Text style={styles.friendAvatarText}>{friend.displayName.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{friend.displayName}</Text>
                        <Text style={styles.friendEmail}>{friend.email}</Text>
                      </View>
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveInvite}
                disabled={adding || selectedMembersToInvite.length === 0}
              >
                {adding ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Invite Selected</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  settingsButton: {
    padding: 8,
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
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
  kickButton: {
    padding: 4,
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
  betCardLeft: {
    flex: 1,
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
    marginTop: 4,
  },
  cancelBetButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  modalBody: {
    padding: 20,
  },
  settingsList: {
    padding: 20,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    gap: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  dangerText: {
    color: "#FF3B30",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  friendSelectItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    marginBottom: 8,
  },
  friendSelectItemSelected: {
    backgroundColor: "#E3F2FD",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  friendAvatarText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  friendEmail: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#C7C7CC",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
});
