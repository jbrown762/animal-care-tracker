import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ErrorMessage, PrimaryButton } from "@/components/Form";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/lib/supabase";

export default function InviteScreen() {
  return (
    <RequireAuth>
      <InviteAcceptance />
    </RequireAuth>
  );
}

function InviteAcceptance() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function accept() {
    setError(null);
    setLoading(true);
    try {
      if (!supabase || !token) {
        throw new Error("Invite link is incomplete.");
      }
      const { error: rpcError } = await (supabase as any).rpc("accept_org_invitation", { invite_token: token });
      if (rpcError) {
        throw rpcError;
      }
      router.replace("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to accept invitation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.panel}>
        <Text style={styles.title}>Accept invitation</Text>
        <Text style={styles.subtitle}>Join the organization attached to this invitation link.</Text>
        <ErrorMessage message={error} />
        <PrimaryButton loading={loading} onPress={accept}>Accept invitation</PrimaryButton>
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
    backgroundColor: "#ffffff",
    borderColor: "#d8dfd4",
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    maxWidth: 440,
    padding: 24,
    width: "100%"
  },
  title: {
    color: "#1f2933",
    fontSize: 28,
    fontWeight: "900"
  },
  subtitle: {
    color: "#526371",
    fontSize: 16
  }
});
