// servicios/UsuarioServicio.ts
import { supabaseAdmin } from "../configuracion/Supabase.js";
import { UsuarioRepositorio } from "../persistencia/UsuarioRepositorio.js";
import { CrearUsuario } from "../modelos/Usuario.js";

const usuarioRepositorio = new UsuarioRepositorio();

export class UsuarioServicio {
    async listar() { return await usuarioRepositorio.listar(); }
    async obtenerPorId(id: string) { return await usuarioRepositorio.obtenerPorId(id); }
    async obtenerPorCedula(cedula: string) { return await usuarioRepositorio.obtenerPorCedula(cedula); }

    private async esDuenoProtegido(usuario: any): Promise<boolean> {
        const esDueno = usuario.rol === "Dueno" || usuario.rol === "Dueño";
        if (!esDueno) return false;

        const todos = await usuarioRepositorio.listar();
        const duenos = todos.filter((u) => u.rol === "Dueno" || (u.rol as any) === "Dueño");
        if (duenos.length === 0) return false;

        const primerDueno = duenos.sort((a, b) => Number(a.idUsuario ?? 999999) - Number(b.idUsuario ?? 999999))[0];
        return primerDueno ? (primerDueno.id === usuario.id || primerDueno.idUsuario === usuario.idUsuario) : false;
    }

    async desactivar(id: string, rolSolicitante?: string) { 
        const usuarioActual = await usuarioRepositorio.obtenerPorId(id);
        if (!usuarioActual) throw new Error("El usuario no existe");

        const esDueno = usuarioActual.rol === "Dueno" || (usuarioActual.rol as any) === "Dueño";
        if (rolSolicitante === "Administrador" && esDueno) {
            throw new Error("Los administradores no tienen permisos para modificar a un Dueño.");
        }

        if (await this.esDuenoProtegido(usuarioActual)) {
            throw new Error("El Dueño protegido no puede ser desactivado, ni siquiera por él mismo.");
        }

        await usuarioRepositorio.actualizarUsuario(id, { activo: false }); 
        return await usuarioRepositorio.obtenerPorId(id);
    }

    async activar(id: string, rolSolicitante?: string) { 
        const usuarioActual = await usuarioRepositorio.obtenerPorId(id);
        if (!usuarioActual) throw new Error("El usuario no existe");

        const esDueno = usuarioActual.rol === "Dueno" || (usuarioActual.rol as any) === "Dueño";
        if (rolSolicitante === "Administrador" && esDueno) {
            throw new Error("Los administradores no tienen permisos para modificar a un Dueño.");
        }

        await usuarioRepositorio.actualizarUsuario(id, { activo: true }); 
        return await usuarioRepositorio.obtenerPorId(id);
    }

    async crear(datos: CrearUsuario) {
        // 1. Crear usuario en Supabase Auth usando el cliente Admin
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: datos.correo,
            password: datos.contrasena,
            email_confirm: true,
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
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw error;
        }
    }

    async actualizar(id: string, datos: any, rolSolicitante?: string) {
        const usuarioActual = await usuarioRepositorio.obtenerPorId(id);
        if (!usuarioActual) {
            throw new Error("El usuario no existe");
        }

        const esDueno = usuarioActual.rol === "Dueno" || (usuarioActual.rol as any) === "Dueño";
        if (rolSolicitante === "Administrador" && esDueno) {
            throw new Error("Los administradores no tienen permisos para modificar a un Dueño.");
        }

        const esProtegido = await this.esDuenoProtegido(usuarioActual);
        if (esProtegido) {
            if (datos.rol !== undefined && datos.rol !== "Dueno" && datos.rol !== "Dueño") {
                throw new Error("El Dueño protegido no puede cambiar de rol, ni siquiera por él mismo.");
            }
            if (datos.activo === false) {
                throw new Error("El Dueño protegido no puede ser desactivado, ni siquiera por él mismo.");
            }
        }

        // Si se envió nueva contraseña, actualizar en Auth
        if (datos.contrasena && datos.contrasena.trim() !== "" && usuarioActual.id) {
            try {
                await supabaseAdmin.auth.admin.updateUserById(usuarioActual.id, {
                    password: datos.contrasena.trim()
                });
            } catch (err: any) {
                console.warn("Aviso al actualizar contraseña en Auth:", err?.message);
            }
        }

        // Si se cambió el correo, actualizar en Auth
        if (datos.correo && usuarioActual.id && datos.correo.trim().toLowerCase() !== usuarioActual.correo.toLowerCase()) {
            try {
                await supabaseAdmin.auth.admin.updateUserById(usuarioActual.id, {
                    email: datos.correo.trim().toLowerCase()
                });
            } catch (err: any) {
                console.warn("Aviso al actualizar correo en Auth:", err?.message);
            }
        }

        await usuarioRepositorio.actualizarUsuario(id, datos);
        return await usuarioRepositorio.obtenerPorId(id);
    }
}
