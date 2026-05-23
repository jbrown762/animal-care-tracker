import { Link } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ErrorMessage, Field, PrimaryButton } from "@/components/Form";
import { useAuth } from "@/contexts/AuthContext";

export default function ForgotPasswordScreen() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    setError(null);
    setSent(false);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(trimmedEmail);
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.panel}>
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.subtitle}>Enter your email and we will send you a password reset link.</Text>
        <Field autoCapitalize="none" keyboardType="email-address" label="Email" onChangeText={setEmail} value={email} />
        <ErrorMessage message={error} />
        {sent ? <Text style={styles.success}>Check your email for the reset link.</Text> : null}
        <PrimaryButton disabled={!email.trim()} loading={loading} onPress={submit}>Send reset link</PrimaryButton>
        <Link href="/sign-in" style={styles.link}>Back to sign in</Link>
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
  },
  success: {
    color: "#2f6f4e",
    fontSize: 14,
    fontWeight: "800"
  },
  link: {
    color: "#2f6f4e",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center"
  }
});
