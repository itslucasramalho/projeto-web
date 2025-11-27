import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase service role key não configurada. Defina SUPABASE_SERVICE_ROLE_KEY no ambiente.",
    );
  }

  return createClient(url, serviceKey);
}

