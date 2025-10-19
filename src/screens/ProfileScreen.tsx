import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { User, RedeemableItem, UserRank } from "@types";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@apollo/client";
import { GET_UNREAD_NOTIFICATION_COUNT, GET_MY_FRIEND_REQUESTS } from "@/graphql/queries";
import { UPDATE_PROFILE_IMAGE, UPDATE_BANNER_IMAGE } from "@/graphql/mutations";
import * as ImagePicker from "expo-image-picker";

import { GET_ME, GET_GLOBAL_LEADERBOARD } from "@/graphql/queries";

// Mock data - replace with real data from your backend
const mockUser: User = {
  id: "currentUser",
  name: "You",
  successRate: 0.85,
  totalBets: 20,
  successfulBets: 17,
  points: 850,
  rank: "advanced",
  friendGroups: ["Friends", "Groups"],
  pranksActive: [],
};

const redeemableItems: RedeemableItem[] = [
  {
    id: "1",
    name: "Draw on Banner",
    description: "Draw on your opponent's banner for 24 hours",
    pointsCost: 200,
    type: "prank",
    duration: 24,
  },
  {
    id: "2",
    name: "Chinese Mode",
    description: "Change opponent's app to Chinese for 12 hours",
    pointsCost: 150,
    type: "prank",
    duration: 12,
  },
  {
    id: "3",
    name: "Icon Swap",
    description: "Change opponent's app icon for 48 hours",
    pointsCost: 300,
    type: "prank",
    duration: 48,
  },
  {
    id: "4",
    name: "Loading Screen",
    description: "Customize opponent's loading screen for 24 hours",
    pointsCost: 250,
    type: "prank",
    duration: 24,
  },
  {
    id: "5",
    name: "Profile Border",
    description: "Add a special border to your profile",
    pointsCost: 500,
    type: "cosmetic",
  },
  {
    id: "6",
    name: "Custom Badge",
    description: "Create a custom achievement badge",
    pointsCost: 400,
    type: "cosmetic",
  },
];

const getRankInfo = (rank: UserRank) => {
  switch (rank) {
    case "legendary":
      return { color: "#FFD700", icon: "sparkles", label: "Legendary" };
    case "advanced":
      return { color: "#C0C0C0", icon: "star", label: "Advanced" };
    case "intermediate":
      return { color: "#CD7F32", icon: "ribbon", label: "Intermediate" };
    default:
      return { color: "#8E8E93", icon: "leaf", label: "Beginner" };
  }
};

