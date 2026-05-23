import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppShell, EmptyState, PageHeader } from "@/components/AppShell";
import { Card, ErrorMessage, Field, PrimaryButton } from "@/components/Form";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type FoodItem = Database["public"]["Tables"]["food_items"]["Row"];

export default function FoodItemsScreen() {
  const { activeOrgId, isAdmin } = useOrg();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const foodItemsQuery = useQuery({
    enabled: Boolean(activeOrgId && supabase),
    queryKey: ["food-items", activeOrgId],
    queryFn: async () => {
      if (!supabase || !activeOrgId) {
        return [];
      }
      const { data, error: queryError } = await supabase
        .from("food_items")
        .select("*")
        .eq("org_id", activeOrgId)
        .order("name", { ascending: true });
      if (queryError) {
        throw queryError;
      }
      return data as FoodItem[];
    }
  });

  const invalidateFoodItems = async () => {
    await queryClient.invalidateQueries({ queryKey: ["food-items", activeOrgId] });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!supabase || !activeOrgId) {
        throw new Error("No active organization.");
      }
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error("Enter a food item name.");
      }
      const { error: mutationError } = await (supabase as any).from("food_items").insert({
        name: trimmedName,
        org_id: activeOrgId
      });
      if (mutationError) {
        throw mutationError;
      }
    },
    onSuccess: async () => {
      setName("");
      await invalidateFoodItems();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!supabase || !editingId) {
        throw new Error("No food item selected.");
      }
      const trimmedName = editingName.trim();
      if (!trimmedName) {
        throw new Error("Enter a food item name.");
      }
      const { error: mutationError } = await (supabase as any)
        .from("food_items")
        .update({ name: trimmedName })
        .eq("id", editingId);
      if (mutationError) {
        throw mutationError;
      }
    },
    onSuccess: async () => {
      clearEditing();
      await invalidateFoodItems();
    }
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ archived, itemId }: { archived: boolean; itemId: string }) => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }
      const { error: mutationError } = await (supabase as any)
        .from("food_items")
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq("id", itemId);
      if (mutationError) {
        throw mutationError;
      }
    },
    onSuccess: invalidateFoodItems
  });

  async function createFoodItem() {
    setError(null);
    try {
      await createMutation.mutateAsync();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create food item.");
    }
  }

  async function updateFoodItem() {
    setError(null);
    try {
      await updateMutation.mutateAsync();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update food item.");
    }
  }

  async function archiveFoodItem(itemId: string, archived: boolean) {
    setError(null);
    try {
      await archiveMutation.mutateAsync({ archived, itemId });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update food item.");
    }
  }

  function startEditing(item: FoodItem) {
    setError(null);
    setEditingId(item.id);
    setEditingName(item.name);
  }

  function clearEditing() {
    setEditingId(null);
    setEditingName("");
  }

  const foodItems = foodItemsQuery.data ?? [];
  const visibleFoodItems = foodItems.filter((item) => showArchived || !item.archived_at);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Organization"
        title="Food Items"
        description="Manage the food options available when logging food-related care tasks."
      />

      {isAdmin ? (
        <Card>
          <Text style={styles.sectionTitle}>{editingId ? "Edit food item" : "Create food item"}</Text>
          <View style={styles.form}>
            <Field label="Name" onChangeText={editingId ? setEditingName : setName} value={editingId ? editingName : name} />
            <ErrorMessage message={error} />
            <View style={styles.formActions}>
              <PrimaryButton
                disabled={editingId ? !editingName.trim() : !name.trim()}
                loading={editingId ? updateMutation.isPending : createMutation.isPending}
                onPress={editingId ? updateFoodItem : createFoodItem}
              >
                {editingId ? "Save food item" : "Create food item"}
              </PrimaryButton>
              {editingId ? (
                <Pressable onPress={clearEditing} style={styles.secondaryAction}>
                  <Text style={styles.secondaryActionText}>Cancel</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </Card>
      ) : (
        <Card>
          <Text style={styles.sectionTitle}>Read-only access</Text>
          <Text style={styles.muted}>Caretakers can view food items. Admins can create, edit, archive, and restore them.</Text>
        </Card>
      )}

      <Card>
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Food library</Text>
          <Pressable onPress={() => setShowArchived((current) => !current)} style={styles.smallButton}>
            <Text style={styles.smallButtonText}>{showArchived ? "Hide archived" : "Show archived"}</Text>
          </Pressable>
        </View>
        {foodItemsQuery.isLoading ? <Text style={styles.muted}>Loading food items...</Text> : null}
        {foodItemsQuery.isError ? <Text style={styles.errorText}>Unable to load food items.</Text> : null}
        {!foodItemsQuery.isLoading && visibleFoodItems.length === 0 ? (
          <EmptyState icon="pricetag-outline" title="No food items yet" body="Create food items such as pellets, greens, hay, fish, or supplements." />
        ) : null}
        {visibleFoodItems.map((item) => {
          const archived = Boolean(item.archived_at);
          return (
            <View key={item.id} style={styles.row}>
              <View style={styles.rowText}>
                <Text style={StyleSheet.flatten([styles.rowTitle, archived && styles.archivedText])}>{item.name}</Text>
                <Text style={styles.muted}>{archived ? "Archived" : "Active"}</Text>
              </View>
              {isAdmin ? (
                <View style={styles.rowActions}>
                  <Pressable disabled={archived} onPress={() => startEditing(item)} style={styles.smallButton}>
                    <Text style={styles.smallButtonText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => archiveFoodItem(item.id, !archived)}
                    style={archived ? styles.smallButton : styles.dangerButton}
                  >
                    <Text style={archived ? styles.smallButtonText : styles.dangerButtonText}>
                      {archived ? "Restore" : "Archive"}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
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
  errorText: {
    color: "#b42318",
    fontSize: 14,
    fontWeight: "700"
  },
  form: {
    gap: 14,
    maxWidth: 520,
    width: "100%"
  },
  formActions: {
    gap: 10
  },
  secondaryAction: {
    alignItems: "center",
    borderColor: "#cdd7c8",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 16
  },
  secondaryActionText: {
    color: "#415466",
    fontSize: 15,
    fontWeight: "800"
  },
  listHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  row: {
    alignItems: "center",
    borderTopColor: "#edf0ea",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingTop: 12
  },
  rowText: {
    flex: 1,
    gap: 3
  },
  rowTitle: {
    color: "#1f2933",
    fontSize: 15,
    fontWeight: "800"
  },
  archivedText: {
    color: "#64748b",
    textDecorationLine: "line-through"
  },
  rowActions: {
    flexDirection: "row",
    gap: 8
  },
  smallButton: {
    borderColor: "#cdd7c8",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  smallButtonText: {
    color: "#415466",
    fontWeight: "800"
  },
  dangerButton: {
    borderColor: "#f2b8ad",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  dangerButtonText: {
    color: "#b42318",
    fontWeight: "800"
  }
});
