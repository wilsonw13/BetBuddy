import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "@apollo/client";
import { GET_MY_BET_GROUPS } from "@/graphql/queries";
import { CREATE_BET_GROUP, ADD_GROUP_MEMBERS, REMOVE_GROUP_MEMBER } from "@/graphql/mutations";

interface BetGroup {
  id: string;
  name: string;
  description?: string;
  owner: {
    id: string;
    displayName: string;
    email: string;
  };
  members: Array<{
    id: string;
    user: {
      id: string;
      displayName: string;
      email: string;
      profilePicture?: string;
    };
  }>;
  bets: Array<any>; // Will be typed properly later
  createdAt: string;
}

export default function BetGroupsScreen({ navigation }: any) {
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Fetch bet groups
  const {
    data: groupsData,
    loading: groupsLoading,
    refetch: refetchGroups,
  } = useQuery(GET_MY_BET_GROUPS, {
    fetchPolicy: "network-only", // Always fetch from network, not cache
  });

  // Mutations
  const [createBetGroup, { loading: creatingGroup }] = useMutation(CREATE_BET_GROUP);
  const [addGroupMembers, { loading: addingMembers }] = useMutation(ADD_GROUP_MEMBERS);
  const [removeGroupMember, { loading: removingMember }] = useMutation(REMOVE_GROUP_MEMBER);

  const groups: BetGroup[] = groupsData?.myBetGroups || [];

  // Debug logging
  React.useEffect(() => {
    console.log("Bet groups data updated:", groups.length, "groups");
  }, [groups.length]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    try {
      const result = await createBetGroup({
        variables: {
          input: {
            name: newGroupName,
            description: newGroupDescription || null,
            memberUsernames: selectedMembers, // This should be usernames, not IDs
          },
        },
      });

      Alert.alert("Success", `Group "${newGroupName}" created successfully!`);
      setNewGroupName("");
      setNewGroupDescription("");
      setSelectedMembers([]);
      setCreateGroupModalVisible(false);
      refetchGroups();
    } catch (error: any) {
      console.error("Create group error:", error);
      Alert.alert("Error", error.message || "Failed to create group");
    }
  };

  const handleGroupPress = (group: BetGroup) => {
    // Navigate to group details screen (to be implemented)
    navigation.navigate("GroupDetails", { groupId: group.id, groupName: group.name });
  };

  const renderGroup = ({ item }: { item: BetGroup }) => (
    <TouchableOpacity style={styles.groupCard} onPress={() => handleGroupPress(item)}>
      <View style={styles.groupIcon}>
        <Ionicons name="people-circle" size={48} color="#007AFF" />
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        {item.description && <Text style={styles.groupDescription}>{item.description}</Text>}
        <View style={styles.groupStats}>
          <View style={styles.groupStat}>
            <Ionicons name="people" size={14} color="#8E8E93" />
            <Text style={styles.groupStatText}>
              {item.members.length} {item.members.length === 1 ? "member" : "members"}
            </Text>
          </View>
          <View style={styles.groupStat}>
            <Ionicons name="trophy" size={14} color="#8E8E93" />
            <Text style={styles.groupStatText}>
              {item.bets.length} {item.bets.length === 1 ? "bet" : "bets"}
            </Text>
          </View>
        </View>
        <Text style={styles.groupOwner}>Created by {item.owner.displayName}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  if (groupsLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading groups...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Bet Groups</Text>
          <Text style={styles.headerSubtitle}>
            {groups.length} {groups.length === 1 ? "group" : "groups"}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setCreateGroupModalVisible(true)}
          disabled={creatingGroup}
        >
          <Ionicons name="add-circle" size={20} color="white" />
          <Text style={styles.actionButtonText}>Create Group</Text>
        </TouchableOpacity>
      </View>

      {/* Groups List */}
      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.groupsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-circle-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyStateText}>No groups yet</Text>
            <Text style={styles.emptyStateSubtext}>Create or join a group to start betting with friends</Text>
          </View>
        }
      />

      {/* Create Group Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createGroupModalVisible}
        onRequestClose={() => setCreateGroupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Bet Group</Text>
              <TouchableOpacity onPress={() => setCreateGroupModalVisible(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Group Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter group name"
                value={newGroupName}
                onChangeText={setNewGroupName}
                autoCapitalize="words"
              />

              <Text style={styles.modalLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Enter group description"
                value={newGroupDescription}
                onChangeText={setNewGroupDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <TouchableOpacity style={styles.modalButton} onPress={handleCreateGroup} disabled={creatingGroup}>
                {creatingGroup ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>Create Group</Text>
                )}
              </TouchableOpacity>
            </View>
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
  backButton: {
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
    width: 40, // Same width as back button to center title
  },
  actionButtons: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  actionButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  groupsList: {
    padding: 16,
  },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  groupIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 8,
  },
  groupStats: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  groupStat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  groupStatText: {
    fontSize: 12,
    color: "#8E8E93",
    marginLeft: 4,
  },
  groupOwner: {
    fontSize: 11,
    color: "#C7C7CC",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#8E8E93",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#C7C7CC",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
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
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  modalTextArea: {
    height: 80,
  },
  modalButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
