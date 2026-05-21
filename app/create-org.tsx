import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ErrorMessage, Field, PrimaryButton } from "@/components/Form";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";

export default function CreateOrgScreen() {
  return (
    <RequireAuth>
      <CreateOrgForm />
    </RequireAuth>
  );
}

function CreateOrgForm() {
  const { user } = useAuth();
  const { createInitialOrg } = useOrg();
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState(user?.user_metadata.display_name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      await createInitialOrg(name.trim(), displayName.trim());
      router.replace("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create organization.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.panel}>
        <Text style={styles.title}>Create your organization</Text>
        <Text style={styles.subtitle}>This creates the first tenant and makes you its first Admin.</Text>
        <Field label="Organization name" onChangeText={setName} value={name} />
        <Field label="Your display name" onChangeText={setDisplayName} value={displayName} />
        <ErrorMessage message={error} />
        <PrimaryButton disabled={!name.trim()} loading={loading} onPress={submit}>Create organization</PrimaryButton>
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
    maxWidth: 460,
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
    fontSize: 16,
    lineHeight: 23
  }
});
