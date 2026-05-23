import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppShell, EmptyState, PageHeader } from "@/components/AppShell";
import { Card, ErrorMessage, Field, PrimaryButton } from "@/components/Form";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/lib/supabase";
import type { Database, ValueType } from "@/types/database";

type AnimalClass = Database["public"]["Tables"]["animal_classes"]["Row"];
type Template = Database["public"]["Tables"]["task_category_templates"]["Row"];
type Tag = Database["public"]["Tables"]["tags"]["Row"];
type TemplateTag = Database["public"]["Tables"]["task_template_tags"]["Row"];

type ClassWithTemplates = AnimalClass & {
  templates: (Template & { tags: Tag[] })[];
};

const VALUE_TYPES: ValueType[] = ["completion", "numeric", "text", "food"];

const emptyTemplateForm = {
  dueSoonDays: "2",
  instructions: "",
  intervalDays: "7",
  name: "",
  species: "",
  tagIds: [] as string[],
  valueType: "completion" as ValueType,
  valueUnit: ""
};

export default function ClassesScreen() {
  const { activeOrgId, isAdmin } = useOrg();
  const queryClient = useQueryClient();
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [className, setClassName] = useState("");
  const [classNotes, setClassNotes] = useState("");
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingClassName, setEditingClassName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const classNameInputRef = useRef<TextInput>(null);

  const classesQuery = useQuery({
    enabled: Boolean(activeOrgId && supabase),
    queryKey: ["classes-with-templates", activeOrgId],
    queryFn: async () => {
      if (!supabase || !activeOrgId) {
        return [] as ClassWithTemplates[];
      }

      const { data: classRows, error: classError } = await supabase
        .from("animal_classes")
        .select("*")
        .eq("org_id", activeOrgId)
        .order("name", { ascending: true });
      if (classError) {
        throw classError;
      }

      const classes = classRows as AnimalClass[];
      const classIds = classes.map((animalClass) => animalClass.id);
      if (classIds.length === 0) {
        return [];
      }

      const { data: templatesData, error: templateError } = await supabase
        .from("task_category_templates")
        .select("*")
        .in("class_id", classIds)
        .order("name", { ascending: true });
      if (templateError) {
        throw templateError;
      }

      const templates = templatesData as Template[];
      const templateIds = templates.map((template) => template.id);
      const templateTags = templateIds.length > 0 ? await loadTemplateTags(templateIds) : [];

      return classes.map((animalClass) => ({
        ...animalClass,
        templates: templates
          .filter((template) => template.class_id === animalClass.id)
          .map((template) => ({
            ...template,
            tags: templateTags.filter((join) => join.task_template_id === template.id).map((join) => join.tags)
          }))
      }));
    }
  });

  const tagsQuery = useQuery({
    enabled: Boolean(activeOrgId && supabase),
    queryKey: ["tags", activeOrgId],
    queryFn: async () => {
      if (!supabase || !activeOrgId) {
        return [] as Tag[];
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

  const classes = useMemo(() => classesQuery.data ?? [], [classesQuery.data]);
  const tags = tagsQuery.data ?? [];
  const selectedClass = useMemo(
    () => classes.find((animalClass) => animalClass.id === selectedClassId) ?? classes[0] ?? null,
    [classes, selectedClassId]
  );

  const invalidateClasses = async () => {
    await queryClient.invalidateQueries({ queryKey: ["classes-with-templates", activeOrgId] });
  };

  const createClassMutation = useMutation({
    mutationFn: async () => {
      if (!supabase || !activeOrgId) {
        throw new Error("No active organization.");
      }
      const trimmedName = className.trim();
      if (!trimmedName) {
        throw new Error("Enter a class name.");
      }
      const { data, error: mutationError } = await (supabase as any)
        .from("animal_classes")
        .insert({
          name: trimmedName,
          notes: classNotes.trim() || null,
          org_id: activeOrgId
        })
        .select("id")
        .single();
      if (mutationError) {
        throw mutationError;
      }
      return data.id as string;
    },
    onSuccess: async (newClassId) => {
      setClassName("");
      setClassNotes("");
      setShowCreateClass(false);
      setSelectedClassId(newClassId);
      await invalidateClasses();
    }
  });

  const updateClassMutation = useMutation({
    mutationFn: async () => {
      if (!supabase || !editingClassId) {
        throw new Error("No class selected.");
      }
      const trimmedName = editingClassName.trim();
      if (!trimmedName) {
        throw new Error("Enter a class name.");
      }
      const { error: mutationError } = await (supabase as any)
        .from("animal_classes")
        .update({ name: trimmedName })
        .eq("id", editingClassId);
      if (mutationError) {
        throw mutationError;
      }
    },
    onSuccess: async () => {
      clearClassEditing();
      await invalidateClasses();
    }
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (classId: string) => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }
      const { error: mutationError } = await (supabase as any).from("animal_classes").delete().eq("id", classId);
      if (mutationError) {
        throw mutationError;
      }
    },
    onSuccess: async () => {
      setSelectedClassId(null);
      await invalidateClasses();
    }
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!supabase || !selectedClass) {
        throw new Error("Select a class first.");
      }
      const payload = buildTemplatePayload(selectedClass.id, templateForm);

      const { data, error: mutationError } = editingTemplateId
        ? await (supabase as any)
            .from("task_category_templates")
            .update(payload)
            .eq("id", editingTemplateId)
            .select("id")
            .single()
        : await (supabase as any).from("task_category_templates").insert(payload).select("id").single();
      if (mutationError) {
        throw mutationError;
      }

      const templateId = (data.id as string) ?? editingTemplateId;
      await replaceTemplateTags(templateId, templateForm.tagIds);
    },
    onSuccess: async () => {
      clearTemplateEditing();
      setShowTaskForm(false);
      await invalidateClasses();
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }
      const { error: mutationError } = await (supabase as any)
        .from("task_category_templates")
        .delete()
        .eq("id", templateId);
      if (mutationError) {
        throw mutationError;
      }
    },
    onSuccess: invalidateClasses
  });

  async function createClass() {
    setError(null);
    try {
      await createClassMutation.mutateAsync();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create class.");
    }
  }

  async function updateClass() {
    setError(null);
    try {
      await updateClassMutation.mutateAsync();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update class.");
    }
  }

  async function deleteClass(classId: string) {
    setError(null);
    try {
      await deleteClassMutation.mutateAsync(classId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete class.");
    }
  }

  function confirmDeleteClass(animalClass: ClassWithTemplates) {
    const message =
      animalClass.templates.length > 0
        ? `Delete ${animalClass.name} and its ${animalClass.templates.length} class tasks? This cannot be undone.`
        : `Delete ${animalClass.name}? This cannot be undone.`;

    if (typeof window !== "undefined" && typeof window.confirm === "function") {
      if (window.confirm(message)) {
        void deleteClass(animalClass.id);
      }
      return;
    }

    Alert.alert("Delete class?", message, [
      { text: "Cancel", style: "cancel" },
      { onPress: () => void deleteClass(animalClass.id), style: "destructive", text: "Delete" }
    ]);
  }

  async function saveTemplate() {
    setError(null);
    try {
      await saveTemplateMutation.mutateAsync();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save task.");
    }
  }

  async function deleteTemplate(templateId: string) {
    setError(null);
    try {
      await deleteTemplateMutation.mutateAsync(templateId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete task.");
    }
  }

  function startClassEditing(animalClass: AnimalClass) {
    setError(null);
    setSelectedClassId(animalClass.id);
    setEditingClassId(animalClass.id);
    setEditingClassName(animalClass.name);
    requestAnimationFrame(() => classNameInputRef.current?.focus());
  }

  function clearClassEditing() {
    setEditingClassId(null);
    setEditingClassName("");
  }

  function startTemplateEditing(template: Template & { tags: Tag[] }) {
    setError(null);
    setEditingTemplateId(template.id);
    setShowTaskForm(true);
    setTemplateForm({
      dueSoonDays: String(template.due_soon_days),
      instructions: template.instructions ?? "",
      intervalDays: String(template.interval_days),
      name: template.name,
      species: template.species ?? "",
      tagIds: template.tags.map((tag) => tag.id),
      valueType: template.value_type,
      valueUnit: template.value_unit ?? ""
    });
  }

  function clearTemplateEditing() {
    setEditingTemplateId(null);
    setTemplateForm(emptyTemplateForm);
  }

  function startTaskCreation() {
    setError(null);
    clearTemplateEditing();
    setShowTaskForm(true);
  }

  function toggleTemplateTag(tagId: string) {
    setTemplateForm((current) => ({
      ...current,
      tagIds: current.tagIds.includes(tagId)
        ? current.tagIds.filter((currentTagId) => currentTagId !== tagId)
        : [...current.tagIds, tagId]
    }));
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Task library"
        title="Classes & Tasks"
        description={
          isAdmin
            ? "Create animal classes and reusable care tasks for each class."
            : "View class tasks and inherited care routines. Editing controls are available to Admins."
        }
      />

      {classesQuery.isLoading ? (
        <Card><Text style={styles.muted}>Loading classes...</Text></Card>
      ) : null}
      {classesQuery.isError ? (
        <Card><Text style={styles.errorText}>Unable to load classes.</Text></Card>
      ) : null}
      {!classesQuery.isLoading && classes.length === 0 ? (
        <EmptyState icon="albums-outline" title="No classes yet" body="Create classes such as Reptile, Bird, Mammal, or Fish, then add reusable class tasks." />
      ) : null}

      {classes.length > 0 ? (
        <View style={styles.layout}>
          <Card>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>Classes</Text>
              {isAdmin ? (
                <Pressable
                  onPress={() => {
                    clearClassEditing();
                    setShowCreateClass((current) => !current);
                  }}
                  style={styles.smallButton}
                >
                  <Text style={styles.smallButtonText}>{showCreateClass ? "Cancel" : "+ New class"}</Text>
                </Pressable>
              ) : null}
            </View>
            {showCreateClass ? (
              <View style={styles.inlineForm}>
                <Field label="Name" onChangeText={setClassName} value={className} />
                <Field label="Notes" multiline onChangeText={setClassNotes} value={classNotes} />
                <ErrorMessage message={error} />
                <PrimaryButton disabled={!className.trim()} loading={createClassMutation.isPending} onPress={createClass}>
                  Create class
                </PrimaryButton>
              </View>
            ) : null}
            {classes.map((animalClass) => {
              const selected = selectedClass?.id === animalClass.id;
              const editing = editingClassId === animalClass.id;
              return (
                <Pressable
                  key={animalClass.id}
                  onPress={() => {
                    setSelectedClassId(animalClass.id);
                    clearTemplateEditing();
                    setShowTaskForm(false);
                  }}
                  style={StyleSheet.flatten([styles.classItem, selected && styles.classItemActive])}
                >
                  <View style={styles.rowText}>
                    {editing ? (
                      <TextInput
                        onChangeText={setEditingClassName}
                        ref={classNameInputRef}
                        style={styles.inlineInput}
                        value={editingClassName}
                      />
                    ) : (
                      <Text style={StyleSheet.flatten([styles.rowTitle, selected && styles.classItemTitleActive])}>{animalClass.name}</Text>
                    )}
                    <Text style={styles.muted}>{animalClass.templates.length} tasks</Text>
                  </View>
                  {isAdmin ? (
                    <View style={styles.rowActions}>
                      {editing ? (
                        <>
                          <Pressable onPress={updateClass} style={styles.smallButton}>
                            <Text style={styles.smallButtonText}>Save</Text>
                          </Pressable>
                          <Pressable onPress={clearClassEditing} style={styles.smallButton}>
                            <Text style={styles.smallButtonText}>Cancel</Text>
                          </Pressable>
                        </>
                      ) : (
                        <>
                          <Pressable onPress={() => startClassEditing(animalClass)} style={styles.smallButton}>
                            <Text style={styles.smallButtonText}>Edit</Text>
                          </Pressable>
                          <Pressable onPress={() => confirmDeleteClass(animalClass)} style={styles.dangerButton}>
                            <Text style={styles.dangerButtonText}>Delete</Text>
                          </Pressable>
                        </>
                      )}
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </Card>

          {selectedClass ? (
            <View style={styles.detailColumn}>
              <Card>
                <View style={styles.classDetailHeader}>
                  <View style={styles.rowText}>
                    <Text style={styles.sectionTitle}>{selectedClass.name}</Text>
                    <Text style={styles.muted}>{selectedClass.templates.length} tasks</Text>
                  </View>
                </View>
                <View style={styles.notesBlock}>
                  <Text style={styles.label}>Notes</Text>
                  <Text style={selectedClass.notes ? styles.notesText : styles.muted}>
                    {selectedClass.notes || "No notes yet."}
                  </Text>
                </View>
              </Card>

              <Card>
                <View style={styles.cardHeader}>
                  <View style={styles.rowText}>
                    <Text style={styles.sectionTitle}>{selectedClass.name} tasks</Text>
                    <Text style={styles.muted}>These tasks become the starting care routine for animals in this class.</Text>
                  </View>
                  {isAdmin ? (
                    <Pressable onPress={startTaskCreation} style={styles.smallButton}>
                      <Text style={styles.smallButtonText}>+ New task</Text>
                    </Pressable>
                  ) : null}
                </View>
                {selectedClass.templates.length === 0 ? (
                  <Text style={styles.muted}>No class tasks yet.</Text>
                ) : null}
                {selectedClass.templates.map((template) => (
                  <View key={template.id} style={styles.templateRow}>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{template.name}</Text>
                      <Text style={styles.muted}>
                        Every {template.interval_days} days · due soon {template.due_soon_days} days before · {template.value_type}
                      </Text>
                      {template.species ? <Text style={styles.muted}>Species: {template.species}</Text> : null}
                      {template.instructions ? <Text style={styles.instructions}>{template.instructions}</Text> : null}
                      {template.tags.length > 0 ? (
                        <View style={styles.tagPills}>
                          {template.tags.map((tag) => (
                            <View key={tag.id} style={styles.tagPill}>
                              <View style={StyleSheet.flatten([styles.tagDot, { backgroundColor: tag.color ?? "#64748b" }])} />
                              <Text style={styles.tagPillText}>{tag.name}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </View>
                    {isAdmin ? (
                      <View style={styles.rowActions}>
                        <Pressable onPress={() => startTemplateEditing(template)} style={styles.smallButton}>
                          <Text style={styles.smallButtonText}>Edit</Text>
                        </Pressable>
                        <Pressable onPress={() => deleteTemplate(template.id)} style={styles.dangerButton}>
                          <Text style={styles.dangerButtonText}>Delete</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                ))}
              </Card>

              {isAdmin && showTaskForm ? (
                <Card>
                  <Text style={styles.sectionTitle}>{editingTemplateId ? "Edit task" : `Add task to ${selectedClass.name}`}</Text>
                  <TemplateForm
                    form={templateForm}
                    onChange={setTemplateForm}
                    onToggleTag={toggleTemplateTag}
                    tags={tags}
                  />
                  <ErrorMessage message={error} />
                  <View style={styles.formActions}>
                    <PrimaryButton
                      disabled={!templateForm.name.trim()}
                      loading={saveTemplateMutation.isPending}
                      onPress={saveTemplate}
                    >
                      {editingTemplateId ? "Save task" : "Create task"}
                    </PrimaryButton>
                    <Pressable
                      onPress={() => {
                        clearTemplateEditing();
                        setShowTaskForm(false);
                      }}
                      style={styles.secondaryAction}
                    >
                      <Text style={styles.secondaryActionText}>Cancel</Text>
                    </Pressable>
                  </View>
                </Card>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </AppShell>
  );
}

function TemplateForm({
  form,
  onChange,
  onToggleTag,
  tags
}: {
  form: typeof emptyTemplateForm;
  onChange: (form: typeof emptyTemplateForm) => void;
  onToggleTag: (tagId: string) => void;
  tags: Tag[];
}) {
  return (
    <View style={styles.form}>
      <Field label="Name" onChangeText={(name) => onChange({ ...form, name })} value={form.name} />
      <Field label="Species" onChangeText={(species) => onChange({ ...form, species })} value={form.species} />
      <View style={styles.segment}>
        {VALUE_TYPES.map((valueType) => (
          <Pressable
            key={valueType}
            onPress={() => onChange({ ...form, valueType })}
            style={StyleSheet.flatten([styles.segmentOption, form.valueType === valueType && styles.segmentOptionActive])}
          >
            <Text style={StyleSheet.flatten([styles.segmentText, form.valueType === valueType && styles.segmentTextActive])}>
              {valueType}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.numberGrid}>
        <Field keyboardType="numeric" label="Interval days" onChangeText={(intervalDays) => onChange({ ...form, intervalDays })} value={form.intervalDays} />
        <Field keyboardType="numeric" label="Due-soon days" onChangeText={(dueSoonDays) => onChange({ ...form, dueSoonDays })} value={form.dueSoonDays} />
      </View>
      <Field label="Value unit" onChangeText={(valueUnit) => onChange({ ...form, valueUnit })} value={form.valueUnit} />
      <Field label="Instructions" multiline onChangeText={(instructions) => onChange({ ...form, instructions })} value={form.instructions} />
      {tags.length > 0 ? (
        <View style={styles.tagSelector}>
          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagPills}>
            {tags.map((tag) => {
              const selected = form.tagIds.includes(tag.id);
              return (
                <Pressable
                  key={tag.id}
                  onPress={() => onToggleTag(tag.id)}
                  style={StyleSheet.flatten([styles.tagChoice, selected && styles.tagChoiceSelected])}
                >
                  <View style={StyleSheet.flatten([styles.tagDot, { backgroundColor: tag.color ?? "#64748b" }])} />
                  <Text style={StyleSheet.flatten([styles.tagPillText, selected && styles.tagChoiceTextSelected])}>{tag.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

async function loadTemplateTags(templateIds: string[]) {
  if (!supabase) {
    return [] as (TemplateTag & { tags: Tag })[];
  }
  const { data, error } = await supabase
    .from("task_template_tags")
    .select("task_template_id,tag_id,tags(*)")
    .in("task_template_id", templateIds);
  if (error) {
    throw error;
  }
  return data as unknown as (TemplateTag & { tags: Tag })[];
}

function buildTemplatePayload(classId: string, form: typeof emptyTemplateForm) {
  const intervalDays = Number.parseInt(form.intervalDays, 10);
  const dueSoonDays = Number.parseInt(form.dueSoonDays, 10);
  if (!form.name.trim()) {
    throw new Error("Enter a task name.");
  }
  if (!Number.isFinite(intervalDays) || intervalDays < 1) {
    throw new Error("Interval days must be 1 or greater.");
  }
  if (!Number.isFinite(dueSoonDays) || dueSoonDays < 0) {
    throw new Error("Due-soon days must be 0 or greater.");
  }

  return {
    class_id: classId,
    due_soon_days: dueSoonDays,
    instructions: form.instructions.trim() || null,
    interval_days: intervalDays,
    name: form.name.trim(),
    species: form.species.trim() || null,
    value_type: form.valueType,
    value_unit: form.valueUnit.trim() || null
  };
}

async function replaceTemplateTags(templateId: string, tagIds: string[]) {
  if (!supabase) {
    return;
  }
  const { error: deleteError } = await (supabase as any)
    .from("task_template_tags")
    .delete()
    .eq("task_template_id", templateId);
  if (deleteError) {
    throw deleteError;
  }

  if (tagIds.length === 0) {
    return;
  }

  const { error: insertError } = await (supabase as any)
    .from("task_template_tags")
    .insert(tagIds.map((tagId) => ({ tag_id: tagId, task_template_id: templateId })));
  if (insertError) {
    throw insertError;
  }
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
    maxWidth: 640,
    width: "100%"
  },
  formActions: {
    gap: 10,
    maxWidth: 520
  },
  inlineForm: {
    borderTopColor: "#edf0ea",
    borderTopWidth: 1,
    gap: 12,
    paddingTop: 12
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  classDetailHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  notesBlock: {
    backgroundColor: "#f7f9f4",
    borderColor: "#edf0ea",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    marginTop: 14,
    padding: 12
  },
  notesText: {
    color: "#415466",
    fontSize: 14,
    lineHeight: 20
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
  layout: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18
  },
  detailColumn: {
    flex: 1,
    gap: 18,
    minWidth: 320
  },
  classItem: {
    borderTopColor: "#edf0ea",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minWidth: 300,
    padding: 12
  },
  classItemActive: {
    backgroundColor: "#eef8f0",
    borderRadius: 8
  },
  classItemTitleActive: {
    color: "#095c38"
  },
  inlineInput: {
    backgroundColor: "#ffffff",
    borderColor: "#2f6f4e",
    borderRadius: 8,
    borderWidth: 1,
    color: "#1f2933",
    fontSize: 15,
    fontWeight: "800",
    minHeight: 42,
    paddingHorizontal: 10
  },
  rowText: {
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  rowTitle: {
    color: "#1f2933",
    fontSize: 15,
    fontWeight: "800"
  },
  rowActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  templateRow: {
    borderTopColor: "#edf0ea",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingTop: 12
  },
  instructions: {
    color: "#415466",
    fontSize: 14,
    lineHeight: 20
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
  },
  segment: {
    backgroundColor: "#eef2ea",
    borderRadius: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    padding: 4
  },
  segmentOption: {
    alignItems: "center",
    borderRadius: 6,
    flexGrow: 1,
    minWidth: 108,
    paddingHorizontal: 10,
    paddingVertical: 9
  },
  segmentOptionActive: {
    backgroundColor: "#ffffff"
  },
  segmentText: {
    color: "#526371",
    fontWeight: "800",
    textTransform: "capitalize"
  },
  segmentTextActive: {
    color: "#2f6f4e"
  },
  numberGrid: {
    flexDirection: "row",
    gap: 12
  },
  tagSelector: {
    gap: 8
  },
  label: {
    color: "#415466",
    fontSize: 14,
    fontWeight: "700"
  },
  tagPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  tagPill: {
    alignItems: "center",
    backgroundColor: "#f5f7f2",
    borderColor: "#d8dfd4",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  tagChoice: {
    alignItems: "center",
    borderColor: "#d8dfd4",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 9,
    paddingVertical: 7
  },
  tagChoiceSelected: {
    backgroundColor: "#eef8f0",
    borderColor: "#2f6f4e"
  },
  tagChoiceTextSelected: {
    color: "#095c38"
  },
  tagDot: {
    borderRadius: 5,
    height: 10,
    width: 10
  },
  tagPillText: {
    color: "#415466",
    fontSize: 13,
    fontWeight: "800"
  }
});
