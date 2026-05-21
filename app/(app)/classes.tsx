import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";

import { AppShell, EmptyState, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/Form";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/lib/supabase";

type ClassListItem = {
  created_at: string;
  id: string;
  name: string;
  notes: string | null;
};

export default function ClassesScreen() {
  const { activeOrgId, isAdmin } = useOrg();
  const { data = [] } = useQuery({
    enabled: Boolean(activeOrgId && supabase),
    queryKey: ["classes", activeOrgId],
    queryFn: async () => {
      if (!supabase || !activeOrgId) {
        return [] as ClassListItem[];
      }
      const { data, error } = await supabase
        .from("animal_classes")
        .select("id,name,notes,created_at")
        .eq("org_id", activeOrgId)
        .order("name");
      if (error) {
        throw error;
      }
      return data as ClassListItem[];
    }
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Template library"
        title="Classes"
        description={
          isAdmin
            ? "Admins will manage class templates here; changes propagate to inherited animal tasks."
            : "Caretakers can view class templates here. Editing controls stay gated to Admins."
        }
      />
      {data.length === 0 ? (
        <EmptyState
          icon="albums-outline"
          title="No classes yet"
          body="Suggested classes can be seeded when the first org is created, and custom class CRUD will attach here."
        />
      ) : (
        <View style={styles.grid}>
          {data.map((animalClass) => (
            <Card key={animalClass.id}>
              <Text style={styles.cardTitle}>{animalClass.name}</Text>
              <Text style={styles.muted}>{animalClass.notes ?? "Template tasks pending"}</Text>
            </Card>
          ))}
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 12
  },
  cardTitle: {
    color: "#1f2933",
    fontSize: 18,
    fontWeight: "800"
  },
  muted: {
    color: "#526371"
  }
});
