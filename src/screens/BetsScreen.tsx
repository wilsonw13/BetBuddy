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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Bet, BetFrequency, ProofType } from "../types";
import { suggestBets } from "../services/geminiService";

// Mock data - replace with real data from your backend
const mockBets: Bet[] = [
  {
    id: "1",
    userId1: "user1",
    userId2: "user2",
    betActivity: "Go to gym 3x a week",
    proofType: "live_photo",
    frequency: "3x/week",
    betLength: 30,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-01-31"),
    status: "active",
    pointsStaked: 100,
    proofs: [],
    createdAt: new Date("2024-01-01"),
  },
];

export default function BetsScreen() {
  const [bets, setBets] = useState<Bet[]>(mockBets);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [newBet, setNewBet] = useState({
    activity: "",
    opponent: "",
    frequency: "1x/week" as BetFrequency,
    proofType: "live_photo" as ProofType,
    betLength: 30,
    pointsStaked: 50,
  });

  const handleGetSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const userInterests = ["fitness", "productivity", "health"];
      const pastBets = bets.map((bet) => bet.betActivity);
      const betSuggestions = await suggestBets(userInterests, pastBets);
      setSuggestions(betSuggestions);
    } catch (error) {
      Alert.alert("Error", "Failed to get bet suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAddBet = () => {
    if (!newBet.activity || !newBet.opponent) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const bet: Bet = {
      id: Date.now().toString(),
      userId1: "currentUser",
      userId2: newBet.opponent,
      betActivity: newBet.activity,
      proofType: newBet.proofType,
      frequency: newBet.frequency,
      betLength: newBet.betLength,
      startDate: new Date(),
      endDate: new Date(Date.now() + newBet.betLength * 24 * 60 * 60 * 1000),
      status: "active",
      pointsStaked: newBet.pointsStaked,
      proofs: [],
      createdAt: new Date(),
    };

    setBets([bet, ...bets]);
    setModalVisible(false);
    setNewBet({
      activity: "",
      opponent: "",
      frequency: "1x/week",
      proofType: "live_photo",
      betLength: 30,
      pointsStaked: 50,
    });
  };

  const renderBetItem = ({ item }: { item: Bet }) => {
    const daysLeft = Math.ceil(
      (item.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    );

    return (
      <TouchableOpacity style={styles.betCard}>
        <View style={styles.betHeader}>
          <View style={styles.betIconContainer}>
            <Ionicons name="hand-left" size={24} color="#007AFF" />
          </View>
          <View style={styles.betInfo}>
            <Text style={styles.betActivity}>{item.betActivity}</Text>
            <Text style={styles.betDetails}>
              vs. {item.userId2} • {item.frequency}
            </Text>
          </View>
          <View style={styles.betStatus}>
            <Text style={styles.pointsStaked}>{item.pointsStaked} pts</Text>
          </View>
        </View>

        <View style={styles.betFooter}>
          <View style={styles.proofTypeContainer}>
            <Ionicons
              name={item.proofType === "live_photo" ? "camera" : "location"}
              size={14}
              color="#8E8E93"
            />
            <Text style={styles.proofTypeText}>
              {item.proofType === "live_photo" ? "Live Photo" : "Location"}
            </Text>
          </View>
          <Text style={styles.daysLeft}>{daysLeft} days left</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
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
            <Text style={styles.emptySubtext}>
              Create your first bet to get started!
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
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
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.suggestionsScroll}
                >
                  {suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionChip}
                      onPress={() =>
                        setNewBet({ ...newBet, activity: suggestion })
                      }
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <TextInput
                style={styles.input}
                placeholder="e.g., Go to gym 3x a week"
                value={newBet.activity}
                onChangeText={(text) =>
                  setNewBet({ ...newBet, activity: text })
                }
              />

              <Text style={styles.label}>Opponent (User ID)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter user ID"
                value={newBet.opponent}
                onChangeText={(text) =>
                  setNewBet({ ...newBet, opponent: text })
                }
              />

              <Text style={styles.label}>Frequency</Text>
              <View style={styles.optionsContainer}>
                {[
                  "1x/week",
                  "2x/week",
                  "3x/week",
                  "4x/week",
                  "daily",
                  "1x/month",
                  "2x/month",
                ].map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.optionButton,
                      newBet.frequency === freq && styles.optionButtonActive,
                    ]}
                    onPress={() =>
                      setNewBet({ ...newBet, frequency: freq as BetFrequency })
                    }
                  >
                    <Text
                      style={[
                        styles.optionText,
                        newBet.frequency === freq && styles.optionTextActive,
                      ]}
                    >
                      {freq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Proof Type</Text>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    newBet.proofType === "live_photo" &&
                      styles.optionButtonActive,
                  ]}
                  onPress={() =>
                    setNewBet({ ...newBet, proofType: "live_photo" })
                  }
                >
                  <Ionicons
                    name="camera"
                    size={18}
                    color={
                      newBet.proofType === "live_photo" ? "#007AFF" : "#8E8E93"
                    }
                  />
                  <Text
                    style={[
                      styles.optionText,
                      newBet.proofType === "live_photo" &&
                        styles.optionTextActive,
                    ]}
                  >
                    Live Photo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    newBet.proofType === "location" &&
                      styles.optionButtonActive,
                  ]}
                  onPress={() =>
                    setNewBet({ ...newBet, proofType: "location" })
                  }
                >
                  <Ionicons
                    name="location"
                    size={18}
                    color={
                      newBet.proofType === "location" ? "#007AFF" : "#8E8E93"
                    }
                  />
                  <Text
                    style={[
                      styles.optionText,
                      newBet.proofType === "location" &&
                        styles.optionTextActive,
                    ]}
                  >
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
                onChangeText={(text) =>
                  setNewBet({ ...newBet, betLength: parseInt(text) || 30 })
                }
              />

              <Text style={styles.label}>Points to Stake</Text>
              <TextInput
                style={styles.input}
                placeholder="50"
                keyboardType="numeric"
                value={newBet.pointsStaked.toString()}
                onChangeText={(text) =>
                  setNewBet({ ...newBet, pointsStaked: parseInt(text) || 50 })
                }
              />

              <TouchableOpacity
                style={styles.createButton}
                onPress={handleAddBet}
              >
                <Text style={styles.createButtonText}>Create Bet</Text>
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
  suggestionText: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "500",
  },
});
