import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { PropsWithChildren, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
  useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";

const desktopNavItems = [
  { href: "/dashboard", icon: "home-outline", label: "Dashboard" },
  { href: "/animals", icon: "paw-outline", label: "Animals" },
  { href: "/dashboard", icon: "receipt-outline", label: "Logs" },
  { href: "/classes", icon: "clipboard-outline", label: "Classes & Templates" },
  { href: "/settings", icon: "pricetag-outline", label: "Food Items" },
  { href: "/settings", icon: "ticket-outline", label: "Tags" },
  { href: "/people", icon: "people-outline", label: "People & Roles" },
  { href: "/settings", icon: "settings-outline", label: "Org Settings" }
] as const;

const mobileNavItems = [
  { href: "/dashboard", icon: "home", label: "Dashboard" },
  { href: "/animals", icon: "paw-outline", label: "Animals" },
  { href: "/dashboard", icon: "receipt-outline", label: "Logs" },
  { href: "/settings", icon: "ellipsis-horizontal", label: "More" }
] as const;

function mergedViewStyle(...values: StyleProp<ViewStyle>[]) {
  return StyleSheet.flatten(values);
}

function mergedTextStyle(...values: StyleProp<TextStyle>[]) {
  return StyleSheet.flatten(values);
}

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { signOut, user } = useAuth();
  const { activeOrgId, memberships, setActiveOrgId, activeRole } = useOrg();
  const wide = width >= 900;
  const activeOrgName = memberships.find((membership) => membership.org_id === activeOrgId)?.organizations?.name ?? "Organization";
  const displayName = user?.user_metadata.display_name ?? user?.email?.split("@")[0] ?? "Team member";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={mergedViewStyle(styles.root, wide && styles.rootWide)}>
        {wide ? (
          <View style={styles.sidebar}>
            <BrandBlock />
            <OrgSwitcher activeOrgId={activeOrgId} memberships={memberships} onChange={setActiveOrgId} variant="dark" />
            <View style={styles.navList}>
              {desktopNavItems.map((item) => {
                const active = pathname.startsWith(item.href) && item.label === activeDesktopLabel(pathname);
                return (
                  <Pressable
                    key={item.label}
                    accessibilityRole="link"
                    onPress={() => router.push(item.href)}
                    style={mergedViewStyle(styles.navItem, active && styles.navItemActive)}
                  >
                    <Ionicons name={item.icon} size={21} color="#ffffff" />
                    <Text style={styles.navText}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.userPanel}>
              <Image source={{ uri: avatarUrl(displayName) }} style={styles.avatar} />
              <View style={styles.userText}>
                <Text style={styles.userName}>{displayName}</Text>
                <Text style={styles.userRole}>{activeRole ?? "member"}</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={signOut} style={styles.signOutIcon}>
                <Ionicons name="chevron-up" size={18} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.mobileTop}>
            <View style={styles.mobileChrome}>
              <Pressable accessibilityRole="button" style={styles.iconButton}>
                <Ionicons name="menu" size={27} color="#ffffff" />
              </Pressable>
              <BrandBlock compact />
              <Pressable accessibilityRole="button" style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={23} color="#ffffff" />
              </Pressable>
            </View>
            <OrgSwitcher activeOrgId={activeOrgId} memberships={memberships} onChange={setActiveOrgId} variant="light" />
          </View>
        )}

        <View style={styles.contentArea}>
          {wide ? (
            <View style={styles.topBar}>
              <Text style={styles.screenTitle}>{routeTitle(pathname)}</Text>
              <View style={styles.topActions}>
                <Ionicons name="notifications-outline" size={24} color="#111827" />
                <View style={styles.topOrg}>
                  <Ionicons name="business-outline" size={23} color="#111827" />
                  <Text style={styles.topOrgText}>{activeOrgName}</Text>
                  <Ionicons name="chevron-down" size={18} color="#111827" />
                </View>
              </View>
            </View>
          ) : null}
          <ScrollView
            contentContainerStyle={mergedViewStyle(styles.content, !wide && styles.mobileContent)}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {!wide ? (
            <View style={styles.bottomTabs}>
              {mobileNavItems.map((item) => {
                const active = pathname.startsWith(item.href) && item.label === activeMobileLabel(pathname);
                return (
                  <Pressable
                    key={item.label}
                    accessibilityRole="link"
                    onPress={() => router.push(item.href)}
                    style={styles.tabItem}
                  >
                    <Ionicons name={item.icon} size={23} color={active ? "#095c38" : "#475569"} />
                    <Text style={mergedTextStyle(styles.tabText, active && styles.tabTextActive)}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

function activeDesktopLabel(pathname: string) {
  if (pathname.startsWith("/animals")) return "Animals";
  if (pathname.startsWith("/classes")) return "Classes & Templates";
  if (pathname.startsWith("/people")) return "People & Roles";
  if (pathname.startsWith("/settings")) return "Org Settings";
  return "Dashboard";
}

function activeMobileLabel(pathname: string) {
  if (pathname.startsWith("/animals")) return "Animals";
  if (pathname.startsWith("/people")) return "More";
  if (pathname.startsWith("/settings")) return "More";
  return "Dashboard";
}

function routeTitle(pathname: string) {
  if (pathname.startsWith("/animals")) return "Animals";
  if (pathname.startsWith("/classes")) return "Classes & Templates";
  if (pathname.startsWith("/people")) return "People & Roles";
  if (pathname.startsWith("/settings")) return "Settings";
  return "Dashboard";
}

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(seed)}&backgroundColor=f8fafc&fontWeight=700`;
}

function BrandBlock({ compact = false }: { compact?: boolean }) {
  return (
    <View style={mergedViewStyle(styles.brandBlock, compact && styles.brandBlockCompact)}>
      <View style={mergedViewStyle(styles.pawMark, compact && styles.pawMarkCompact)}>
        <Ionicons name="paw" size={compact ? 25 : 31} color="#ffffff" />
      </View>
      <View>
        <Text style={mergedTextStyle(styles.brandTitle, compact && styles.brandTitleCompact)}>Animal Care</Text>
        <Text style={mergedTextStyle(styles.brandTitle, compact && styles.brandTitleCompact)}>Task Tracker</Text>
      </View>
    </View>
  );
}

type OrgSwitcherProps = {
  activeOrgId: string | null;
  memberships: ReturnType<typeof useOrg>["memberships"];
  onChange: (orgId: string) => void;
  variant: "dark" | "light";
};

function OrgSwitcher({ activeOrgId, memberships, onChange, variant }: OrgSwitcherProps) {
  const [open, setOpen] = useState(false);
  const active = memberships.find((membership) => membership.org_id === activeOrgId) ?? memberships[0];
  const dark = variant === "dark";

  return (
    <View style={styles.orgSwitcherWrap}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((current) => !current)}
        style={mergedViewStyle(styles.orgPill, variant === "light" && styles.orgPillMobile)}
      >
        <Ionicons name="business-outline" size={21} color="#ffffff" />
        <Text style={styles.orgPillText}>{active?.organizations?.name ?? "Select organization"}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={17} color="#ffffff" />
      </Pressable>

      {open ? (
        <View style={mergedViewStyle(styles.orgMenu, dark && styles.orgMenuDark)}>
          {memberships.length <= 1 ? (
            <Text style={mergedTextStyle(styles.orgMenuNote, dark && styles.orgMenuNoteDark)}>Only one organization</Text>
          ) : (
            memberships.map((membership) => {
              const selected = membership.org_id === activeOrgId;
              return (
                <Pressable
                  key={membership.id}
                  accessibilityRole="button"
                  onPress={() => {
                    onChange(membership.org_id);
                    setOpen(false);
                  }}
                  style={mergedViewStyle(styles.orgMenuItem, selected && styles.orgMenuItemActive)}
                >
                  <Text style={mergedTextStyle(styles.orgMenuItemText, selected && styles.orgMenuItemTextActive)}>
                    {membership.organizations?.name ?? "Organization"}
                  </Text>
                  {selected ? <Ionicons name="checkmark" size={18} color="#095c38" /> : null}
                </Pressable>
              );
            })
          )}
        </View>
      ) : null}
    </View>
  );
}

export function PageHeader({ eyebrow, title, description }: { description?: string; eyebrow?: string; title: string }) {
  return (
    <View style={styles.pageHeader}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.pageTitle}>{title}</Text>
      {description ? <Text style={styles.pageDescription}>{description}</Text> : null}
    </View>
  );
}

export function EmptyState({ icon, title, body }: { body: string; icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={32} color="#095c38" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f8fb"
  },
  root: {
    flex: 1
  },
  rootWide: {
    flexDirection: "row"
  },
  sidebar: {
    backgroundColor: "#003d27",
    borderRightColor: "rgba(255,255,255,0.12)",
    borderRightWidth: 1,
    padding: 24,
    width: 292
  },
  brandBlock: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginBottom: 34
  },
  brandBlockCompact: {
    marginBottom: 0
  },
  pawMark: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    width: 48
  },
  pawMarkCompact: {
    height: 34,
    width: 34
  },
  brandTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22
  },
  brandTitleCompact: {
    fontSize: 16,
    lineHeight: 19
  },
  orgPill: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.32)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 15
  },
  orgPillMobile: {
    backgroundColor: "rgba(255,255,255,0.08)"
  },
  orgPillText: {
    color: "#ffffff",
    flex: 1,
    fontSize: 15,
    fontWeight: "800"
  },
  orgSwitcherWrap: {
    position: "relative",
    zIndex: 5
  },
  orgMenu: {
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 8,
    borderWidth: 1,
    left: 0,
    marginTop: 8,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 52
  },
  orgMenuDark: {
    borderColor: "rgba(255,255,255,0.22)"
  },
  orgMenuNote: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  orgMenuNoteDark: {
    color: "#334155"
  },
  orgMenuItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  orgMenuItemActive: {
    backgroundColor: "#eef8f0"
  },
  orgMenuItemText: {
    color: "#0f172a",
    flex: 1,
    fontSize: 14,
    fontWeight: "800"
  },
  orgMenuItemTextActive: {
    color: "#095c38"
  },
  navList: {
    gap: 11,
    marginTop: 30
  },
  navItem: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    gap: 14,
    minHeight: 50,
    paddingHorizontal: 14
  },
  navItemActive: {
    backgroundColor: "rgba(79, 188, 124, 0.34)"
  },
  navText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700"
  },
  userPanel: {
    alignItems: "center",
    borderTopColor: "rgba(255,255,255,0.18)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: "auto",
    paddingTop: 22
  },
  avatar: {
    borderRadius: 24,
    height: 48,
    width: 48
  },
  userText: {
    flex: 1
  },
  userName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800"
  },
  userRole: {
    color: "#73d391",
    fontSize: 14,
    textTransform: "capitalize"
  },
  signOutIcon: {
    padding: 6
  },
  mobileTop: {
    backgroundColor: "#003d27",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 18,
    paddingBottom: 18,
    paddingHorizontal: 17,
    paddingTop: 12
  },
  mobileChrome: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  iconButton: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: 42
  },
  contentArea: {
    flex: 1
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 20,
    paddingHorizontal: 32,
    paddingTop: 34
  },
  screenTitle: {
    color: "#0f172a",
    fontSize: 26,
    fontWeight: "900"
  },
  topActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 28
  },
  topOrg: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  topOrgText: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800"
  },
  content: {
    gap: 18,
    paddingBottom: 48,
    paddingHorizontal: 32
  },
  mobileContent: {
    marginTop: -4,
    paddingBottom: 110,
    paddingHorizontal: 14
  },
  bottomTabs: {
    backgroundColor: "#ffffff",
    borderTopColor: "#e5e7eb",
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    left: 0,
    paddingBottom: 18,
    paddingTop: 9,
    position: "absolute",
    right: 0
  },
  tabItem: {
    alignItems: "center",
    flex: 1,
    gap: 3
  },
  tabText: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "800"
  },
  tabTextActive: {
    color: "#095c38"
  },
  pageHeader: {
    gap: 6,
    maxWidth: 820
  },
  eyebrow: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  pageTitle: {
    color: "#0f172a",
    fontSize: 26,
    fontWeight: "900"
  },
  pageDescription: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 28
  },
  emptyTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center"
  },
  emptyBody: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 520,
    textAlign: "center"
  }
});
