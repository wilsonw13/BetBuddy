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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "@apollo/client";
import { GET_MY_FRIENDS } from "@/graphql/queries";
import { SEND_FRIEND_REQUEST, REMOVE_FRIEND } from "@/graphql/mutations";
import { Friend } from "@types";

export default function FriendGroupsScreen({ navigation, route }: any) {
  const groupName = route?.params?.groupName || "All Friends";
  const [addFriendModalVisible, setAddFriendModalVisible] = useState(false);
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [newFriendDisplayName, setNewFriendDisplayName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");

  // Fetch friends
  const {
    data: friendsData,
    loading: friendsLoading,
    refetch: refetchFriends,
  } = useQuery(GET_MY_FRIENDS, {
    fetchPolicy: "network-only", // Always fetch from network, not cache
  });

  // Mutations
  const [sendFriendRequest, { loading: sendingRequest }] = useMutation(SEND_FRIEND_REQUEST);
  const [removeFriend, { loading: removingFriend }] = useMutation(REMOVE_FRIEND);

  const friends: Friend[] = friendsData?.myFriends || [];

  // Debug logging
  React.useEffect(() => {
    console.log("Friends data updated:", friends.length, "friends");
  }, [friends.length]);

  const handleAddFriend = async () => {
    if (!newFriendDisplayName.trim()) {
      Alert.alert("Error", "Please enter a display name");
      return;
    }

    try {
      await sendFriendRequest({
        variables: { toDisplayName: newFriendDisplayName },
      });
      Alert.alert("Friend Request Sent", `Invitation sent to ${newFriendDisplayName}`);
      setNewFriendDisplayName("");
      setAddFriendModalVisible(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send friend request");
    }
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    // TODO: Groups functionality - will be implemented later
    setNewGroupName("");
    setCreateGroupModalVisible(false);
    Alert.alert("Coming Soon", "Friend groups feature is coming soon!");
  };

  const handleRemoveFriend = (friend: Friend) => {
    Alert.alert("Remove Friend", `Remove ${friend.displayName} from your friends?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeFriend({
              variables: { friendId: friend.id },
            });
            Alert.alert("Success", `${friend.displayName} removed from friends`);
            refetchFriends();
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to remove friend");
          }
        },
      },
    ]);
  };


  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={styles.friendCard}
      onPress={() => {
        // TODO: Navigate to friend's profile
        Alert.alert("View Profile", `View ${item.displayName}'s profile`);
      }}
    >

      {/* console.log("Rendering friend:", item.displayName); */}
      {/* console.log("Friend data:", item.profileImage); */}
      
      <View style={styles.friendAvatar}>
        {item.profileImage ? (
          <Image 
            source={{ uri: item.profileImage.startsWith('data:')
              ? item.profileImage
              : `data:image/jpeg;base64,${item.profileImage}`         
          }} 
          style={styles.avatarImage} />
        ) : (
          <Ionicons name="person" size={32} color="#8E8E93" />
        )}
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.displayName}</Text>
        <Text style={styles.friendEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity onPress={() => handleRemoveFriend(item)} style={styles.removeButton}>
        <Ionicons name="close-circle" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (friendsLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading friends...</Text>
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
          <Text style={styles.headerTitle}>Friends</Text>
          <Text style={styles.headerSubtitle}>
            {friends.length} {friends.length === 1 ? "friend" : "friends"}
          </Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setAddFriendModalVisible(true)}
          disabled={sendingRequest}
        >
          <Ionicons name="person-add" size={20} color="white" />
          <Text style={styles.actionButtonText}>Add Friend</Text>
        </TouchableOpacity>
      </View>

      {/* Friends List */}
      <FlatList
        data={friends}
        renderItem={renderFriend}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.friendsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyStateText}>No friends yet</Text>
            <Text style={styles.emptyStateSubtext}>Tap "Add Friend" to invite someone</Text>
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
              <Text style={styles.modalLabel}>Friend's Display Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter display name"
                value={newFriendDisplayName}
                onChangeText={setNewFriendDisplayName}
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
  headerButton: {
    padding: 8,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
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
