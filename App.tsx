import React, { useEffect } from "react";
import { ApolloProvider } from "@apollo/client";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { apolloClient } from "@/config/apolloClient";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { pingBackendHealth } from "@/config/apolloClient";

import LoginScreen from "@/screens/LoginScreen";
import RegisterScreen from "@/screens/RegisterScreen";
import BetsScreen from "@/screens/BetsScreen";
import BetDetailsScreen from "@/screens/BetDetailsScreen";
import LeaderboardScreen from "@/screens/LeaderboardScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import FriendGroupsScreen from "@/screens/FriendGroupsScreen";
import BetGroupsScreen from "@/screens/BetGroupsScreen";
import SubmitProofScreen from "@/screens/SubmitProofScreen";
import GroupDetailsScreen from "@/screens/GroupDetailsScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";
import GlobalReviewsScreen from "@/screens/GlobalReviewsScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function BetsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BetsHome" component={BetsScreen} />
      <Stack.Screen name="BetDetails" component={BetDetailsScreen} />
      <Stack.Screen name="SubmitProof" component={SubmitProofScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="FriendGroups" component={FriendGroupsScreen} />
      <Stack.Screen name="BetGroups" component={BetGroupsScreen} />
      <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E5EA",
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: "#FFFFFF",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: "#E5E5EA",
        },
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
      }}
    >
      <Tab.Screen
        name="Bets"
        component={BetsStack}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="hand-left" size={size} color={color} />,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Reviews"
        component={GlobalReviewsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="eye" size={size} color={color} />,
          title: "Review Proofs",
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="trophy" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  React.useEffect(() => {
    if (!isLoading && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [isLoading, isInitialLoad]);

  // Only show loading screen on initial app load, not during login/logout
  if (isInitialLoad && isLoading) {
    return null; // Add loading screen here if desired
  }

  return <NavigationContainer>{isAuthenticated ? <MainTabs /> : <AuthStack />}</NavigationContainer>;
}

export default function App() {
  useEffect(() => {
    pingBackendHealth().then((result: any) => {
      if (result.status === "ok") {
        console.log("Backend connected successfully");
      } else if (result.status === "unexpected") {
        console.log("Backend unexpected response:", result.result);
      } else {
        console.log("Backend connection failed:", result.error);
      }
    });
  }, []);

  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
    </ApolloProvider>
  );
}
