import { supabase } from "../configuracion/Supabase.js";
export class AuthServicio {
    async login(correo, contrasena) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: correo,
            password: contrasena,
        });
        if (error || !data.session || !data.user) {
            throw new Error("Correo o contraseña incorrectos");
        }
        return {
            usuario: {
                id: data.user.id,
                correo: data.user.email,
                rol: data.user.app_metadata?.rol,
            },
            token: data.session.access_token,
        };
    }
}
