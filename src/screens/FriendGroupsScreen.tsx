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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Friend {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  successRate: number;
  totalBets: number;
  rank: string;
}

interface FriendGroup {
  id: string;
  name: string;
  friends: Friend[];
}

// Mock data - replace with real data from backend
const mockFriendGroups: FriendGroup[] = [
  {
    id: "1",
    name: "Friends",
    friends: [
      {
        id: "f1",
        name: "Alex Johnson",
        email: "alex@example.com",
        successRate: 0.75,
        totalBets: 15,
        rank: "intermediate",
      },
      {
        id: "f2",
        name: "Sarah Williams",
        email: "sarah@example.com",
        successRate: 0.9,
        totalBets: 25,
        rank: "advanced",
      },
      {
        id: "f3",
        name: "Mike Chen",
        email: "mike@example.com",
        successRate: 0.65,
        totalBets: 10,
        rank: "beginner",
      },
    ],
  },
  {
    id: "2",
    name: "Gym Buddies",
    friends: [
      {
        id: "f4",
        name: "David Kim",
        email: "david@example.com",
        successRate: 0.8,
        totalBets: 20,
        rank: "intermediate",
      },
      {
        id: "f5",
        name: "Emma Davis",
        email: "emma@example.com",
        successRate: 0.95,
        totalBets: 30,
        rank: "legendary",
      },
    ],
  },
];

export default function FriendGroupsScreen({ navigation, route }: any) {
  const groupName = route?.params?.groupName || "All Friends";
  const [friendGroups, setFriendGroups] = useState<FriendGroup[]>(mockFriendGroups);
  const [addFriendModalVisible, setAddFriendModalVisible] = useState(false);
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [newFriendEmail, setNewFriendEmail] = useState("");
  const [newGroupName, setNewGroupName] = useState("");

  // Get all friends or filter by group
  const displayedGroup = groupName === "All Friends"
    ? { id: "all", name: "All Friends", friends: friendGroups.flatMap(g => g.friends) }
    : friendGroups.find(g => g.name === groupName) || friendGroups[0];

  const handleAddFriend = () => {
    if (!newFriendEmail.trim()) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }

    // TODO: Backend API call to send friend request
    Alert.alert("Friend Request Sent", `Invitation sent to ${newFriendEmail}`);
    setNewFriendEmail("");
    setAddFriendModalVisible(false);
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    const newGroup: FriendGroup = {
      id: Date.now().toString(),
      name: newGroupName,
      friends: [],
    };

    setFriendGroups([...friendGroups, newGroup]);
    setNewGroupName("");
    setCreateGroupModalVisible(false);
    Alert.alert("Success", `Created group "${newGroupName}"`);
  };

  const handleRemoveFriend = (friend: Friend) => {
    Alert.alert(
      "Remove Friend",
      `Remove ${friend.name} from ${displayedGroup.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            // TODO: Backend API call to remove friend
            Alert.alert("Success", `${friend.name} removed from group`);
          },
        },
      ]
    );
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={styles.friendCard}
      onPress={() => {
        // TODO: Navigate to friend's profile
        Alert.alert("View Profile", `View ${item.name}'s profile`);
      }}
    >
      <View style={styles.friendAvatar}>
        {item.profilePicture ? (
          <Image source={{ uri: item.profilePicture }} style={styles.avatarImage} />
        ) : (
          <Ionicons name="person" size={32} color="#8E8E93" />
        )}
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendEmail}>{item.email}</Text>
        <View style={styles.friendStats}>
          <Text style={styles.friendStatText}>
            {(item.successRate * 100).toFixed(0)}% Success
          </Text>
          <Text style={styles.friendStatDivider}>•</Text>
          <Text style={styles.friendStatText}>{item.totalBets} Bets</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleRemoveFriend(item)}
        style={styles.removeButton}
      >
        <Ionicons name="close-circle" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{displayedGroup.name}</Text>
          <Text style={styles.headerSubtitle}>
            {displayedGroup.friends.length} {displayedGroup.friends.length === 1 ? 'friend' : 'friends'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setCreateGroupModalVisible(true)} style={styles.headerButton}>
          <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setAddFriendModalVisible(true)}
        >
          <Ionicons name="person-add" size={20} color="white" />
          <Text style={styles.actionButtonText}>Add Friend</Text>
        </TouchableOpacity>

        {groupName !== "All Friends" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => {
              Alert.alert("Manage Group", "Group management options");
            }}
          >
            <Ionicons name="settings-outline" size={20} color="#007AFF" />
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
              Manage Group
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Friends List */}
      <FlatList
        data={displayedGroup.friends}
        renderItem={renderFriend}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.friendsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyStateText}>No friends in this group yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap "Add Friend" to invite someone
            </Text>
          </View>
        }
      />

      {/* Add Friend Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addFriendModalVisible}
        onRequestClose={() => setAddFriendModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Friend</Text>
              <TouchableOpacity onPress={() => setAddFriendModalVisible(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Friend's Email</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter email address"
                value={newFriendEmail}
                onChangeText={setNewFriendEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.modalButton} onPress={handleAddFriend}>
                <Text style={styles.modalButtonText}>Send Invitation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              <Text style={styles.modalTitle}>Create Group</Text>
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
              <TouchableOpacity style={styles.modalButton} onPress={handleCreateGroup}>
                <Text style={styles.modalButtonText}>Create Group</Text>
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
  headerButton: {
    padding: 8,
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
  actionButtonSecondary: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  actionButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  actionButtonTextSecondary: {
    color: "#007AFF",
  },
  friendsList: {
    padding: 16,
  },
  friendCard: {
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
  friendAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  friendEmail: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 6,
  },
  friendStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  friendStatText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
  friendStatDivider: {
    fontSize: 12,
    color: "#C7C7CC",
    marginHorizontal: 6,
  },
  removeButton: {
    padding: 8,
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
