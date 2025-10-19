import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { verifyBetPhoto } from "@/services/gemini.service";
import { Proof } from "@types";

interface PhotoVerificationScreenProps {
  betId: string;
  betActivity: string;
  onProofSubmitted: (proof: Proof) => void;
  onCancel: () => void;
}

export default function PhotoVerificationScreen({
  betId,
  betActivity,
  onProofSubmitted,
  onCancel,
}: PhotoVerificationScreenProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setVerificationResult(null);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Permission to access camera is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setVerificationResult(null);
    }
  };

  const handleVerifyPhoto = async () => {
    if (!imageUri) return;

    setVerifying(true);
    try {
      const result = await verifyBetPhoto(imageUri, betActivity);
      setVerificationResult(result);
    } catch (error) {
      Alert.alert("Error", "Failed to verify photo. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmitProof = () => {
    if (!imageUri) return;

    const proof: Proof = {
      id: Date.now().toString(),
      betId,
      userId: "currentUser",
      timestamp: new Date(),
      proofType: "live_photo",
      imageUri,
      verified: false,
      aiSuggestionSuspicious: verificationResult?.isSuspicious,
      aiSuggestionReason: verificationResult?.reason,
    };

    onProofSubmitted(proof);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Proof</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.betActivity}>Bet: {betActivity}</Text>

        {!imageUri ? (
          <View style={styles.uploadContainer}>
            <Ionicons name="camera-outline" size={80} color="#C7C7CC" />
            <Text style={styles.uploadText}>Take a photo or choose from library</Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={takePhoto}>
                <Ionicons name="camera" size={24} color="white" />
                <Text style={styles.buttonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={pickImage}>
                <Ionicons name="images" size={24} color="#007AFF" />
                <Text style={styles.buttonTextSecondary}>Choose Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />

            <TouchableOpacity style={styles.changeButton} onPress={pickImage}>
              <Text style={styles.changeButtonText}>Change Photo</Text>
            </TouchableOpacity>

            {!verificationResult && !verifying && (
              <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyPhoto}>
                <Ionicons name="shield-checkmark" size={20} color="white" />
                <Text style={styles.verifyButtonText}>Verify with AI</Text>
              </TouchableOpacity>
            )}

            {verifying && (
              <View style={styles.verifyingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.verifyingText}>Analyzing photo...</Text>
              </View>
            )}

            {verificationResult && (
              <View
                style={[
                  styles.resultCard,
                  verificationResult.isSuspicious ? styles.resultCardWarning : styles.resultCardSuccess,
                ]}
              >
                <View style={styles.resultHeader}>
                  <Ionicons
                    name={verificationResult.isSuspicious ? "alert-circle" : "checkmark-circle"}
                    size={32}
                    color={verificationResult.isSuspicious ? "#FF9500" : "#34C759"}
                  />
                  <Text style={styles.resultTitle}>
                    {verificationResult.isSuspicious ? "Suspicious Photo Detected" : "Photo Looks Good"}
                  </Text>
                </View>

                <Text style={styles.resultReason}>{verificationResult.reason}</Text>

                {verificationResult.suggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>Suggestions:</Text>
                    {verificationResult.suggestions.map((suggestion: string, index: number) => (
                      <Text key={index} style={styles.suggestionItem}>
                        • {suggestion}
                      </Text>
                    ))}
                  </View>
                )}

                <Text style={styles.confidenceText}>
                  Confidence: {(verificationResult.confidence * 100).toFixed(0)}%
                </Text>
              </View>
            )}

            {verificationResult && (
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitProof}>
                <Text style={styles.submitButtonText}>Submit Proof for Review</Text>
              </TouchableOpacity>
            )}

            {verificationResult && verificationResult.isSuspicious && (
              <Text style={styles.warningText}>Note: Your opponent will need to verify this photo manually</Text>
            )}
          </View>
        )}
      </ScrollView>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  betActivity: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 20,
    textAlign: "center",
  },
  uploadContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E5EA",
    borderStyle: "dashed",
  },
  uploadText: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonSecondary: {
    backgroundColor: "#E3F2FD",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTextSecondary: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  imageContainer: {
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  changeButton: {
    padding: 12,
  },
  changeButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    marginTop: 16,
    gap: 8,
  },
  verifyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  verifyingContainer: {
    alignItems: "center",
    padding: 32,
  },
  verifyingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#8E8E93",
  },
  resultCard: {
    width: "100%",
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
  },
  resultCardSuccess: {
    backgroundColor: "#E8F9F0",
    borderWidth: 1,
    borderColor: "#34C759",
  },
  resultCardWarning: {
    backgroundColor: "#FFF5E6",
    borderWidth: 1,
    borderColor: "#FF9500",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    flex: 1,
  },
  resultReason: {
    fontSize: 14,
    color: "#000",
    marginBottom: 12,
    lineHeight: 20,
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  suggestionItem: {
    fontSize: 13,
    color: "#000",
    marginBottom: 4,
    paddingLeft: 8,
  },
  confidenceText: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 12,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#34C759",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    marginTop: 16,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  warningText: {
    fontSize: 12,
    color: "#FF9500",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
});
