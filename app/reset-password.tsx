import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ErrorMessage, Field, PrimaryButton } from "@/components/Form";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/contexts/AuthContext";

export default function ResetPasswordScreen() {
  return (
    <RequireAuth>
      <ResetPasswordForm />
    </RequireAuth>
  );
}

function ResetPasswordForm() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.panel}>
        <Text style={styles.title}>Choose a new password</Text>
        <Text style={styles.subtitle}>Use a new password for your Animal Care Tracker account.</Text>
        <Field label="New password" onChangeText={setPassword} secureTextEntry value={password} />
        <Field label="Confirm password" onChangeText={setConfirmPassword} secureTextEntry value={confirmPassword} />
        <ErrorMessage message={error} />
        <PrimaryButton loading={loading} onPress={submit}>Update password</PrimaryButton>
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
