import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Surfaced at runtime in the browser console if env is missing.
  // eslint-disable-next-line no-console
  console.warn(
    "[web] Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

/**
 * Browser-side Supabase client for customer auth. Persists the session in
 * localStorage so guests stay logged in across reloads. Mirrors
 * apps/captain/lib/supabase.ts — the API's supabase-auth plugin accepts any
 * valid Supabase-issued access token regardless of which app it came from.
 *
 * Falls back to a syntactically-valid placeholder URL when unconfigured —
 * createClient() throws on an empty string, and Nav (which owns the auth
 * state) renders on every page, so a missing env var would otherwise crash
 * prerendering site-wide instead of just disabling login.
 */
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/*
 * Şifre sıfırlama bağlantısıyla gelen kullanıcı (PASSWORD_RECOVERY) için işaret.
 * Dinleyici modül yüklenirken kurulur: Supabase adres çubuğundaki anahtarı
 * işleyip olayı yaydığında sayfa bileşenleri henüz bağlanmamış olabilir.
 * Hesap sayfası bu işareti görünce "yeni şifre" formunu açar.
 */
const RECOVERY_KEY = "ahoy:password-recovery";
export const PASSWORD_RECOVERY_EVENT = "ahoy:password-recovery";

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event !== "PASSWORD_RECOVERY") return;
    try {
      sessionStorage.setItem(RECOVERY_KEY, "1");
    } catch {
      /* gizli sekme */
    }
    window.dispatchEvent(new Event(PASSWORD_RECOVERY_EVENT));
  });
}

export function isPasswordRecovery(): boolean {
  try {
    return sessionStorage.getItem(RECOVERY_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearPasswordRecovery(): void {
  try {
    sessionStorage.removeItem(RECOVERY_KEY);
  } catch {
    /* gizli sekme */
  }
}
