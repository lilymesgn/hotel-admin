import { createClient } from "@supabase/supabase-js";

// Grab Admin-Specific Supabase environment variables, falling back to public if not set
const supabaseUrl = 
  (import.meta as any).env?.VITE_ADMIN_SUPABASE_URL || 
  (import.meta as any).env?.VITE_SUPABASE_URL || 
  "";

const supabaseAnonKey = 
  (import.meta as any).env?.VITE_ADMIN_SUPABASE_ANON_KEY || 
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
  "";

// Reactively check configuration
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Extra security configuration placeholders/settings
export const securityConfig = {
  ipWhitelist: (import.meta as any).env?.VITE_ADMIN_IP_WHITELIST || "disabled",
  require2FA: (import.meta as any).env?.VITE_ADMIN_REQUIRE_MFA === "true",
  jwtExpiryShort: true, // short lifetime (e.g. 15m) enforced on server
};

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase credentials are missing for the admin application. Running in sandbox offline demo mode with LocalStorage ledger."
  );
}

// Instantiate security-hardened client with shorter session storage if possible
export const supabase = createClient(
  supabaseUrl || "https://placeholder-project-id.supabase.co",
  supabaseAnonKey || "placeholder-anon-key-abcde12345",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.sessionStorage, // Security: session-only storage prevents long-lived token leakage in localStorage
    }
  }
);
