import { Link } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ErrorMessage, Field, PrimaryButton } from "@/components/Form";
import { useAuth } from "@/contexts/AuthContext";

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      await signUp(email.trim(), password, displayName.trim());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.panel}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>You will create the first organization after signup.</Text>
        <Field label="Display name" onChangeText={setDisplayName} value={displayName} />
        <Field autoCapitalize="none" keyboardType="email-address" label="Email" onChangeText={setEmail} value={email} />
        <Field label="Password" onChangeText={setPassword} secureTextEntry value={password} />
        <ErrorMessage message={error} />
        <PrimaryButton loading={loading} onPress={submit}>Create account</PrimaryButton>
        <Link href="/sign-in" style={styles.link}>Already have an account?</Link>
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
  link: {
    color: "#2f6f4e",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center"
  }
});
