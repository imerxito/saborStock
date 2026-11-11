import { supabase } from "../configuracion/Supabase.js";
import { UsuarioRepositorio } from "../persistencia/UsuarioRepositorio.js";

const usuarioRepositorio = new UsuarioRepositorio();

export class AuthServicio {
    async crear(datos: CrearUsuario): Promise<Usuario> {
        // 1) Crear usuario en auth.users con el admin (sin confirmación de email)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: datos.correo,
            password: datos.contrasena,
            email_confirm: true, // 👈 lo dejamos confirmado para que pueda loguear ya
            user_metadata: { nombre: datos.nombre },
        });

        if (authError) {
            if (authError.message.includes("already")) {
                throw new Error("Ya existe un usuario con ese correo");
            }
            throw new Error(`Error al crear credenciales: ${authError.message}`);
        }

        if (!authData.user) throw new Error("No se pudo crear el usuario de autenticación");

        // 2) Insertar el registro en public.usuario con el admin (omite RLS)
        try {
            return await repo.crearUsuario(datos, authData.user.id);
        } catch (err) {
            // Si falla el insert del perfil, limpia el auth.users para no dejar huérfanos
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id).catch(() => {});
            throw err;
        }
    }
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