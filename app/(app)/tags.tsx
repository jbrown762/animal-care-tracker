import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppShell, EmptyState, PageHeader } from "@/components/AppShell";
import { Card, ErrorMessage, Field, PrimaryButton } from "@/components/Form";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type Tag = Database["public"]["Tables"]["tags"]["Row"];

const COLOR_OPTIONS = ["#2f6f4e", "#2563eb", "#7c3aed", "#dc2626", "#d97706", "#0f766e", "#64748b"];

export default function TagsScreen() {
  const { activeOrgId, isAdmin } = useOrg();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState(COLOR_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);

  const tagsQuery = useQuery({
    enabled: Boolean(activeOrgId && supabase),
    queryKey: ["tags", activeOrgId],
    queryFn: async () => {
      if (!supabase || !activeOrgId) {
        return [];
      }
      const { data, error: queryError } = await supabase
        .from("tags")
        .select("*")
        .eq("org_id", activeOrgId)
        .order("name", { ascending: true });
      if (queryError) {
        throw queryError;
      }
      return data as Tag[];
    }
  });

  const invalidateTags = async () => {
    await queryClient.invalidateQueries({ queryKey: ["tags", activeOrgId] });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!supabase || !activeOrgId) {
        throw new Error("No active organization.");
      }
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error("Enter a tag name.");
      }
      const { error: mutationError } = await (supabase as any).from("tags").insert({
        color,
        name: trimmedName,
        org_id: activeOrgId
      });
      if (mutationError) {
        throw mutationError;
      }
    },
    onSuccess: async () => {
      setName("");
      setColor(COLOR_OPTIONS[0]);
      await invalidateTags();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!supabase || !editingId) {
        throw new Error("No tag selected.");
      }
      const trimmedName = editingName.trim();
      if (!trimmedName) {
        throw new Error("Enter a tag name.");
      }
      const { error: mutationError } = await (supabase as any)
        .from("tags")
        .update({ color: editingColor, name: trimmedName })
        .eq("id", editingId);
      if (mutationError) {
        throw mutationError;
      }
    },
    onSuccess: async () => {
      clearEditing();
      await invalidateTags();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (tagId: string) => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }
      const { error: mutationError } = await (supabase as any).from("tags").delete().eq("id", tagId);
      if (mutationError) {
        throw mutationError;
      }
    },
    onSuccess: invalidateTags
  });

  async function createTag() {
    setError(null);
    try {
      await createMutation.mutateAsync();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create tag.");
    }
  }

  async function updateTag() {
    setError(null);
    try {
      await updateMutation.mutateAsync();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update tag.");
    }
  }

  async function deleteTag(tagId: string) {
    setError(null);
    try {
      await deleteMutation.mutateAsync(tagId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete tag.");
    }
  }

  function startEditing(tag: Tag) {
    setError(null);
    setEditingId(tag.id);
    setEditingName(tag.name);
    setEditingColor(tag.color ?? COLOR_OPTIONS[0]);
  }

  function clearEditing() {
    setEditingId(null);
    setEditingName("");
    setEditingColor(COLOR_OPTIONS[0]);
  }

  const tags = tagsQuery.data ?? [];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Organization"
        title="Tags"
        description="Use tags to group care tasks and make work easier to scan across animals and templates."
      />

      {isAdmin ? (
        <Card>
          <Text style={styles.sectionTitle}>{editingId ? "Edit tag" : "Create tag"}</Text>
          <View style={styles.form}>
            <Field label="Name" onChangeText={editingId ? setEditingName : setName} value={editingId ? editingName : name} />
            <ColorPicker color={editingId ? editingColor : color} onChange={editingId ? setEditingColor : setColor} />
            <ErrorMessage message={error} />
            <View style={styles.formActions}>
              <PrimaryButton
                disabled={editingId ? !editingName.trim() : !name.trim()}
                loading={editingId ? updateMutation.isPending : createMutation.isPending}
                onPress={editingId ? updateTag : createTag}
              >
                {editingId ? "Save tag" : "Create tag"}
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
          <Text style={styles.muted}>Caretakers can view tags. Admins can create, edit, and delete them.</Text>
        </Card>
      )}

      <Card>
        <Text style={styles.sectionTitle}>Tag library</Text>
        {tagsQuery.isLoading ? <Text style={styles.muted}>Loading tags...</Text> : null}
        {tagsQuery.isError ? <Text style={styles.errorText}>Unable to load tags.</Text> : null}
        {!tagsQuery.isLoading && tags.length === 0 ? (
          <EmptyState icon="ticket-outline" title="No tags yet" body="Create tags for common categories, locations, priorities, or care routines." />
        ) : null}
        {tags.map((tag) => (
          <View key={tag.id} style={styles.row}>
            <View style={styles.tagInfo}>
              <View style={StyleSheet.flatten([styles.swatch, { backgroundColor: tag.color ?? COLOR_OPTIONS[0] }])} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{tag.name}</Text>
                <Text style={styles.muted}>{tag.color ?? "No color"}</Text>
              </View>
            </View>
            {isAdmin ? (
              <View style={styles.rowActions}>
                <Pressable onPress={() => startEditing(tag)} style={styles.smallButton}>
                  <Text style={styles.smallButtonText}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => deleteTag(tag.id)} style={styles.dangerButton}>
                  <Text style={styles.dangerButtonText}>Delete</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}
      </Card>
    </AppShell>
  );
}

function ColorPicker({ color, onChange }: { color: string; onChange: (color: string) => void }) {
  return (
    <View style={styles.colorPicker}>
      <Text style={styles.label}>Color</Text>
      <View style={styles.colorRow}>
        {COLOR_OPTIONS.map((option) => {
          const selected = option === color;
          return (
            <Pressable
              accessibilityLabel={`Use color ${option}`}
              accessibilityRole="button"
              key={option}
              onPress={() => onChange(option)}
              style={StyleSheet.flatten([styles.colorButton, selected && styles.colorButtonSelected])}
            >
              <View style={StyleSheet.flatten([styles.colorDot, { backgroundColor: option }])} />
            </Pressable>
          );
        })}
      </View>
    </View>
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
  label: {
    color: "#415466",
    fontSize: 14,
    fontWeight: "700"
  },
  colorPicker: {
    gap: 8
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  colorButton: {
    alignItems: "center",
    borderColor: "#cdd7c8",
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  colorButtonSelected: {
    borderColor: "#1f2933",
    borderWidth: 2
  },
  colorDot: {
    borderRadius: 12,
    height: 24,
    width: 24
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
  row: {
    alignItems: "center",
    borderTopColor: "#edf0ea",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingTop: 12
  },
  tagInfo: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 12
  },
  swatch: {
    borderColor: "#d8dfd4",
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    width: 36
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
