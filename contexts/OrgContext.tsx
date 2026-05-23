import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Database, OrgRole } from "@/types/database";

type Membership = Database["public"]["Tables"]["org_memberships"]["Row"] & {
  organizations: Database["public"]["Tables"]["organizations"]["Row"] | null;
};

type Invitation = Database["public"]["Tables"]["org_invitations"]["Row"];

type OrgContextValue = {
  activeOrgId: string | null;
  activeRole: OrgRole | null;
  createInitialOrg: (name: string, displayName: string) => Promise<void>;
  invitations: Invitation[];
  inviteMember: (email: string, role: OrgRole) => Promise<string>;
  isAdmin: boolean;
  loading: boolean;
  memberships: Membership[];
  removeMember: (membershipId: string) => Promise<void>;
  revokeInvitation: (invitationId: string) => Promise<void>;
  setActiveOrgId: (orgId: string) => void;
  updateRole: (membershipId: string, role: OrgRole) => Promise<void>;
};

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  const membershipsQuery = useQuery({
    enabled: Boolean(user && supabase),
    queryKey: ["memberships", user?.id],
    queryFn: async () => {
      if (!supabase || !user) {
        return [];
      }
      const { data, error } = await supabase
        .from("org_memberships")
        .select("*, organizations(*)")
        .eq("user_id", user.id)
        .not("joined_at", "is", null)
        .order("created_at", { ascending: true });
      if (error) {
        throw error;
      }
      return data as Membership[];
    }
  });

  const memberships = membershipsQuery.data ?? [];

  useEffect(() => {
    if (!activeOrgId && memberships.length > 0) {
      setActiveOrgId(memberships[0].org_id);
    }
    if (activeOrgId && memberships.length > 0 && !memberships.some((membership) => membership.org_id === activeOrgId)) {
      setActiveOrgId(memberships[0].org_id);
    }
  }, [activeOrgId, memberships]);

  const activeMembership = memberships.find((membership) => membership.org_id === activeOrgId) ?? null;
  const isAdmin = activeMembership?.role === "admin";

  const invitationsQuery = useQuery({
    enabled: Boolean(activeOrgId && isAdmin && supabase),
    queryKey: ["invitations", activeOrgId],
    queryFn: async () => {
      if (!supabase || !activeOrgId) {
        return [];
      }
      const { data, error } = await supabase
        .from("org_invitations")
        .select("*")
        .eq("org_id", activeOrgId)
        .is("accepted_at", null)
        .is("revoked_at", null)
        .order("created_at", { ascending: false });
      if (error) {
        throw error;
      }
      return data;
    }
  });

  const invalidateOrgData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["memberships"] }),
      queryClient.invalidateQueries({ queryKey: ["invitations", activeOrgId] })
    ]);
  };

  const createOrgMutation = useMutation({
    mutationFn: async ({ name, displayName }: { name: string; displayName: string }) => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }
      const { data, error } = await (supabase as any).rpc("create_initial_org", {
        member_display_name: displayName,
        org_name: name
      });
      if (error) {
        throw error;
      }
      setActiveOrgId(data);
    },
    onSuccess: invalidateOrgData
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: OrgRole }) => {
      if (!supabase || !activeOrgId) {
        throw new Error("No active organization.");
      }
      const { data, error } = await (supabase as any).rpc("invite_org_member", {
        target_email: email,
        target_org_id: activeOrgId,
        target_role: role
      });
      if (error) {
        throw error;
      }
      return data as string;
    },
    onSuccess: invalidateOrgData
  });

  const roleMutation = useMutation({
    mutationFn: async ({ membershipId, role }: { membershipId: string; role: OrgRole }) => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }
      const { error } = await (supabase as any).rpc("change_member_role", {
        next_role: role,
        target_membership_id: membershipId
      });
      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateOrgData
  });

  const removeMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }
      const { error } = await (supabase as any).rpc("remove_org_member", {
        target_membership_id: membershipId
      });
      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateOrgData
  });

  const revokeMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }
      const { error } = await (supabase as any).rpc("revoke_org_invitation", {
        target_invitation_id: invitationId
      });
      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateOrgData
  });

  const value = useMemo<OrgContextValue>(
    () => ({
      activeOrgId,
      activeRole: activeMembership?.role ?? null,
      createInitialOrg: async (name, displayName) => {
        await createOrgMutation.mutateAsync({ displayName, name });
      },
      invitations: invitationsQuery.data ?? [],
      inviteMember: async (email, role) => {
        return inviteMutation.mutateAsync({ email, role });
      },
      isAdmin,
      loading: membershipsQuery.isLoading,
      memberships,
      removeMember: removeMutation.mutateAsync,
      revokeInvitation: revokeMutation.mutateAsync,
      setActiveOrgId,
      updateRole: async (membershipId, role) => {
        await roleMutation.mutateAsync({ membershipId, role });
      }
    }),
    [
      activeMembership?.role,
      activeOrgId,
      createOrgMutation,
      invitationsQuery.data,
      inviteMutation,
      isAdmin,
      memberships,
      membershipsQuery.isLoading,
      removeMutation.mutateAsync,
      revokeMutation.mutateAsync,
      roleMutation,
      setActiveOrgId
    ]
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const value = useContext(OrgContext);
  if (!value) {
    throw new Error("useOrg must be used within OrgProvider.");
  }
  return value;
}
