import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Form";

export default function SetupScreen() {
  return (
    <View style={styles.page}>
      <Card>
        <Text style={styles.title}>Connect Supabase</Text>
        <Text style={styles.body}>
          Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `.env`, then restart Expo.
        </Text>
        <Text style={styles.code}>Copy `.env.example` to `.env` to start.</Text>
      </Card>
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
  title: {
    color: "#1f2933",
    fontSize: 28,
    fontWeight: "900"
  },
  body: {
    color: "#526371",
    fontSize: 16,
    lineHeight: 23,
    maxWidth: 560
  },
  code: {
    color: "#2f6f4e",
    fontFamily: "monospace",
    fontSize: 14
  }
});
