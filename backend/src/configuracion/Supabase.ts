// configuracion/Supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente normal (respeta RLS) – para login, consultas, etc.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente admin (OMITE RLS) – SOLO para operaciones de servidor
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});