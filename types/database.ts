export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OrgRole = "admin" | "caretaker";
export type AnimalStatus = "active" | "inactive" | "deceased" | "transferred";
export type ValueType = "completion" | "numeric" | "text" | "food";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string;
          email: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name: string;
          email: string;
          id: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      organizations: {
        Row: {
          created_at: string;
          default_due_soon_days: number;
          id: string;
          name: string;
          plan: "free" | "pro";
          plan_animal_limit: number | null;
          plan_expires_at: string | null;
          plan_user_limit: number | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          updated_at: string;
        };
        Insert: {
          default_due_soon_days?: number;
          id?: string;
          name: string;
          plan?: "free" | "pro";
          plan_animal_limit?: number | null;
          plan_expires_at?: string | null;
          plan_user_limit?: number | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };
      org_memberships: {
        Row: {
          created_at: string;
          display_name_override: string | null;
          id: string;
          invited_by: string | null;
          joined_at: string | null;
          org_id: string;
          role: OrgRole;
          user_id: string;
        };
        Insert: {
          display_name_override?: string | null;
          id?: string;
          invited_by?: string | null;
          joined_at?: string | null;
          org_id: string;
          role: OrgRole;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["org_memberships"]["Insert"]>;
      };
      org_invitations: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
          org_id: string;
          revoked_at: string | null;
          role: OrgRole;
          token: string;
        };
        Insert: {
          email: string;
          expires_at?: string;
          id?: string;
          invited_by: string;
          org_id: string;
          role: OrgRole;
          token?: string;
        };
        Update: Partial<Database["public"]["Tables"]["org_invitations"]["Insert"]> & {
          accepted_at?: string | null;
          revoked_at?: string | null;
        };
      };
      animal_classes: {
        Row: { created_at: string; id: string; name: string; notes: string | null; org_id: string; updated_at: string };
        Insert: { id?: string; name: string; notes?: string | null; org_id: string };
        Update: Partial<Database["public"]["Tables"]["animal_classes"]["Insert"]>;
      };
      tags: {
        Row: { color: string | null; created_at: string; id: string; name: string; org_id: string };
        Insert: { color?: string | null; id?: string; name: string; org_id: string };
        Update: Partial<Database["public"]["Tables"]["tags"]["Insert"]>;
      };
      task_category_templates: {
        Row: {
          class_id: string;
          created_at: string;
          due_soon_days: number;
          id: string;
          instructions: string | null;
          interval_days: number;
          name: string;
          species: string | null;
          updated_at: string;
          value_type: ValueType;
          value_unit: string | null;
        };
        Insert: {
          class_id: string;
          due_soon_days: number;
          id?: string;
          instructions?: string | null;
          interval_days: number;
          name: string;
          species?: string | null;
          value_type: ValueType;
          value_unit?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["task_category_templates"]["Insert"]>;
      };
      animals: {
        Row: {
          acquisition_date: string | null;
          birth_date: string | null;
          class_id: string;
          created_at: string;
          id: string;
          name: string;
          notes: string | null;
          org_id: string;
          photo_url: string | null;
          sex: "male" | "female" | "unknown" | null;
          species: string | null;
          source: string | null;
          status: AnimalStatus;
          updated_at: string;
        };
        Insert: {
          acquisition_date?: string | null;
          birth_date?: string | null;
          class_id: string;
          id?: string;
          name: string;
          notes?: string | null;
          org_id: string;
          photo_url?: string | null;
          sex?: "male" | "female" | "unknown" | null;
          species?: string | null;
          source?: string | null;
          status?: AnimalStatus;
        };
        Update: Partial<Database["public"]["Tables"]["animals"]["Insert"]>;
      };
      animal_tasks: {
        Row: {
          animal_id: string;
          created_at: string;
          due_soon_days: number;
          id: string;
          instructions: string | null;
          interval_days: number;
          is_active: boolean;
          is_hidden: boolean;
          name: string;
          template_id: string | null;
          updated_at: string;
          value_type: ValueType;
          value_unit: string | null;
        };
        Insert: {
          animal_id: string;
          due_soon_days: number;
          id?: string;
          instructions?: string | null;
          interval_days: number;
          is_active?: boolean;
          is_hidden?: boolean;
          name: string;
          template_id?: string | null;
          value_type: ValueType;
          value_unit?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["animal_tasks"]["Insert"]>;
      };
      food_items: {
        Row: { archived_at: string | null; created_at: string; id: string; name: string; org_id: string };
        Insert: { archived_at?: string | null; id?: string; name: string; org_id: string };
        Update: Partial<Database["public"]["Tables"]["food_items"]["Insert"]>;
      };
      task_log_entries: {
        Row: {
          animal_id: string;
          animal_task_id: string;
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          logged_at: string;
          notes: string | null;
          updated_at: string | null;
          updated_by: string | null;
          value_numeric: number | null;
          value_text: string | null;
        };
        Insert: {
          animal_id: string;
          animal_task_id: string;
          created_by: string;
          id?: string;
          logged_at: string;
          notes?: string | null;
          value_numeric?: number | null;
          value_text?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["task_log_entries"]["Insert"]> & {
          deleted_at?: string | null;
          deleted_by?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
      };
      food_log_items: {
        Row: { food_item_id: string; id: string; log_entry_id: string; quantity: number; quantity_unit: string | null };
        Insert: { food_item_id: string; id?: string; log_entry_id: string; quantity: number; quantity_unit?: string | null };
        Update: Partial<Database["public"]["Tables"]["food_log_items"]["Insert"]>;
      };
      animal_task_tags: {
        Row: { animal_task_id: string; tag_id: string };
        Insert: { animal_task_id: string; tag_id: string };
        Update: Partial<Database["public"]["Tables"]["animal_task_tags"]["Insert"]>;
      };
      task_template_tags: {
        Row: { tag_id: string; task_template_id: string };
        Insert: { tag_id: string; task_template_id: string };
        Update: Partial<Database["public"]["Tables"]["task_template_tags"]["Insert"]>;
      };
    };
    Views: Record<never, never>;
    Functions: {
      accept_org_invitation: { Args: { invite_token: string }; Returns: string };
      change_member_role: { Args: { target_membership_id: string; next_role: OrgRole }; Returns: void };
      create_initial_org: { Args: { org_name: string; member_display_name?: string }; Returns: string };
      invite_org_member: { Args: { target_email: string; target_org_id: string; target_role: OrgRole }; Returns: string };
      remove_org_member: { Args: { target_membership_id: string }; Returns: void };
      revoke_org_invitation: { Args: { target_invitation_id: string }; Returns: void };
    };
    Enums: {
      animal_status: AnimalStatus;
      org_role: OrgRole;
      sex_value: "male" | "female" | "unknown";
      value_type: ValueType;
    };
    CompositeTypes: Record<never, never>;
  };
};
