import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Bet, BetFrequency, ProofType } from "@/types";
import { suggestBets } from "@/services/geminiService";
import { useQuery, useMutation } from "@apollo/client";
import { GET_MY_FRIENDS, GET_MY_BET_GROUPS, GET_MY_BETS, GET_ME } from "@/graphql/queries";
import { CREATE_BET } from "@/graphql/mutations";

interface Friend {
  id: string;
  email: string;
  displayName: string;
  profilePicture?: string;
  createdAt: string;
}

interface BetGroup {
  id: string;
  name: string;
  description?: string;
  members: {
    id: string;
    user: Friend;
  }[];
}

export default function BetsScreen({ navigation }: any) {
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [betMode, setBetMode] = useState<"individual" | "group">("individual");
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<BetGroup | null>(null);
  const [showGroupsList, setShowGroupsList] = useState(false);
  const [newBet, setNewBet] = useState({
    activity: "",
    frequency: "1x/week" as BetFrequency,
    proofType: "live_photo" as ProofType,
    betLength: 30,
    pointsStaked: 50,
  });

  // Fetch bets
  const { data: betsData, loading: betsLoading, refetch: refetchBets } = useQuery(GET_MY_BETS);
  const { data: meData } = useQuery(GET_ME);
  const allBets = betsData?.myBets || [];
  const currentUserId = meData?.me?.id;

  // Filter out cancelled, completed bets, and bets where user declined
  const bets = allBets.filter((bet: any) => {
    // Debug: log all bet statuses
    if (bet.status === 'cancelled') {
      console.log("FILTERING OUT cancelled bet:", bet.id, bet.title);
    }

    if (bet.status === 'cancelled' || bet.status === 'completed') {
      return false;
    }

    // Check if current user declined this bet
    const userParticipant = bet.participants?.find((p: any) => p.user.id === currentUserId);
    if (userParticipant && userParticipant.status === 'declined') {
      return false;
    }

    return true;
  });

  console.log("Total bets from backend:", allBets.length);
  console.log("Bets after filtering:", bets.length);

  // Fetch friends list
  const { data: friendsData, loading: friendsLoading } = useQuery(GET_MY_FRIENDS);
  const friends: Friend[] = friendsData?.myFriends || [];

  // Fetch bet groups
  const { data: groupsData, loading: groupsLoading } = useQuery(GET_MY_BET_GROUPS);
  const betGroups: BetGroup[] = groupsData?.myBetGroups || [];

  // Create bet mutation
  const [createBetMutation, { loading: creatingBet }] = useMutation(CREATE_BET, {
    refetchQueries: [{ query: GET_MY_BETS }],
    awaitRefetchQueries: true,
  });

  // Filter friends based on search query
  const filteredFriends = friends.filter(
    (friend) =>
      friend.displayName.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
      friend.email.toLowerCase().includes(friendSearchQuery.toLowerCase()),
  );

  const handleGetSuggestions = async () => {
    setLoadingSuggestions(true);
    setSuggestions([]); // Clear previous suggestions before fetching new ones
    try {
      const userInterests = ["fitness", "productivity", "health"];
      const pastBets = bets.map((bet: any) => bet.betActivity);
      const betSuggestions = await suggestBets(userInterests, pastBets);
      setSuggestions(betSuggestions);
    } catch (error) {
      Alert.alert("Error", "Failed to get bet suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const parseSuggestionToFrequency = (suggestion: string): BetFrequency => {
    const lowerSuggestion = suggestion.toLowerCase();
    if (lowerSuggestion.includes("daily") || lowerSuggestion.includes("every day")) return "daily";
    if (lowerSuggestion.includes("4x") || lowerSuggestion.includes("4 times")) return "4x/week";
    if (lowerSuggestion.includes("3x") || lowerSuggestion.includes("3 times")) return "3x/week";
    if (lowerSuggestion.includes("2x") || lowerSuggestion.includes("twice")) return "2x/week";
    if (lowerSuggestion.includes("once a week") || lowerSuggestion.includes("1x")) return "1x/week";
    if (lowerSuggestion.includes("2x/month") || lowerSuggestion.includes("twice a month")) return "2x/month";
    if (lowerSuggestion.includes("1x/month") || lowerSuggestion.includes("once a month")) return "1x/month";
    return "1x/week"; // default
  };

  const parseSuggestionToProofType = (suggestion: string): ProofType => {
    const lowerSuggestion = suggestion.toLowerCase();
    if (lowerSuggestion.includes("gym") || lowerSuggestion.includes("location") || lowerSuggestion.includes("run")) {
      return "location";
    }
    return "live_photo"; // default
  };

  const handleSuggestionSelect = (suggestion: string) => {
    // If the same suggestion is clicked again, deselect it (clear activity)
    if (newBet.activity === suggestion) {
      setNewBet({ ...newBet, activity: "" });
    } else {
      const frequency = parseSuggestionToFrequency(suggestion);
      const proofType = parseSuggestionToProofType(suggestion);
      setNewBet({ ...newBet, activity: suggestion, frequency, proofType });
    }
  };

  const handleSelectFriend = (friend: Friend) => {
    // Toggle selection for multi-select
    const isAlreadySelected = selectedFriends.some((f) => f.id === friend.id);
    if (isAlreadySelected) {
      setSelectedFriends(selectedFriends.filter((f) => f.id !== friend.id));
    } else {
      setSelectedFriends([...selectedFriends, friend]);
    }
  };

  const handleSelectGroup = (group: BetGroup) => {
    setSelectedGroup(group);
    setShowGroupsList(false);
  };

  const handleRemoveFriend = (friendId: string) => {
    setSelectedFriends(selectedFriends.filter((f) => f.id !== friendId));
  };

  const handleAddBet = async () => {
    if (!newBet.activity) {
      Alert.alert("Error", "Please enter a bet activity");
      return;
    }

    if (betMode === "individual" && selectedFriends.length === 0) {
      Alert.alert("Error", "Please select at least one friend");
      return;
    }

    if (betMode === "group" && !selectedGroup) {
      Alert.alert("Error", "Please select a bet group");
      return;
    }

    try {
      const input = {
        title: newBet.activity,
        description: "",
        betActivity: newBet.activity,
        proofType: newBet.proofType,
        frequency: newBet.frequency,
        betLength: newBet.betLength,
        pointsStaked: newBet.pointsStaked,
        startDate: new Date().toISOString(),
        ...(betMode === "individual"
          ? { participantDisplayNames: selectedFriends.map((f) => f.displayName) }
          : { groupId: selectedGroup!.id }),
      };

      await createBetMutation({ variables: { input } });

      Alert.alert("Success", "Bet created successfully!");
      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create bet");
    }
  };

  const resetForm = () => {
    setSelectedFriends([]);
    setSelectedGroup(null);
    setShowFriendsList(false);
    setShowGroupsList(false);
    setFriendSearchQuery("");
    setBetMode("individual");
    setNewBet({
      activity: "",
      frequency: "1x/week",
      proofType: "live_photo",
      betLength: 30,
      pointsStaked: 50,
    });
    setSuggestions([]);
  };

  const renderBetItem = ({ item }: { item: any }) => {
    const endDate = new Date(item.endDate);
    const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    // Get participant names (excluding the current user if possible)
    const participantNames = item.participants
      ?.map((p: any) => p.user.displayName)
      .filter((name: string, index: number, self: string[]) => self.indexOf(name) === index)
      .slice(0, 2)
      .join(", ") || "Unknown";

    return (
      <TouchableOpacity
        style={styles.betCard}
        onPress={() =>
          navigation.navigate("SubmitProof", {
            bet: item,
          })
        }
      >
        <View style={styles.betHeader}>
          <View style={styles.betIconContainer}>
            <Ionicons name={item.isGroupBet ? "people-circle" : "hand-left"} size={24} color="#007AFF" />
          </View>
          <View style={styles.betInfo}>
            <Text style={styles.betActivity}>{item.betActivity}</Text>
            <Text style={styles.betDetails}>
              {item.isGroupBet ? item.group?.name : `vs. ${participantNames}`} • {item.frequency}
            </Text>
          </View>
          <View style={styles.betStatus}>
            <Text style={styles.pointsStaked}>{item.pointsStaked} pts</Text>
          </View>
        </View>

        <View style={styles.betFooter}>
          <View style={styles.proofTypeContainer}>
            <Ionicons name={item.proofType === "live_photo" ? "camera" : "location"} size={14} color="#8E8E93" />
            <Text style={styles.proofTypeText}>{item.proofType === "live_photo" ? "Live Photo" : "Location"}</Text>
          </View>
          <Text style={styles.daysLeft}>{daysLeft} days left</Text>
        </View>

        {item.proofs && item.proofs.length > 0 && (
          <View style={styles.proofsIndicator}>
            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            <Text style={styles.proofsIndicatorText}>
              {item.proofs.length} proof{item.proofs.length > 1 ? "s" : ""} submitted
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={bets}
          renderItem={renderBetItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="hand-left-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyText}>No active bets</Text>
              <Text style={styles.emptySubtext}>Create your first bet to get started!</Text>
            </View>
          }
        />

        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Bet</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#000" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.suggestionHeader}>
                  <Text style={styles.label}>Bet Activity</Text>
                  <TouchableOpacity
                    style={styles.suggestButton}
                    onPress={handleGetSuggestions}
                    disabled={loadingSuggestions}
                  >
                    {loadingSuggestions ? (
                      <ActivityIndicator size="small" color="#007AFF" />
                    ) : (
                      <>
                        <Ionicons name="bulb" size={16} color="#007AFF" />
                        <Text style={styles.suggestButtonText}>AI Suggest</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {suggestions.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
                    {suggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.suggestionChip, newBet.activity === suggestion && styles.suggestionChipSelected]}
                        onPress={() => handleSuggestionSelect(suggestion)}
                      >
                        <Text
                          style={[
                            styles.suggestionText,
                            newBet.activity === suggestion && styles.suggestionTextSelected,
                          ]}
                        >
                          {suggestion}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                <TextInput
                  style={styles.input}
                  placeholder="e.g., Go to gym 3x a week"
                  value={newBet.activity}
                  onChangeText={(text) => setNewBet({ ...newBet, activity: text })}
                />

                <Text style={styles.label}>Bet With</Text>
                <View style={styles.betModeContainer}>
                  <TouchableOpacity
                    style={[styles.betModeButton, betMode === "individual" && styles.betModeButtonActive]}
                    onPress={() => setBetMode("individual")}
                  >
                    <Ionicons
                      name="people"
                      size={18}
                      color={betMode === "individual" ? "#007AFF" : "#8E8E93"}
                    />
                    <Text style={[styles.betModeText, betMode === "individual" && styles.betModeTextActive]}>
                      Individual Friends
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.betModeButton, betMode === "group" && styles.betModeButtonActive]}
                    onPress={() => setBetMode("group")}
                  >
                    <Ionicons
                      name="people-circle"
                      size={18}
                      color={betMode === "group" ? "#007AFF" : "#8E8E93"}
                    />
                    <Text style={[styles.betModeText, betMode === "group" && styles.betModeTextActive]}>
                      Bet Group
                    </Text>
                  </TouchableOpacity>
                </View>

                {betMode === "individual" ? (
                  <>
                    {selectedFriends.length > 0 && (
                      <View style={styles.selectedFriendsContainer}>
                        <Text style={styles.selectedFriendsLabel}>Selected ({selectedFriends.length})</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedFriendsScroll}>
                          {selectedFriends.map((friend) => (
                            <TouchableOpacity
                              key={friend.id}
                              style={styles.selectedFriendChip}
                              onPress={() => handleRemoveFriend(friend.id)}
                            >
                              <Text style={styles.selectedFriendChipText}>{friend.displayName}</Text>
                              <Ionicons name="close-circle" size={16} color="#007AFF" />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.friendSearchInput}
                      onPress={() => setShowFriendsList(!showFriendsList)}
                    >
                      <Ionicons name="search" size={20} color="#8E8E93" />
                      <Text style={styles.friendSearchPlaceholder}>
                        {selectedFriends.length > 0 ? "Add more friends..." : "Search friends..."}
                      </Text>
                      <Ionicons name={showFriendsList ? "chevron-up" : "chevron-down"} size={20} color="#8E8E93" />
                    </TouchableOpacity>

                    {showFriendsList && (
                      <View style={styles.friendsListContainer}>
                        <TextInput
                          style={styles.friendSearchInputField}
                          placeholder="Type to search..."
                          value={friendSearchQuery}
                          onChangeText={setFriendSearchQuery}
                          autoFocus
                        />
                        {friendsLoading ? (
                          <ActivityIndicator size="small" color="#007AFF" style={styles.friendsLoader} />
                        ) : filteredFriends.length > 0 ? (
                          <ScrollView style={styles.friendsScroll} nestedScrollEnabled>
                            {filteredFriends.map((friend) => {
                              const isSelected = selectedFriends.some((f) => f.id === friend.id);
                              return (
                                <TouchableOpacity
                                  key={friend.id}
                                  style={[styles.friendItem, isSelected && styles.friendItemSelected]}
                                  onPress={() => handleSelectFriend(friend)}
                                >
                                  <View style={styles.friendAvatarSmall}>
                                    {friend.profilePicture ? (
                                      <Image source={{ uri: friend.profilePicture }} style={styles.friendAvatarImage} />
                                    ) : (
                                      <Ionicons name="person" size={20} color="#8E8E93" />
                                    )}
                                  </View>
                                  <View style={styles.friendItemDetails}>
                                    <Text style={styles.friendItemName}>{friend.displayName}</Text>
                                    <Text style={styles.friendItemEmail}>{friend.email}</Text>
                                  </View>
                                  {isSelected && <Ionicons name="checkmark-circle" size={24} color="#007AFF" />}
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        ) : (
                          <View style={styles.noFriendsContainer}>
                            <Ionicons name="people-outline" size={32} color="#C7C7CC" />
                            <Text style={styles.noFriendsText}>
                              {friendSearchQuery ? "No friends found" : "No friends yet"}
                            </Text>
                            <Text style={styles.noFriendsSubtext}>
                              {friendSearchQuery ? "Try a different search" : "Add friends to create bets"}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    {selectedGroup ? (
                      <TouchableOpacity
                        style={styles.selectedGroupContainer}
                        onPress={() => setSelectedGroup(null)}
                      >
                        <View style={styles.selectedGroupInfo}>
                          <Ionicons name="people-circle" size={32} color="#007AFF" />
                          <View style={styles.selectedGroupDetails}>
                            <Text style={styles.selectedGroupName}>{selectedGroup.name}</Text>
                            <Text style={styles.selectedGroupMembers}>
                              {selectedGroup.members.length} member{selectedGroup.members.length !== 1 ? "s" : ""}
                            </Text>
                          </View>
                        </View>
                        <Ionicons name="close-circle" size={24} color="#8E8E93" />
                      </TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={styles.friendSearchInput}
                          onPress={() => setShowGroupsList(!showGroupsList)}
                        >
                          <Ionicons name="people-circle" size={20} color="#8E8E93" />
                          <Text style={styles.friendSearchPlaceholder}>Select a bet group...</Text>
                          <Ionicons name={showGroupsList ? "chevron-up" : "chevron-down"} size={20} color="#8E8E93" />
                        </TouchableOpacity>

                        {showGroupsList && (
                          <View style={styles.friendsListContainer}>
                            {groupsLoading ? (
                              <ActivityIndicator size="small" color="#007AFF" style={styles.friendsLoader} />
                            ) : betGroups.length > 0 ? (
                              <ScrollView style={styles.friendsScroll} nestedScrollEnabled>
                                {betGroups.map((group) => (
                                  <TouchableOpacity
                                    key={group.id}
                                    style={styles.groupItem}
                                    onPress={() => handleSelectGroup(group)}
                                  >
                                    <Ionicons name="people-circle" size={32} color="#007AFF" />
                                    <View style={styles.groupItemDetails}>
                                      <Text style={styles.groupItemName}>{group.name}</Text>
                                      <Text style={styles.groupItemMembers}>
                                        {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                                      </Text>
                                    </View>
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>
                            ) : (
                              <View style={styles.noFriendsContainer}>
                                <Ionicons name="people-circle-outline" size={32} color="#C7C7CC" />
                                <Text style={styles.noFriendsText}>No bet groups yet</Text>
                                <Text style={styles.noFriendsSubtext}>Create a bet group first</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </>
                    )}
                  </>
                )}

                <Text style={styles.label}>Frequency</Text>
                <View style={styles.optionsContainer}>
                  {["1x/week", "2x/week", "3x/week", "4x/week", "daily", "1x/month", "2x/month"].map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[styles.optionButton, newBet.frequency === freq && styles.optionButtonActive]}
                      onPress={() => setNewBet({ ...newBet, frequency: freq as BetFrequency })}
                    >
                      <Text style={[styles.optionText, newBet.frequency === freq && styles.optionTextActive]}>
                        {freq}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Proof Type</Text>
                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={[styles.optionButton, newBet.proofType === "live_photo" && styles.optionButtonActive]}
                    onPress={() => setNewBet({ ...newBet, proofType: "live_photo" })}
                  >
                    <Ionicons
                      name="camera"
                      size={18}
                      color={newBet.proofType === "live_photo" ? "#007AFF" : "#8E8E93"}
                    />
                    <Text style={[styles.optionText, newBet.proofType === "live_photo" && styles.optionTextActive]}>
                      Live Photo
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.optionButton, newBet.proofType === "location" && styles.optionButtonActive]}
                    onPress={() => setNewBet({ ...newBet, proofType: "location" })}
                  >
                    <Ionicons
                      name="location"
                      size={18}
                      color={newBet.proofType === "location" ? "#007AFF" : "#8E8E93"}
                    />
                    <Text style={[styles.optionText, newBet.proofType === "location" && styles.optionTextActive]}>
                      Location
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Bet Length (days)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="30"
                  keyboardType="numeric"
                  value={newBet.betLength.toString()}
                  onChangeText={(text) => setNewBet({ ...newBet, betLength: parseInt(text) || 30 })}
                />

                <Text style={styles.label}>Points to Stake</Text>
                <TextInput
                  style={styles.input}
                  placeholder="50"
                  keyboardType="numeric"
                  value={newBet.pointsStaked.toString()}
                  onChangeText={(text) => setNewBet({ ...newBet, pointsStaked: parseInt(text) || 50 })}
                />

                <TouchableOpacity
                  style={[styles.createButton, creatingBet && styles.createButtonDisabled]}
                  onPress={handleAddBet}
                  disabled={creatingBet}
                >
                  {creatingBet ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.createButtonText}>Create Bet</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  listContainer: {
    padding: 16,
  },
  betCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  betHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  betIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  betInfo: {
    flex: 1,
  },
  betActivity: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  betDetails: {
    fontSize: 14,
    color: "#8E8E93",
  },
  betStatus: {
    alignItems: "flex-end",
  },
  pointsStaked: {
    fontSize: 16,
    fontWeight: "700",
    color: "#007AFF",
  },
  betFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
  },
  proofTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  proofTypeText: {
    fontSize: 12,
    color: "#8E8E93",
    marginLeft: 4,
  },
  daysLeft: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "500",
  },
  proofsIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
    gap: 6,
  },
  proofsIndicatorText: {
    fontSize: 12,
    color: "#34C759",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 8,
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
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
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#000",
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 4,
  },
  optionButtonActive: {
    backgroundColor: "#E3F2FD",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  optionText: {
    fontSize: 14,
    color: "#8E8E93",
  },
  optionTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  suggestionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 0,
  },
  suggestButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  suggestButtonText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
  },
  suggestionsScroll: {
    marginVertical: 12,
  },
  suggestionChip: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  suggestionChipSelected: {
    backgroundColor: "#007AFF",
  },
  suggestionText: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "500",
  },
  suggestionTextSelected: {
    color: "#FFFFFF",
  },
  selectedFriendContainer: {
    backgroundColor: "#E3F2FD",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  selectedFriendInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedFriendDetails: {
    flex: 1,
    marginLeft: 8,
  },
  selectedFriendName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  selectedFriendEmail: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  friendSearchInput: {
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  friendSearchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: "#8E8E93",
  },
  friendsListContainer: {
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    marginTop: 8,
    maxHeight: 250,
  },
  friendSearchInputField: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    margin: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  friendsScroll: {
    maxHeight: 180,
  },
  friendsLoader: {
    padding: 20,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    backgroundColor: "white",
  },
  friendAvatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  friendAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  friendItemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  friendItemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  friendItemEmail: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  noFriendsContainer: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "white",
  },
  noFriendsText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8E8E93",
    marginTop: 8,
  },
  noFriendsSubtext: {
    fontSize: 13,
    color: "#C7C7CC",
    marginTop: 4,
  },
  betModeContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  betModeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#F2F2F7",
  },
  betModeButtonActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#007AFF",
  },
  betModeText: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  betModeTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  selectedFriendsContainer: {
    marginBottom: 8,
  },
  selectedFriendsLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 6,
    fontWeight: "500",
  },
  selectedFriendsScroll: {
    marginBottom: 4,
  },
  selectedFriendChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  selectedFriendChipText: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "500",
  },
  friendItemSelected: {
    backgroundColor: "#E3F2FD",
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  selectedGroupContainer: {
    backgroundColor: "#E3F2FD",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  selectedGroupInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  selectedGroupDetails: {
    flex: 1,
  },
  selectedGroupName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  selectedGroupMembers: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    backgroundColor: "white",
    gap: 12,
  },
  groupItemDetails: {
    flex: 1,
  },
  groupItemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  groupItemMembers: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
});
