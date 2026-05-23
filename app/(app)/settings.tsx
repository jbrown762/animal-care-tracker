import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, ErrorMessage, Field, PrimaryButton } from "@/components/Form";
import { useOrg } from "@/contexts/OrgContext";
import { buildInviteUrl, copyText } from "@/lib/inviteLinks";
import type { OrgRole } from "@/types/database";

export default function SettingsScreen() {
  const {
    activeRole,
    invitations,
    inviteMember,
    isAdmin,
    memberships,
    removeMember,
    revokeInvitation,
    updateRole
  } = useOrg();
  const [email, setEmail] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteLinkStatus, setInviteLinkStatus] = useState<string | null>(null);
  const [role, setRole] = useState<OrgRole>("caretaker");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitInvite() {
    setError(null);
    setInviteLink(null);
    setInviteLinkStatus(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter an email address.");
      return;
    }

    setLoading(true);
    try {
      const token = await inviteMember(trimmedEmail, role);
      setInviteLink(buildInviteUrl(token));
      setEmail("");
      setRole("caretaker");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to invite member.");
    } finally {
      setLoading(false);
    }
  }

  async function copyInviteLink(link: string) {
    setInviteLinkStatus(null);
    try {
      await copyText(link);
      setInviteLinkStatus("Invite link copied.");
    } catch (caught) {
      setInviteLinkStatus(caught instanceof Error ? caught.message : "Unable to copy invite link.");
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Organization"
        title="Settings"
        description="Org settings, member management, tags, and food items live here. Admin-only controls are hidden from Caretakers."
      />
      <Card>
        <Text style={styles.sectionTitle}>Your access</Text>
        <Text style={styles.muted}>Current role: {activeRole ?? "member"}</Text>
      </Card>

      {isAdmin ? (
        <>
          <Card>
            <Text style={styles.sectionTitle}>Invite member</Text>
            <View style={styles.inviteForm}>
              <Field autoCapitalize="none" keyboardType="email-address" label="Email" onChangeText={setEmail} value={email} />
              <View style={styles.segment}>
                {(["caretaker", "admin"] as OrgRole[]).map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setRole(option)}
                    style={StyleSheet.flatten([styles.segmentOption, role === option && styles.segmentOptionActive])}
                  >
                    <Text style={StyleSheet.flatten([styles.segmentText, role === option && styles.segmentTextActive])}>
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <ErrorMessage message={error} />
              {inviteLink ? (
                <View style={styles.inviteLinkBox}>
                  <Text style={styles.muted}>Invite link</Text>
                  <Text selectable style={styles.inviteLinkText}>{inviteLink}</Text>
                  <Pressable onPress={() => copyInviteLink(inviteLink)} style={styles.smallButton}>
                    <Text style={styles.smallButtonText}>Copy link</Text>
                  </Pressable>
                </View>
              ) : null}
              {inviteLinkStatus ? <Text style={styles.success}>{inviteLinkStatus}</Text> : null}
              <PrimaryButton disabled={!email.trim()} loading={loading} onPress={submitInvite}>Send invite</PrimaryButton>
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Members</Text>
            {memberships.map((membership) => (
              <View key={membership.id} style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{membership.display_name_override ?? membership.user_id}</Text>
                  <Text style={styles.muted}>{membership.role}</Text>
                </View>
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => updateRole(membership.id, membership.role === "admin" ? "caretaker" : "admin")}
                    style={styles.smallButton}
                  >
                    <Text style={styles.smallButtonText}>{membership.role === "admin" ? "Demote" : "Promote"}</Text>
                  </Pressable>
                  <Pressable onPress={() => removeMember(membership.id)} style={styles.dangerButton}>
                    <Text style={styles.dangerButtonText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Pending invitations</Text>
            {invitations.length === 0 ? <Text style={styles.muted}>No pending invitations.</Text> : null}
            {invitations.map((invitation) => (
              <View key={invitation.id} style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{invitation.email}</Text>
                  <Text style={styles.muted}>{invitation.role}</Text>
                  <Text selectable style={styles.pendingInviteLink}>{buildInviteUrl(invitation.token)}</Text>
                </View>
                <View style={styles.rowActions}>
                  <Pressable onPress={() => copyInviteLink(buildInviteUrl(invitation.token))} style={styles.smallButton}>
                    <Text style={styles.smallButtonText}>Copy</Text>
                  </Pressable>
                  <Pressable onPress={() => revokeInvitation(invitation.id)} style={styles.smallButton}>
                    <Text style={styles.smallButtonText}>Revoke</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : (
        <Card>
          <Text style={styles.sectionTitle}>Admin tools</Text>
          <Text style={styles.muted}>User management, tags, food items, and org settings are available to Admins.</Text>
        </Card>
      )}
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
  success: {
    color: "#2f6f4e",
    fontSize: 14,
    fontWeight: "800"
  },
  inviteForm: {
    gap: 14,
    maxWidth: 520,
    width: "100%"
  },
  inviteLinkBox: {
    backgroundColor: "#f5f7f2",
    borderColor: "#d8dfd4",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 12
  },
  inviteLinkText: {
    color: "#1f2933",
    fontSize: 13,
    lineHeight: 18
  },
  pendingInviteLink: {
    color: "#2f6f4e",
    fontSize: 12,
    lineHeight: 17
  },
  segment: {
    backgroundColor: "#eef2ea",
    borderRadius: 8,
    flexDirection: "row",
    padding: 4
  },
  segmentOption: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
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
