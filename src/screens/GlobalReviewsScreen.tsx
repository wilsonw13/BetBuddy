import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  Modal,
  TextInput,
  PanResponder,
  Animated,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
import { SUBMIT_BET_PROOF_REVIEW } from "@/graphql/mutations";
import { useAuth } from "@/contexts/AuthContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// Query to fetch all proofs that need review
const GET_ALL_PROOFS_FOR_REVIEW = gql`
  query GetAllProofsForReview {
    myBets {
      id
      betActivity
      proofs {
        id
        proofType
        imageUrl
        latitude
        longitude
        address
        verified
        aiSuggestionSuspicious
        aiSuggestionReason
        aiSuggestionConfidence
        user {
          id
          displayName
          profileImage
        }
        reviews {
          id
          isSuspicious
          reviewer {
            id
          }
        }
        createdAt
      }
    }
  }
`;

export default function GlobalReviewsScreen() {
  const { user } = useAuth();
  const currentUserId = user?.id || "";

  const [selectedProof, setSelectedProof] = useState<any>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reason, setReason] = useState("");

  // Swipe gesture state
  const position = useRef(new Animated.ValueXY()).current;
  const selectedProofRef = useRef<any>(null);

  // Fetch all proofs
  const { data, loading, refetch } = useQuery(GET_ALL_PROOFS_FOR_REVIEW);

  // Flatten all proofs from all bets
  const allProofs = data?.myBets?.flatMap((bet: any) =>
    bet.proofs.map((proof: any) => ({
      ...proof,
      betActivity: bet.betActivity,
      betId: bet.id,
    }))
  ) || [];

  // Filter out own proofs and already reviewed proofs
  const proofsToReview = allProofs.filter((proof: any) => {
    const isOwnProof = proof.user.id === currentUserId;
    const hasReviewed = proof.reviews?.some((review: any) => review.reviewer.id === currentUserId);
    return !isOwnProof && !hasReviewed;
  });

  const [submitReviewMutation] = useMutation(SUBMIT_BET_PROOF_REVIEW, {
    refetchQueries: ["GetAllProofsForReview"],
    awaitRefetchQueries: true,
    onCompleted: () => {
      Alert.alert("Success", "Review submitted successfully!");
      resetModal();
      refetch();
    },
    onError: (error) => {
      console.error("❌ Error submitting review:", error);
      if (error.message.includes("already reviewed")) {
        Alert.alert("Already Reviewed", "You have already reviewed this proof.");
      } else {
        Alert.alert("Error", error.message || "Failed to submit review");
      }
    },
  });

  const handleReviewProof = (proof: any) => {
    setSelectedProof(proof);
    selectedProofRef.current = proof;
    setReviewModalVisible(true);
  };

  const resetModal = () => {
    setReviewModalVisible(false);
    setSelectedProof(null);
    setReason("");
    position.setValue({ x: 0, y: 0 });
    setTimeout(() => {
      selectedProofRef.current = null;
    }, 500);
  };

  const handleSwipeComplete = async (isSuspicious: boolean) => {
    const proofToReview = selectedProofRef.current;

    if (!proofToReview) {
      return;
    }

    try {
      await submitReviewMutation({
        variables: {
          input: {
            betProofId: proofToReview.id,
            isSuspicious,
            reason: reason.trim() || undefined,
            confidence: 0.8,
          },
        },
      });
    } catch (error) {
      console.error("Error submitting review:", error);
      Animated.spring(position, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
      }).start();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: 0 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: SCREEN_WIDTH + 100, y: 0 },
            duration: 250,
            useNativeDriver: false,
          }).start(() => handleSwipeComplete(false));
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
            duration: 250,
            useNativeDriver: false,
          }).start(() => handleSwipeComplete(true));
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const renderProofCard = ({ item }: { item: any }) => {
    const hasAIWarning = item.aiSuggestionSuspicious && item.aiSuggestionConfidence > 0.7;
    const reviewCount = item.reviews?.length || 0;

    return (
      <TouchableOpacity style={styles.proofCard} onPress={() => handleReviewProof(item)}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            {item.user.profileImage ? (
              <Image source={{ uri: item.user.profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={20} color="#8E8E93" />
              </View>
            )}
            <View>
              <Text style={styles.userName}>{item.user.displayName}</Text>
              <Text style={styles.betActivity}>{item.betActivity}</Text>
            </View>
          </View>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>

        {item.proofType === "live_photo" && item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.proofImage} resizeMode="cover" />
        )}

        {item.proofType === "location" && item.address && (
          <View style={styles.locationProof}>
            <Ionicons name="location" size={32} color="#007AFF" />
            <Text style={styles.locationAddress}>{item.address}</Text>
          </View>
        )}

        {hasAIWarning && (
          <View style={styles.aiWarning}>
            <Ionicons name="warning" size={16} color="#FF9500" />
            <Text style={styles.aiWarningText}>AI flagged: {item.aiSuggestionReason}</Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.reviewCount}>
            <Ionicons name="people" size={16} color="#8E8E93" />
            <Text style={styles.reviewCountText}>{reviewCount} reviews</Text>
          </View>
          <TouchableOpacity style={styles.reviewButtonSmall}>
            <Ionicons name="eye" size={16} color="#007AFF" />
            <Text style={styles.reviewButtonText}>Review</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={proofsToReview}
        renderItem={renderProofCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle" size={64} color="#C7C7CC" />
            <Text style={styles.emptyText}>No proofs to review</Text>
            <Text style={styles.emptySubtext}>You're all caught up!</Text>
          </View>
        }
      />

      {/* Review Modal - Same swipe interface */}
      <Modal animationType="slide" transparent={true} visible={reviewModalVisible} onRequestClose={resetModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.swipeModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Proof</Text>
              <TouchableOpacity onPress={resetModal}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.swipeContainer}>
              <Text style={styles.swipeInstructions}>Swipe left to reject • Swipe right to accept</Text>

              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  styles.swipeCard,
                  {
                    transform: [
                      { translateX: position.x },
                      {
                        rotate: position.x.interpolate({
                          inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
                          outputRange: ["-10deg", "0deg", "10deg"],
                          extrapolate: "clamp",
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.swipeOverlay,
                    styles.swipeOverlayLeft,
                    {
                      opacity: position.x.interpolate({
                        inputRange: [-SCREEN_WIDTH / 2, 0],
                        outputRange: [1, 0],
                        extrapolate: "clamp",
                      }),
                    },
                  ]}
                >
                  <Ionicons name="close-circle" size={80} color="#FF3B30" />
                  <Text style={styles.swipeOverlayTextReject}>REJECT</Text>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.swipeOverlay,
                    styles.swipeOverlayRight,
                    {
                      opacity: position.x.interpolate({
                        inputRange: [0, SCREEN_WIDTH / 2],
                        outputRange: [0, 1],
                        extrapolate: "clamp",
                      }),
                    },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={80} color="#34C759" />
                  <Text style={styles.swipeOverlayTextAccept}>ACCEPT</Text>
                </Animated.View>

                {selectedProof?.proofType === "live_photo" && selectedProof?.imageUrl ? (
                  <Image source={{ uri: selectedProof.imageUrl }} style={styles.swipeCardImage} resizeMode="cover" />
                ) : selectedProof?.proofType === "location" && selectedProof?.address ? (
                  <View style={styles.swipeCardLocation}>
                    <Ionicons name="location" size={80} color="#007AFF" />
                    <Text style={styles.swipeCardLocationAddress}>{selectedProof.address}</Text>
                    {selectedProof.latitude && selectedProof.longitude && (
                      <Text style={styles.swipeCardLocationCoords}>
                        {selectedProof.latitude.toFixed(6)}, {selectedProof.longitude.toFixed(6)}
                      </Text>
                    )}
                  </View>
                ) : null}

                <View style={styles.swipeCardInfo}>
                  <Text style={styles.swipeCardUserName}>{selectedProof?.user?.displayName}</Text>
                  <Text style={styles.swipeCardDate}>
                    {selectedProof?.createdAt ? new Date(selectedProof.createdAt).toLocaleDateString() : ""}
                  </Text>
                </View>
              </Animated.View>

              <View style={styles.reasonContainer}>
                <Text style={styles.reasonLabel}>Add a note (optional)</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="Why did you make this decision?"
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.swipeHintContainer}>
                <View style={styles.swipeHint}>
                  <Ionicons name="arrow-back" size={24} color="#FF3B30" />
                  <Text style={styles.swipeHintTextReject}>Reject</Text>
                </View>
                <View style={styles.swipeHint}>
                  <Ionicons name="arrow-forward" size={24} color="#34C759" />
                  <Text style={styles.swipeHintTextAccept}>Accept</Text>
                </View>
              </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
  },
  listContainer: {
    padding: 16,
  },
  proofCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  betActivity: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: "#8E8E93",
  },
  proofImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationProof: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 8,
    gap: 12,
    marginBottom: 12,
  },
  locationAddress: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  aiWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5E6",
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  aiWarningText: {
    flex: 1,
    fontSize: 13,
    color: "#FF9500",
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reviewCountText: {
    fontSize: 13,
    color: "#8E8E93",
  },
  reviewButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#8E8E93",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#C7C7CC",
    marginTop: 8,
  },
  // Modal styles (reused from BetDetailsScreen)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  swipeModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "95%",
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
  swipeContainer: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  swipeInstructions: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 20,
  },
  swipeCard: {
    width: SCREEN_WIDTH - 40,
    height: 500,
    backgroundColor: "white",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  swipeOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  swipeOverlayLeft: {
    backgroundColor: "rgba(255, 59, 48, 0.2)",
  },
  swipeOverlayRight: {
    backgroundColor: "rgba(52, 199, 89, 0.2)",
  },
  swipeOverlayTextReject: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FF3B30",
    marginTop: 10,
    letterSpacing: 3,
  },
  swipeOverlayTextAccept: {
    fontSize: 32,
    fontWeight: "900",
    color: "#34C759",
    marginTop: 10,
    letterSpacing: 3,
  },
  swipeCardImage: {
    width: "100%",
    height: "100%",
  },
  swipeCardLocation: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 40,
  },
  swipeCardLocationAddress: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginTop: 20,
    textAlign: "center",
  },
  swipeCardLocationCoords: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 8,
    textAlign: "center",
  },
  swipeCardInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 20,
  },
  swipeCardUserName: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  swipeCardDate: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  reasonContainer: {
    width: "100%",
    marginTop: 20,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 8,
  },
  reasonInput: {
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#000",
    minHeight: 60,
    textAlignVertical: "top",
  },
  swipeHintContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
    paddingHorizontal: 40,
  },
  swipeHint: {
    alignItems: "center",
    gap: 8,
  },
  swipeHintTextReject: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF3B30",
  },
  swipeHintTextAccept: {
    fontSize: 16,
    fontWeight: "600",
    color: "#34C759",
  },
});
