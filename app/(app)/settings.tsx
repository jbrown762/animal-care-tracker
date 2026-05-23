import { StyleSheet, Text } from "react-native";

import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/Form";
import { useOrg } from "@/contexts/OrgContext";

export default function SettingsScreen() {
  const { activeRole } = useOrg();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Organization"
        title="Org Settings"
        description="Organization preferences, billing, tags, and food item management will live here as those screens come online."
      />
      <Card>
        <Text style={styles.sectionTitle}>Your access</Text>
        <Text style={styles.muted}>Current role: {activeRole ?? "member"}</Text>
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>Settings areas</Text>
        <Text style={styles.mutedLong}>
          People and role management now has its own screen. Tags, food items, and organization preferences are next.
        </Text>
      </Card>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: "#1f2933",
    fontSize: 18,
    fontWeight: "800"
  },
  muted: {
    color: "#526371",
    fontSize: 14
  },
  mutedLong: {
    color: "#526371",
    fontSize: 14,
    lineHeight: 20
  }
});
