import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// A Supabase client with NO signed-in user and no cookies: it sees exactly what a
// visitor sees (row-level security applies as "anon"). Used for public pages
// whose data is cached and shared between visitors, where reading anyone's
// session would be wrong. Never use it for anything personal.
export function createAnonClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
