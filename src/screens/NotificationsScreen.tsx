import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "@apollo/client";
import { GET_MY_NOTIFICATIONS, GET_UNREAD_NOTIFICATION_COUNT, GET_MY_BETS, GET_MY_FRIEND_REQUESTS, GET_MY_FRIENDS } from "@/graphql/queries";
import {
  MARK_NOTIFICATION_AS_READ,
  MARK_ALL_NOTIFICATIONS_AS_READ,
  DELETE_NOTIFICATION,
  ACCEPT_FRIEND_REQUEST,
  DECLINE_FRIEND_REQUEST,
  ACCEPT_BET,
  DECLINE_BET,
} from "@/graphql/mutations";
import { Notification, FriendRequest } from "@types";

export default function NotificationsScreen({ navigation }: any) {
  const { data, loading, refetch } = useQuery(GET_MY_NOTIFICATIONS, {
    fetchPolicy: "network-only",
  });

  const { data: friendRequestsData, loading: friendRequestsLoading, refetch: refetchFriendRequests } = useQuery(GET_MY_FRIEND_REQUESTS, {
    fetchPolicy: "network-only",
  });

  const [markAsRead] = useMutation(MARK_NOTIFICATION_AS_READ, {
    refetchQueries: [{ query: GET_MY_NOTIFICATIONS }, { query: GET_UNREAD_NOTIFICATION_COUNT }],
  });

  const [markAllAsRead] = useMutation(MARK_ALL_NOTIFICATIONS_AS_READ, {
    refetchQueries: [{ query: GET_MY_NOTIFICATIONS }, { query: GET_UNREAD_NOTIFICATION_COUNT }],
  });

  const [deleteNotification] = useMutation(DELETE_NOTIFICATION, {
    refetchQueries: [{ query: GET_MY_NOTIFICATIONS }, { query: GET_UNREAD_NOTIFICATION_COUNT }],
  });

  const [acceptFriendRequest] = useMutation(ACCEPT_FRIEND_REQUEST, {
    refetchQueries: [{ query: GET_MY_FRIENDS }, { query: GET_MY_FRIEND_REQUESTS }],
    onCompleted: () => {
      Alert.alert("Success", "Friend request accepted!");
      refetch();
      refetchFriendRequests();
    },
  });

  const [declineFriendRequest] = useMutation(DECLINE_FRIEND_REQUEST, {
    refetchQueries: [{ query: GET_MY_FRIEND_REQUESTS }],
    onCompleted: () => {
      Alert.alert("Success", "Friend request declined");
      refetch();
      refetchFriendRequests();
    },
  });

  const [acceptBet] = useMutation(ACCEPT_BET, {
    refetchQueries: [{ query: GET_MY_BETS }, { query: GET_MY_NOTIFICATIONS }],
    awaitRefetchQueries: true,
    onCompleted: () => {
      Alert.alert("Success", "Bet accepted!");
      refetch();
    },
  });

  const [declineBet] = useMutation(DECLINE_BET, {
    refetchQueries: [{ query: GET_MY_BETS }, { query: GET_MY_NOTIFICATIONS }],
    awaitRefetchQueries: true,
    onCompleted: () => {
      Alert.alert("Success", "Bet declined");
      refetch();
    },
  });

  const notifications: Notification[] = data?.myNotifications || [];
  const friendRequests: FriendRequest[] = friendRequestsData?.myFriendRequests || [];

  // Convert friend requests to notification-like items for unified display
  const friendRequestNotifications = friendRequests.map((request) => ({
    id: `fr-${request.id}`,
    type: "friend_request",
    title: "Friend Request",
    message: `${request.fromUser.displayName} sent you a friend request`,
    isRead: false, // Friend requests are always unread until acted upon
    metadata: {
      friendRequestId: request.id,
      fromUser: request.fromUser,
    },
    createdAt: request.createdAt,
  }));

  // Merge and sort all notifications by date
  const allNotifications = [...notifications, ...friendRequestNotifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length + friendRequests.length;

  const handleNotificationPress = async (notification: Notification) => {
    // Don't mark friend request pseudo-notifications as read
    if (!notification.isRead && !notification.id.startsWith('fr-')) {
      await markAsRead({ variables: { notificationId: notification.id } });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      Alert.alert("Success", "All notifications marked as read");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to mark all as read");
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      // If it's a friend request pseudo-notification, decline it instead
      if (notificationId.startsWith('fr-')) {
        const friendRequestId = notificationId.replace('fr-', '');
        await declineFriendRequest({ variables: { requestId: friendRequestId } });
      } else {
        await deleteNotification({ variables: { notificationId } });
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to delete notification");
    }
  };

  const handleAcceptFriendRequest = async (friendRequestId: string, notificationId: string) => {
    try {
      await acceptFriendRequest({ variables: { requestId: friendRequestId } });
      // Only delete if it's a regular notification (not a friend request pseudo-notification)
      if (!notificationId.startsWith('fr-')) {
        await deleteNotification({ variables: { notificationId } });
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to accept friend request");
    }
  };

  const handleDeclineFriendRequest = async (friendRequestId: string, notificationId: string) => {
    try {
      await declineFriendRequest({ variables: { requestId: friendRequestId } });
      // Only delete if it's a regular notification (not a friend request pseudo-notification)
      if (!notificationId.startsWith('fr-')) {
        await deleteNotification({ variables: { notificationId } });
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to decline friend request");
    }
  };

  const handleAcceptBet = async (betId: string, notificationId: string) => {
    try {
      // Backend now automatically deletes bet notifications when accepting
      await acceptBet({ variables: { betId } });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to accept bet");
    }
  };

  const handleDeclineBet = async (betId: string, notificationId: string) => {
    try {
      // Backend now automatically deletes all bet notifications when declining
      await declineBet({ variables: { betId } });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to decline bet");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "friend_request":
        return "people";
      case "group_invite":
        return "people-circle";
      case "bet_invite":
        return "hand-left";
      default:
        return "notifications";
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.isRead && styles.notificationCardUnread]}
      onPress={() => handleNotificationPress(item)}
    >
      {/* Show user avatar for friend requests */}
      {item.type === "friend_request" && item.metadata?.fromUser?.profileImage ? (
        <View style={styles.notificationIcon}>
          <Image
            source={{
              uri: item.metadata.fromUser.profileImage.startsWith("data:")
                ? item.metadata.fromUser.profileImage
                : `data:image/jpeg;base64,${item.metadata.fromUser.profileImage}`,
            }}
            style={styles.notificationAvatar}
          />
        </View>
      ) : (
        <View style={styles.notificationIcon}>
          <Ionicons name={getNotificationIcon(item.type)} size={24} color={item.isRead ? "#8E8E93" : "#007AFF"} />
        </View>
      )}
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, !item.isRead && styles.notificationTitleUnread]}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>

        {/* Show bet details if it's a bet invitation */}
        {item.type === "bet_invite" && item.metadata && (
          <View style={styles.betDetails}>
            <View style={styles.betDetailRow}>
              <Ionicons name="time-outline" size={14} color="#8E8E93" />
              <Text style={styles.betDetailText}>
                {item.metadata.frequency} • {item.metadata.betLength} days
              </Text>
            </View>
            <View style={styles.betDetailRow}>
              <Ionicons name="trophy-outline" size={14} color="#8E8E93" />
              <Text style={styles.betDetailText}>{item.metadata.moneyStaked} points</Text>
            </View>
          </View>
        )}

        {/* Action buttons */}
        {item.type === "friend_request" && item.metadata?.friendRequestId && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAcceptFriendRequest(item.metadata.friendRequestId, item.id)}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => handleDeclineFriendRequest(item.metadata.friendRequestId, item.id)}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.type === "bet_invite" && item.metadata?.betId && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAcceptBet(item.metadata.betId, item.id)}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => handleDeclineBet(item.metadata.betId, item.id)}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.type === "group_invite" && item.metadata?.groupId && (
          <TouchableOpacity
            style={styles.viewGroupButton}
            onPress={() => {
              navigation.navigate("GroupDetails", {
                groupId: item.metadata.groupId,
                groupName: item.metadata.groupName,
              });
              handleNotificationPress(item);
            }}
          >
            <Text style={styles.viewGroupButtonText}>View Group</Text>
            <Ionicons name="chevron-forward" size={16} color="#007AFF" />
          </TouchableOpacity>
        )}

        <Text style={styles.notificationTime}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
        <Ionicons name="close" size={20} color="#8E8E93" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading || friendRequestsLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
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
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
            <Ionicons name="checkmark-done" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={allNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyStateText}>No notifications</Text>
            <Text style={styles.emptyStateSubtext}>You're all caught up!</Text>
          </View>
        }
      />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  headerBadge: {
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  headerBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  markAllButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: "row",
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
  notificationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    backgroundColor: "#F0F9FF",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  notificationTitleUnread: {
    fontWeight: "700",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 8,
    lineHeight: 20,
  },
  betDetails: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  betDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  betDetailText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "#007AFF",
  },
  acceptButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  declineButton: {
    backgroundColor: "#F2F2F7",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  declineButtonText: {
    color: "#8E8E93",
    fontSize: 14,
    fontWeight: "600",
  },
  viewGroupButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
  },
  viewGroupButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  notificationTime: {
    fontSize: 12,
    color: "#C7C7CC",
    marginTop: 8,
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
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
});
