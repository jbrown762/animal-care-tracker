import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/types/database";

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === "web",
        persistSession: true,
        storage: AsyncStorage
      }
    })
  : null;