export default function ProfileScreen({ navigation }: any) {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS

  const { data, loading, error, refetch } = useQuery(GET_ME);
  const {
    data: leaderboardData,
    loading: leaderboardLoading,
    error: leaderboardError,
  } = useQuery(GET_GLOBAL_LEADERBOARD);
  const [, setUser] = useState<User | null>(null);
  const [shopModalVisible, setShopModalVisible] = useState(false);
  const { logout } = useAuth();
  const { data: notificationData } = useQuery(GET_UNREAD_NOTIFICATION_COUNT, {
    pollInterval: 10000, // Poll every 10 seconds
  });
  const { data: friendRequestsData } = useQuery(GET_MY_FRIEND_REQUESTS, {
    pollInterval: 10000, // Poll every 10 seconds
    fetchPolicy: "network-only",
  });
  const [uploading, setUploading] = useState(false);
  const [updateProfileImage] = useMutation(UPDATE_PROFILE_IMAGE);
  const [updateBannerImage] = useMutation(UPDATE_BANNER_IMAGE);

  // Loading state
  if (loading) {
    return (
      <View>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  // Error state
  if (error || !data?.me) {
    return (
      <View>
        <Ionicons name="alert-circle" size={64} color="#FF3B30" />
        <Text>Failed to load profile</Text>
      </View>
    );
  }

  const currentUser = data.me;

  const myLeaderboardEntry = leaderboardData?.globalLeaderboard?.find((entry: any) => {
    return entry.userId === currentUser.id;
  });
  // console.log("Current User Data:", data.me);
  // Mock data for now since the backend doesn't have these fields yet
  const { profileImage, bannerImage, ...withoutImages } = myLeaderboardEntry || {};
  const user = {
    ...currentUser,
    name: currentUser.displayName,
    rank: "beginner" as UserRank,

    points: myLeaderboardEntry?.score ?? 69,
    leaderboardRank: myLeaderboardEntry?.leaderboardRank ?? 69,
    successfulBets: myLeaderboardEntry?.successfulBets ?? 69,
    totalBets: myLeaderboardEntry?.totalBets ?? 69,

    bannerImage: currentUser.bannerImage
      ? currentUser.bannerImage.startsWith("data:")
        ? currentUser.bannerImage
        : `data:image/png;base64,${currentUser.bannerImage}`
      : null,
    friendGroups: ["Friends", "Groups"],
    profileImage: currentUser.profileImage
      ? currentUser.profileImage.startsWith("data:")
        ? currentUser.profileImage
        : `data:image/png;base64,${currentUser.profileImage}`
      : null,
  };
  //console.log(user)

  const rankInfo = getRankInfo(user.rank);
  const friendRequestCount = friendRequestsData?.myFriendRequests?.length || 0;
  const unreadCount = (notificationData?.unreadNotificationCount || 0) + friendRequestCount;

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  const handleRedeem = (item: RedeemableItem) => {
    if (user.points < item.pointsCost) {
      Alert.alert("Not Enough Points", "You need more points to redeem this item.");
      return;
    }

    Alert.alert("Redeem Item", `Redeem "${item.name}" for ${item.pointsCost} points?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Redeem",
        onPress: () => {
          setUser({ ...user, points: user.points - item.pointsCost });
          Alert.alert("Success", `You redeemed "${item.name}"!`);
          setShopModalVisible(false);
        },
      },
    ]);
  };

  const handleChangeProfileImage = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Please allow access to your photo library.");
      return;
    }
    // Pick image
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (pickerResult.canceled) return;
    const asset = pickerResult.assets && pickerResult.assets[0];
    if (!asset?.base64) {
      Alert.alert("Error", "No image selected or image data missing.");
      return;
    }
    setUploading(true);
    try {
      // Send base64 image to backend
      await updateProfileImage({
        variables: { image: asset.base64 },
      });
      await refetch(); // Refetch user data to update profile image
      Alert.alert("Success", "Profile image updated!");
    } catch (err) {
      Alert.alert("Error", "Failed to update profile image.");
    } finally {
      setUploading(false);
    }
  };

  const handleChangeBannerImage = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Please allow access to your photo library.");
      return;
    }
    // Pick image
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 1],
      quality: 0.7,
      base64: true,
    });
    if (pickerResult.canceled) return;
    const asset = pickerResult.assets && pickerResult.assets[0];
    if (!asset?.base64) {
      Alert.alert("Error", "No image selected or image data missing.");
      return;
    }
    setUploading(true);
    try {
      // Send base64 image to backend
      await updateBannerImage({
        variables: { image: asset.base64 },
      });
      await refetch(); // Refetch user data to update banner image
      Alert.alert("Success", "Banner image updated!");
    } catch (err) {
      Alert.alert("Error", "Failed to update banner image.");
    } finally {
      setUploading(false);
    }
  };

  const renderRedeemableItem = ({ item }: { item: RedeemableItem }) => (
    <TouchableOpacity
      style={styles.shopItem}
      onPress={() => handleRedeem(item)}
      disabled={user.points < item.pointsCost}
    >
      <View style={styles.shopItemIcon}>
        <Ionicons
          name={item.type === "prank" ? "skull" : "gift"}
          size={32}
          color={user.points >= item.pointsCost ? "#007AFF" : "#C7C7CC"}
        />
      </View>
      <View style={styles.shopItemInfo}>
        <Text style={[styles.shopItemName, user.points < item.pointsCost && styles.shopItemDisabled]}>{item.name}</Text>
        <Text style={styles.shopItemDescription}>{item.description}</Text>
        {item.duration && <Text style={styles.shopItemDuration}>{item.duration}h duration</Text>}
      </View>
      <View style={styles.shopItemPrice}>
        <Text style={[styles.shopItemPriceText, user.points < item.pointsCost && styles.shopItemDisabled]}>
          {item.pointsCost}
        </Text>
        <Text style={styles.shopItemPriceLabel}>pts</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Notification Bell Header */}
      <View style={styles.notificationHeader}>
        <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate("Notifications")}>
          <Ionicons name="notifications" size={28} color="#000" />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.bannerContainer}>
        <TouchableOpacity onPress={handleChangeBannerImage} disabled={uploading}>
          {user.bannerImage ? (
            <Image source={{ uri: user.bannerImage }} style={styles.banner} />
          ) : (
            <View style={[styles.banner, styles.bannerPlaceholder]} />
          )}
          {uploading && (
            <ActivityIndicator style={{ position: "absolute", top: 40, left: "50%" }} size="small" color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handleChangeProfileImage} disabled={uploading}>
            {user.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={48} color="#8E8E93" />
              </View>
            )}
            {uploading && (
              <ActivityIndicator style={{ position: "absolute", top: 40, left: 40 }} size="small" color="#007AFF" />
            )}
            <View style={[styles.rankBadge, { backgroundColor: rankInfo.color }]}>
              <Ionicons name={rankInfo.icon as any} size={20} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.userName}>{user.name}</Text>
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, { color: rankInfo.color }]}>{rankInfo.label}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user.points}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user.leaderboardRank.toFixed(0)}%</Text>
          <Text style={styles.statLabel}>Rank</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user.successfulBets}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user.totalBets}</Text>
          <Text style={styles.statLabel}>Total Bets</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.shopButton} onPress={() => setShopModalVisible(true)}>
        <Ionicons name="gift" size={24} color="white" />
        <Text style={styles.shopButtonText}>Redeem Points</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social</Text>
        {user.friendGroups.map((group: string, index: number) => {
          const isGroups = group === "Groups";
          const navigationTarget = isGroups ? "BetGroups" : "FriendGroups";
          const iconName = isGroups ? "grid" : "people";

          return (
            <TouchableOpacity
              key={index}
              style={styles.groupCard}
              onPress={() => navigation.navigate(navigationTarget, { groupName: group })}
            >
              <Ionicons name={iconName} size={24} color="#007AFF" />
              <Text style={styles.groupName}>{group}</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsGrid}>
          <View style={styles.achievementCard}>
            <Ionicons name="flame" size={32} color="#FF9500" />
            <Text style={styles.achievementText}>5 Win Streak</Text>
          </View>
          <View style={styles.achievementCard}>
            <Ionicons name="trophy" size={32} color="#FFD700" />
            <Text style={styles.achievementText}>Top 10</Text>
          </View>
          <View style={styles.achievementCard}>
            <Ionicons name="star" size={32} color="#007AFF" />
            <Text style={styles.achievementText}>20 Total Bets</Text>
          </View>
          <View style={[styles.achievementCard, styles.achievementLocked]}>
            <Ionicons name="lock-closed" size={32} color="#C7C7CC" />
            <Text style={styles.achievementTextLocked}>50 Wins</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={shopModalVisible}
        onRequestClose={() => setShopModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Points Shop</Text>
                <Text style={styles.modalSubtitle}>You have {user.points} points</Text>
              </View>
              <TouchableOpacity onPress={() => setShopModalVisible(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={redeemableItems}
              renderItem={renderRedeemableItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.shopList}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  notificationHeader: {
    backgroundColor: "#F2F2F7",
    paddingTop: 60,
    paddingRight: 16,
    paddingBottom: 8,
    alignItems: "flex-end",
  },
  notificationButton: {
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
  bannerContainer: {
    height: 150,
  },
  banner: {
    width: "100%",
    height: "100%",
  },
  bannerPlaceholder: {
    backgroundColor: "#007AFF",
  },
  profileSection: {
    alignItems: "center",
    marginTop: -50,
    paddingBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "white",
  },
  avatarPlaceholder: {
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  rankBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  rankContainer: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rankText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
  },
  shopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  shopButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  groupName: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    marginLeft: 12,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  achievementCard: {
    width: "48%",
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
    marginTop: 8,
    textAlign: "center",
  },
  achievementTextLocked: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
    marginTop: 8,
    textAlign: "center",
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
  modalSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 4,
  },
  shopList: {
    padding: 16,
  },
  shopItem: {
    flexDirection: "row",
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  shopItemIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  shopItemInfo: {
    flex: 1,
  },
  shopItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  shopItemDescription: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 4,
  },
  shopItemDuration: {
    fontSize: 11,
    color: "#007AFF",
    fontWeight: "500",
  },
  shopItemPrice: {
    alignItems: "flex-end",
  },
  shopItemPriceText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#007AFF",
  },
  shopItemPriceLabel: {
    fontSize: 12,
    color: "#8E8E93",
  },
  shopItemDisabled: {
    color: "#C7C7CC",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 32,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF3B30",
    gap: 8,
  },
  signOutButtonText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
  },
});
