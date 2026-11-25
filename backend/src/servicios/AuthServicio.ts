import { supabase } from "../configuracion/Supabase.js";
import { UsuarioRepositorio } from "../persistencia/UsuarioRepositorio.js";

const usuarioRepositorio = new UsuarioRepositorio();

export class AuthServicio {
    
    async login(correo: string, contrasena: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: correo,
            password: contrasena,
        });

        if (error) {
            console.error("ERROR SUPABASE LOGIN:", error.message);
            throw new Error("Correo o contraseña incorrectos");
        }

        if (!data.session || !data.user) {
            console.error("Supabase no devolvió una sesión válida");
            throw new Error("No se pudo iniciar sesión");
        }

        // La fila completa de la tabla "usuario" (trae nombre, cédula, teléfono...)
        const usuario = await usuarioRepositorio.obtenerPorId(data.user.id);

        if (!usuario) {
            console.error("El usuario no tiene un perfil registrado");
            throw new Error("Tu cuenta no tiene un perfil registrado");
        }
        if (!usuario.activo) {
            console.error("El usuario está inactivo");
            throw new Error("Tu usuario está inactivo. Contacta al administrador");
        }

        return {
            usuario,
            token: data.session.access_token,
        };
    }
}