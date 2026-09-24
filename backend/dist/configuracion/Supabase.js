import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl) {
    throw new Error("SUPABASE_URL no está definido en las variables de entorno");
}
if (!supabaseKey) {
    throw new Error("SUPABASE_KEY no está definido en las variables de entorno");
}
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    }
});
