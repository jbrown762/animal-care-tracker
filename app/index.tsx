import { Redirect } from "expo-router";

import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { isSupabaseConfigured } from "@/lib/env";

export default function Index() {
  const { initialized, session } = useAuth();
  const { memberships, loading } = useOrg();

  if (!isSupabaseConfigured) {
    return <Redirect href="/setup" />;
  }

  if (!initialized) {
    return null;
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  if (!loading && memberships.length === 0) {
    return <Redirect href="/create-org" />;
  }

  return <Redirect href="/dashboard" />;
}
