import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  PanResponder,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "@apollo/client";
import { GET_BET_PROOF_REVIEWS, GET_MY_BETS } from "@/graphql/queries";
import { SUBMIT_BET_PROOF_REVIEW } from "@/graphql/mutations";
import { useAuth } from "@/contexts/AuthContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface BetDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      bet: any;
    };
  };
}

export default function BetDetailsScreen({ navigation, route }: BetDetailsScreenProps) {
  const betFromRoute = route.params.bet;
  const { user } = useAuth();
  const [selectedProof, setSelectedProof] = useState<any>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reason, setReason] = useState("");

  const currentUserId = user?.id || "";

  // Swipe gesture state
  const position = useRef(new Animated.ValueXY()).current;
  const swipeDirection = useRef<"left" | "right" | null>(null);
  const selectedProofRef = useRef<any>(null); // Use ref to avoid state timing issues

  // Fetch the latest bet data to ensure we have updated reviews
  const { data: myBetsData, refetch: refetchBet } = useQuery(GET_MY_BETS);
  const bet = myBetsData?.myBets?.find((b: any) => b.id === betFromRoute.id) || betFromRoute;

  // Fetch reviews for selected proof
  const { data: reviewsData, refetch: refetchReviews } = useQuery(GET_BET_PROOF_REVIEWS, {
    variables: { betProofId: selectedProof?.id },
    skip: !selectedProof,
  });

  const [submitReviewMutation, { loading: submittingReview }] = useMutation(SUBMIT_BET_PROOF_REVIEW, {
    refetchQueries: ["GetMyBets"],
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      console.log("✅ Review submitted successfully:", data);
      console.log("🔄 Refetching bet data...");
      Alert.alert("Success", "Review submitted successfully!");
      resetModal();
      refetchReviews();
      refetchBet(); // Also refetch the bet data to update counters
    },
    onError: (error) => {
      console.error("❌ Error submitting review:", error);
      console.error("❌ Error details:", {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
      });

      // Check if it's a duplicate review error
      if (error.message.includes("already reviewed")) {
        Alert.alert("Already Reviewed", "You have already reviewed this proof. You cannot review it again.");
      } else {
        Alert.alert("Error", error.message || "Failed to submit review");
      }
    },
  });

  const handleSubmitProof = () => {
    navigation.navigate("SubmitProof", { bet });
  };

  const handleReviewProof = (proof: any) => {
    console.log("🎬 Opening review modal for proof:", proof.id);
    setSelectedProof(proof);
    selectedProofRef.current = proof; // Store in ref for reliable access
    setReviewModalVisible(true);
  };

  const resetModal = () => {
    setReviewModalVisible(false);
    setSelectedProof(null);
    setReason("");
    position.setValue({ x: 0, y: 0 });
    swipeDirection.current = null;
    // Don't reset the ref immediately - let the swipe complete first
    setTimeout(() => {
      selectedProofRef.current = null;
    }, 500);
  };

  const handleSwipeComplete = async (isSuspicious: boolean) => {
    // Use ref instead of state to avoid timing issues
    const proofToReview = selectedProofRef.current;

    if (!proofToReview) {
      return;
    }

    try {
      const result = await submitReviewMutation({
        variables: {
          input: {
            betProofId: proofToReview.id,
            isSuspicious,
            reason: reason.trim() || undefined,
            confidence: 0.8, // Default confidence for swipe actions
          },
        },
      });
    } catch (error) {
      // Reset position on error
      Animated.spring(position, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
      }).start();
    }
  };

  // Create PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: 0 });
      },
      onPanResponderRelease: (_, gesture) => {
        console.log("👆 Swipe released:", { dx: gesture.dx, threshold: SWIPE_THRESHOLD });

        if (gesture.dx > SWIPE_THRESHOLD) {
          // Swipe right - Accept (not suspicious)
          console.log("➡️ Swipe RIGHT detected - Accepting proof");
          swipeDirection.current = "right";
          Animated.timing(position, {
            toValue: { x: SCREEN_WIDTH + 100, y: 0 },
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            console.log("✅ Animation complete, calling handleSwipeComplete(false)");
            handleSwipeComplete(false);
          });
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          // Swipe left - Decline (suspicious)
          console.log("⬅️ Swipe LEFT detected - Rejecting proof");
          swipeDirection.current = "left";
          Animated.timing(position, {
            toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            console.log("❌ Animation complete, calling handleSwipeComplete(true)");
            handleSwipeComplete(true);
          });
        } else {
          // Return to center
          console.log("↩️ Swipe too short, returning to center");
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  const endDate = new Date(bet.endDate);
  const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bet Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Bet Info Card */}
        <View style={styles.betCard}>
          <Text style={styles.betActivity}>{bet.betActivity}</Text>
          <View style={styles.betMetaRow}>
            <View style={styles.betMeta}>
              <Ionicons name="calendar" size={16} color="#8E8E93" />
              <Text style={styles.betMetaText}>{bet.frequency}</Text>
            </View>
            <View style={styles.betMeta}>
              <Ionicons name={bet.proofType === "live_photo" ? "camera" : "location"} size={16} color="#8E8E93" />
              <Text style={styles.betMetaText}>{bet.proofType === "live_photo" ? "Live Photo" : "Location"}</Text>
            </View>
            <View style={styles.betMeta}>
              <Ionicons name="time" size={16} color="#8E8E93" />
              <Text style={styles.betMetaText}>{daysLeft} days left</Text>
            </View>
          </View>
          <View style={styles.betStakeRow}>
            <Text style={styles.betStakeLabel}>Stake:</Text>
            <Text style={styles.betStakeAmount}>{bet.moneyStaked} pts</Text>
          </View>
        </View>

        {/* Participants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participants</Text>
          {bet.participants?.map((participant: any) => (
            <View key={participant.id} style={styles.participantCard}>
              <View style={styles.participantInfo}>
                <View style={styles.avatar}>
                  {participant.user.profileImage ? (
                    <Image source={{ uri: participant.user.profileImage }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={24} color="#8E8E93" />
                  )}
                </View>
                <View style={styles.participantDetails}>
                  <Text style={styles.participantName}>{participant.user.displayName}</Text>
                  <Text style={styles.participantStatus}>Status: {participant.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Submitted Proofs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Submitted Proofs ({bet.proofs?.length || 0})</Text>
          {bet.proofs && bet.proofs.length > 0 ? (
            bet.proofs.map((proof: any) => {
              const isOwnProof = proof.user.id === currentUserId;
              const hasAIWarning = proof.aiSuggestionSuspicious && proof.aiSuggestionConfidence > 0.7;

              return (
                <View key={proof.id} style={styles.proofCard}>
                  <View style={styles.proofHeader}>
                    <View style={styles.proofUserInfo}>
                      <View style={styles.avatarSmall}>
                        {proof.user.profileImage ? (
                          <Image source={{ uri: proof.user.profileImage }} style={styles.avatarSmallImage} />
                        ) : (
                          <Ionicons name="person" size={16} color="#8E8E93" />
                        )}
                      </View>
                      <Text style={styles.proofUserName}>{proof.user.displayName}</Text>
                    </View>
                    <Text style={styles.proofDate}>{new Date(proof.createdAt).toLocaleDateString()}</Text>
                  </View>

                  {proof.proofType === "live_photo" && proof.imageUrl && (
                    <Image source={{ uri: proof.imageUrl }} style={styles.proofImage} />
                  )}

                  {proof.proofType === "location" && proof.address && (
                    <View style={styles.locationProof}>
                      <Ionicons name="location" size={24} color="#007AFF" />
                      <View style={styles.locationDetails}>
                        <Text style={styles.locationAddress}>{proof.address}</Text>
                        {proof.latitude && proof.longitude && (
                          <Text style={styles.locationCoords}>
                            {proof.latitude.toFixed(6)}, {proof.longitude.toFixed(6)}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {hasAIWarning && (
                    <View style={styles.aiWarning}>
                      <Ionicons name="warning" size={16} color="#FF9500" />
                      <Text style={styles.aiWarningText}>AI flagged: {proof.aiSuggestionReason}</Text>
                    </View>
                  )}

                  {proof.reviews &&
                    proof.reviews.length > 0 &&
                    (() => {
                      const accepts = proof.reviews.filter((r: any) => !r.isSuspicious).length;
                      const declines = proof.reviews.filter((r: any) => r.isSuspicious).length;

                      return (
                        <View style={styles.reviewsCountContainer}>
                          <View style={styles.reviewCount}>
                            <Ionicons name="checkmark-circle" size={18} color="#34C759" />
                            <Text style={styles.reviewCountTextAccept}>{accepts}</Text>
                          </View>
                          <View style={styles.reviewCount}>
                            <Ionicons name="close-circle" size={18} color="#FF3B30" />
                            <Text style={styles.reviewCountTextReject}>{declines}</Text>
                          </View>
                          <Text style={styles.reviewCountTotal}>
                            ({proof.reviews.length} review{proof.reviews.length > 1 ? "s" : ""})
                          </Text>
                        </View>
                      );
                    })()}

                  {!isOwnProof && (
                    <TouchableOpacity style={styles.reviewButton} onPress={() => handleReviewProof(proof)}>
                      <Ionicons name="eye" size={18} color="#007AFF" />
                      <Text style={styles.reviewButtonText}>Review This Proof</Text>
                    </TouchableOpacity>
                  )}

                  {isOwnProof && (
                    <View style={styles.ownProofBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                      <Text style={styles.ownProofText}>Your proof</Text>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyProofs}>
              <Ionicons name="document-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyProofsText}>No proofs submitted yet</Text>
            </View>
          )}
        </View>

        {/* Submit Proof Button */}
        <TouchableOpacity style={styles.submitProofButton} onPress={handleSubmitProof}>
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.submitProofButtonText}>Submit New Proof</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Review Modal */}
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
              {/* Swipe Instructions */}
              <Text style={styles.swipeInstructions}>Swipe left to reject • Swipe right to accept</Text>

              {/* Swipeable Card */}
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
                {/* Swipe Overlays */}
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

                {/* Proof Content */}
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

                {/* User Info at Bottom of Card */}
                <View style={styles.swipeCardInfo}>
                  <Text style={styles.swipeCardUserName}>{selectedProof?.user?.displayName}</Text>
                  <Text style={styles.swipeCardDate}>
                    {selectedProof?.createdAt ? new Date(selectedProof.createdAt).toLocaleDateString() : ""}
                  </Text>
                </View>
              </Animated.View>

              {/* Optional Reason Input */}
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

              {/* Swipe Hint Icons */}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  betCard: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  betActivity: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  betMetaRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  betMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  betMetaText: {
    fontSize: 13,
    color: "#8E8E93",
  },
  betStakeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
  },
  betStakeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  betStakeAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  participantCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  participantInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  participantStatus: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  proofCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  proofHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  proofUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarSmallImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  proofUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  proofDate: {
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
  },
  locationDetails: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  locationCoords: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  aiWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5E6",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  aiWarningText: {
    flex: 1,
    fontSize: 13,
    color: "#FF9500",
    fontWeight: "500",
  },
  reviewsSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  reviewsSummaryText: {
    fontSize: 13,
    color: "#8E8E93",
  },
  reviewsCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
  },
  reviewCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reviewCountTextAccept: {
    fontSize: 16,
    fontWeight: "700",
    color: "#34C759",
  },
  reviewCountTextReject: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF3B30",
  },
  reviewCountTotal: {
    fontSize: 13,
    color: "#8E8E93",
    marginLeft: "auto",
  },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E3F2FD",
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  ownProofBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F9F0",
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  ownProofText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#34C759",
  },
  emptyProofs: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "white",
    borderRadius: 12,
  },
  emptyProofsText: {
    fontSize: 15,
    color: "#8E8E93",
    marginTop: 12,
  },
  submitProofButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitProofButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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
    maxHeight: "90%",
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
  modalProofImage: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: "#F2F2F7",
  },
  modalLocationProof: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E3F2FD",
    padding: 32,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalLocationAddress: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginTop: 12,
    textAlign: "center",
  },
  modalLocationCoords: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 4,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
    marginTop: 16,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  optionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F2F7",
    padding: 14,
    borderRadius: 10,
    gap: 8,
    borderWidth: 2,
    borderColor: "#F2F2F7",
  },
  optionButtonActive: {
    backgroundColor: "white",
    borderColor: "#007AFF",
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  optionButtonTextActive: {
    color: "#000",
  },
  textArea: {
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#000",
    height: 100,
    textAlignVertical: "top",
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
    width: 40,
    textAlign: "center",
  },
  submitReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#34C759",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 24,
  },
  submitReviewButtonDisabled: {
    opacity: 0.6,
  },
  submitReviewButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // New Swipe Styles
  swipeModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "95%",
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
