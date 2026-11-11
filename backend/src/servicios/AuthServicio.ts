import { supabase } from "../configuracion/Supabase.js";
import { UsuarioRepositorio } from "../persistencia/UsuarioRepositorio.js";

const usuarioRepositorio = new UsuarioRepositorio();

export class AuthServicio {
    
    async login(correo: string, contrasena: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: correo,
            password: contrasena,
        });

        if (error || !data.session || !data.user) {
            throw new Error("Correo o contraseña incorrectos");
        }

        // La fila completa de la tabla "usuario" (trae nombre, cédula, teléfono...)
        const usuario = await usuarioRepositorio.obtenerPorId(data.user.id);

        if (!usuario) {
            throw new Error("Tu cuenta no tiene un perfil registrado");
        }
        if (!usuario.activo) {
            throw new Error("Tu usuario está inactivo. Contacta al administrador");
        }

        return {
            usuario,
            token: data.session.access_token,
        };
    }
}