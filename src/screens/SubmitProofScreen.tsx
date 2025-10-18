import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Bet, Proof } from "@/types";
import { verifyBetPhoto } from "@/services/geminiService";

interface SubmitProofScreenProps {
  navigation: any;
  route: {
    params: {
      bet: Bet;
      onProofSubmitted?: (proof: Proof) => void;
    };
  };
}

export default function SubmitProofScreen({ navigation, route }: SubmitProofScreenProps) {
  const { bet, onProofSubmitted } = route.params;
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<{
    isSuspicious: boolean;
    confidence: number;
    reason: string;
    suggestions: string[];
  } | null>(null);

  // Request permissions on mount
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (bet.proofType === "live_photo") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera permission is required to take photos");
      }
    } else if (bet.proofType === "location") {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Location permission is required to verify location");
      }
    }
  };

  const handleTakePhoto = async () => {
    try {
      setLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        // Auto-verify the photo
        await verifyPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        // Auto-verify the photo
        await verifyPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick photo");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoto = async (uri: string) => {
    try {
      setVerifying(true);
      const result = await verifyBetPhoto(uri, bet.betActivity);
      setVerification(result);
    } catch (error) {
      console.error("Error verifying photo:", error);
      setVerification({
        isSuspicious: false,
        confidence: 0,
        reason: "Verification service unavailable",
        suggestions: ["Manual verification recommended"],
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleGetLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Reverse geocode to get address
      const geocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      const address = geocode[0]
        ? `${geocode[0].street || ""}, ${geocode[0].city || ""}, ${geocode[0].region || ""}`
        : "Address unavailable";

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        address,
      });

      Alert.alert("Location Captured", `Your location has been recorded:\n${address}`);
    } catch (error) {
      Alert.alert("Error", "Failed to get location");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProof = () => {
    if (bet.proofType === "live_photo" && !imageUri) {
      Alert.alert("Photo Required", "Please take a photo as proof");
      return;
    }

    if (bet.proofType === "location" && !location) {
      Alert.alert("Location Required", "Please capture your location as proof");
      return;
    }

    if (verification?.isSuspicious && verification.confidence > 0.7) {
      Alert.alert(
        "Verification Warning",
        `AI detected potential issues:\n\n${verification.reason}\n\nAre you sure you want to submit this proof? Your friend will review it.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Submit Anyway", onPress: () => submitProof() },
        ]
      );
    } else {
      submitProof();
    }
  };

  const submitProof = () => {
    const proof: Proof = {
      id: Date.now().toString(),
      betId: bet.id,
      userId: bet.userId1, // Assuming current user is userId1
      timestamp: new Date(),
      proofType: bet.proofType,
      imageUri: imageUri || undefined,
      locationData: location || undefined,
      verified: false,
      aiSuggestionSuspicious: verification?.isSuspicious,
      aiSuggestionReason: verification?.reason,
    };

    onProofSubmitted?.(proof);
    Alert.alert("Success", "Proof submitted successfully!", [
      {
        text: "OK",
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Proof</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Bet Info */}
      <View style={styles.betInfoCard}>
        <Text style={styles.betActivity}>{bet.betActivity}</Text>
        <View style={styles.betMetaRow}>
          <View style={styles.betMeta}>
            <Ionicons name={bet.proofType === "live_photo" ? "camera" : "location"} size={16} color="#8E8E93" />
            <Text style={styles.betMetaText}>
              {bet.proofType === "live_photo" ? "Live Photo Required" : "Location Required"}
            </Text>
          </View>
          <View style={styles.betMeta}>
            <Ionicons name="calendar" size={16} color="#8E8E93" />
            <Text style={styles.betMetaText}>{bet.frequency}</Text>
          </View>
        </View>
      </View>

      {/* Proof Type: Live Photo */}
      {bet.proofType === "live_photo" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Take a Photo</Text>

          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />

              {verifying && (
                <View style={styles.verifyingOverlay}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.verifyingText}>AI is verifying...</Text>
                </View>
              )}

              {verification && !verifying && (
                <View
                  style={[
                    styles.verificationBadge,
                    verification.isSuspicious ? styles.verificationBadgeSuspicious : styles.verificationBadgeValid,
                  ]}
                >
                  <Ionicons
                    name={verification.isSuspicious ? "warning" : "checkmark-circle"}
                    size={20}
                    color="white"
                  />
                  <Text style={styles.verificationBadgeText}>
                    {verification.isSuspicious ? "Needs Review" : "Looks Good"}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.retakeButton}
                onPress={() => {
                  setImageUri(null);
                  setVerification(null);
                }}
              >
                <Ionicons name="camera" size={20} color="#007AFF" />
                <Text style={styles.retakeButtonText}>Retake</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleTakePhoto}
                disabled={loading}
              >
                <Ionicons name="camera" size={24} color="white" />
                <Text style={styles.primaryButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handlePickFromGallery}
                disabled={loading}
              >
                <Ionicons name="images" size={24} color="#007AFF" />
                <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          {verification && !verifying && (
            <View style={styles.verificationDetails}>
              <Text style={styles.verificationTitle}>AI Verification Results</Text>
              <Text style={styles.verificationReason}>{verification.reason}</Text>
              <Text style={styles.verificationConfidence}>
                Confidence: {(verification.confidence * 100).toFixed(0)}%
              </Text>
              {verification.suggestions.length > 0 && (
                <View style={styles.suggestionsList}>
                  <Text style={styles.suggestionsTitle}>Suggestions:</Text>
                  {verification.suggestions.map((suggestion, index) => (
                    <Text key={index} style={styles.suggestionItem}>
                      • {suggestion}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Proof Type: Location */}
      {bet.proofType === "location" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Capture Location</Text>

          {location ? (
            <View style={styles.locationCard}>
              <View style={styles.locationIconContainer}>
                <Ionicons name="location" size={32} color="#007AFF" />
              </View>
              <View style={styles.locationDetails}>
                <Text style={styles.locationAddress}>{location.address || "Location captured"}</Text>
                <Text style={styles.locationCoords}>
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.updateLocationButton}
                onPress={handleGetLocation}
                disabled={loading}
              >
                <Ionicons name="refresh" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleGetLocation}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="location" size={24} color="white" />
                  <Text style={styles.primaryButtonText}>Get Current Location</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.locationInfo}>
            <Ionicons name="information-circle" size={20} color="#8E8E93" />
            <Text style={styles.locationInfoText}>
              Your current location will be recorded to verify you completed the activity
            </Text>
          </View>
        </View>
      )}

      {/* Submit Button */}
      {((bet.proofType === "live_photo" && imageUri) || (bet.proofType === "location" && location)) && (
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitProof} disabled={verifying}>
          <Text style={styles.submitButtonText}>Submit Proof</Text>
          <Ionicons name="checkmark-circle" size={24} color="white" />
        </TouchableOpacity>
      )}
    </ScrollView>
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
  betInfoCard: {
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
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  betMetaRow: {
    flexDirection: "row",
    gap: 16,
  },
  betMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  betMetaText: {
    fontSize: 13,
    color: "#8E8E93",
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
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  imagePreviewContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: 300,
    borderRadius: 12,
  },
  verifyingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  verifyingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  verificationBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  verificationBadgeValid: {
    backgroundColor: "#34C759",
  },
  verificationBadgeSuspicious: {
    backgroundColor: "#FF9500",
  },
  verificationBadgeText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  retakeButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retakeButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  verificationDetails: {
    marginTop: 16,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
  },
  verificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  verificationReason: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 8,
  },
  verificationConfidence: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 12,
  },
  suggestionsList: {
    marginTop: 8,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
  },
  suggestionItem: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 4,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  locationDetails: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: "#8E8E93",
  },
  updateLocationButton: {
    padding: 8,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    padding: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    gap: 8,
  },
  locationInfoText: {
    flex: 1,
    fontSize: 13,
    color: "#007AFF",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#34C759",
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 18,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
});
