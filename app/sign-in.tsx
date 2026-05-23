import { FontAwesome } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ErrorMessage, Field, PrimaryButton, SecondaryButton } from "@/components/Form";
import { useAuth } from "@/contexts/AuthContext";
import type { AuthProviderName } from "@/lib/authRedirects";

export default function SignInScreen() {
  const { signIn, signInWithProvider } = useAuth();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState<AuthProviderName | null>(null);

  async function submit() {
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }

    setLoading(true);
    try {
      await signIn(trimmedEmail, password, returnTo);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function submitProvider(provider: AuthProviderName) {
    setError(null);
    setProviderLoading(provider);
    try {
      await signInWithProvider(provider, returnTo);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Unable to sign in with ${provider}.`);
    } finally {
      setProviderLoading(null);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.panel}>
        <Text style={styles.title}>Animal Care Tracker</Text>
        <Text style={styles.subtitle}>Sign in to your organization workspace.</Text>
        <View style={styles.providerGroup}>
          <SecondaryButton loading={providerLoading === "google"} onPress={() => submitProvider("google")}>
            <View style={styles.providerContent}>
              <FontAwesome color="#1f2933" name="google" size={18} />
              <Text style={styles.providerText}>Continue with Google</Text>
            </View>
          </SecondaryButton>
          <SecondaryButton loading={providerLoading === "apple"} onPress={() => submitProvider("apple")}>
            <View style={styles.providerContent}>
              <FontAwesome color="#1f2933" name="apple" size={20} />
              <Text style={styles.providerText}>Continue with Apple</Text>
            </View>
          </SecondaryButton>
        </View>
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>
        <Field autoCapitalize="none" keyboardType="email-address" label="Email" onChangeText={setEmail} value={email} />
        <Field label="Password" onChangeText={setPassword} secureTextEntry value={password} />
        <ErrorMessage message={error} />
        <PrimaryButton loading={loading} onPress={submit}>Sign in</PrimaryButton>
        <Link href={"/forgot-password" as never} style={styles.link}>Forgot password?</Link>
        <Link
          href={(returnTo ? { pathname: "/sign-up", params: { returnTo } } : "/sign-up") as never}
          style={styles.link}
        >
          Create an account
        </Link>
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
  providerGroup: {
    gap: 10
  },
  providerContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center"
  },
  providerText: {
    color: "#1f2933",
    fontSize: 15,
    fontWeight: "800"
  },
  divider: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  dividerLine: {
    backgroundColor: "#d8dfd4",
    flex: 1,
    height: 1
  },
  dividerText: {
    color: "#526371",
    fontSize: 13,
    fontWeight: "800"
  },
  link: {
    color: "#2f6f4e",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center"
  }
});
