import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";

import { AppShell, EmptyState, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/Form";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/lib/supabase";

type AnimalListItem = {
  class_id: string;
  created_at: string;
  id: string;
  name: string;
  species: string | null;
  status: string;
};

export default function AnimalsScreen() {
  const { activeOrgId } = useOrg();
  const { data = [] } = useQuery({
    enabled: Boolean(activeOrgId && supabase),
    queryKey: ["animals", activeOrgId],
    queryFn: async () => {
      if (!supabase || !activeOrgId) {
        return [] as AnimalListItem[];
      }
      const { data, error } = await supabase
        .from("animals")
        .select("id,name,status,species,class_id,created_at")
        .eq("org_id", activeOrgId)
        .order("name");
      if (error) {
        throw error;
      }
      return data as AnimalListItem[];
    }
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Animal records"
        title="Animals"
        description="Search, filters, profile editing, and inherited task lists will build on this tenant-scoped list."
      />
      {data.length === 0 ? (
        <EmptyState
          icon="paw-outline"
          title="No animals yet"
          body="Animal CRUD is scaffold-ready. Admins will create animals here and each new animal will inherit tasks from its class template."
        />
      ) : (
        <View style={styles.grid}>
          {data.map((animal) => (
            <Card key={animal.id}>
              <Text style={styles.cardTitle}>{animal.name}</Text>
              <Text style={styles.muted}>{animal.status}</Text>
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
    color: "#526371",
    textTransform: "capitalize"
  }
});
