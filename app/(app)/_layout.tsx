import { Stack } from "expo-router";

import { RequireAuth } from "@/components/RequireAuth";

export default function AppLayout() {
  return (
    <RequireAuth>
      <Stack screenOptions={{ headerShown: false }} />
    </RequireAuth>
  );
}
