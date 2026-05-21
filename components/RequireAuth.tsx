import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured } from "@/lib/env";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { initialized, session } = useAuth();

  if (!isSupabaseConfigured) {
    return <Redirect href="/setup" />;
  }

  if (!initialized) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2f6f4e" />
        <Text style={styles.loadingText}>Checking session...</Text>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center"
  },
  loadingText: {
    color: "#526371",
    fontSize: 15
  }
});
