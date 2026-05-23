import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";

import { ErrorMessage, PrimaryButton } from "@/components/Form";
import { useAuth } from "@/contexts/AuthContext";

function getCurrentUrl(url: string | null) {
  if (url) {
    return url;
  }
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.href;
  }
  return null;
}

export default function AuthCallbackScreen() {
  const incomingUrl = Linking.useURL();
  const { completeAuthRedirect } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const callbackUrl = getCurrentUrl(incomingUrl);
    if (!callbackUrl) {
      return;
    }

    completeAuthRedirect(callbackUrl)
      .then((next) => {
        router.replace((next ?? "/") as never);
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Unable to complete sign-in.");
      });
  }, [completeAuthRedirect, incomingUrl]);

  return (
    <View style={styles.page}>
      <View style={styles.panel}>
        {error ? (
          <>
            <Text style={styles.title}>Sign-in failed</Text>
            <ErrorMessage message={error} />
            <PrimaryButton onPress={() => router.replace("/sign-in")}>Back to sign in</PrimaryButton>
          </>
        ) : (
          <>
            <ActivityIndicator color="#2f6f4e" />
            <Text style={styles.title}>Completing sign-in...</Text>
            <Text style={styles.subtitle}>You will be redirected automatically.</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    alignItems: "center",
    backgroundColor: "#f5f7f2",
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  panel: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d8dfd4",
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    maxWidth: 440,
    padding: 24,
    width: "100%"
  },
  subtitle: {
    color: "#526371",
    fontSize: 15,
    textAlign: "center"
  },
  title: {
    color: "#1f2933",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center"
  }
});
