// servicios/UsuarioServicio.ts
import { supabaseAdmin } from "../configuracion/Supabase.js";
import { UsuarioRepositorio } from "../persistencia/UsuarioRepositorio.js";
import { CrearUsuario } from "../modelos/Usuario.js";

const usuarioRepositorio = new UsuarioRepositorio();

export class UsuarioServicio {
    async listar() { return await usuarioRepositorio.listar(); }
    async obtenerPorId(id: string) { return await usuarioRepositorio.obtenerPorId(id); }
    async obtenerPorCedula(cedula: string) { return await usuarioRepositorio.obtenerPorCedula(cedula); }
    async desactivar(authId: string) { return await usuarioRepositorio.actualizarUsuario(authId, { activo: false }); }
    async activar(authId: string) { return await usuarioRepositorio.actualizarUsuario(authId, { activo: true }); }

    async crear(datos: CrearUsuario) {
        // 1. Crear usuario en Supabase Auth usando el cliente Admin
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: datos.correo,
            password: datos.contrasena,
            email_confirm: true, // 👈 Confirmado automáticamente para que pueda iniciar sesión de inmediato
            user_metadata: { nombre: datos.nombre }
        });

        if (authError) {
            if (authError.message.includes("already registered")) {
                throw new Error("El correo ya está registrado en el sistema");
            }
            throw new Error(`Error en Auth: ${authError.message}`);
        }

        if (!authData.user) throw new Error("No se pudo crear el usuario");

        // 2. Insertar en la tabla pública 'usuario'
        try {
            return await usuarioRepositorio.crearUsuario(datos, authData.user.id);
        } catch (error) {
            // Si falla el perfil, borramos el usuario de Auth para no dejar datos huérfanos
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw error;
        }
    }

    async actualizar(authId: string, datos: any) {
        await usuarioRepositorio.actualizarUsuario(authId, datos);
        return await usuarioRepositorio.obtenerPorId(authId);
    }
}