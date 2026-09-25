// servicios/UsuarioServicio.ts
import { supabase } from "../configuracion/Supabase.js";
import { RolUsuario } from "../modelos/RolUsuario.js";
import { CrearUsuario, ActualizarUsuario, Usuario } from "../modelos/Usuario.js";
import { UsuarioRepositorio } from "../persistencia/UsuarioRepositorio.js";

export class UsuarioServicio {
    constructor(private UsuarioRepo = new UsuarioRepositorio()) {}

    async listar(): Promise<Usuario[]> {
        return this.UsuarioRepo.listar();
    }

    async obtenerPorId(authId: string): Promise<Usuario> {
        const usuario = await this.UsuarioRepo.obtenerPorId(authId);
        if (!usuario) throw new Error("Usuario no encontrado");
        return usuario;
    }

    async obtenerPorCedula(cedula: string): Promise<Usuario> {
        const usuario = await this.UsuarioRepo.obtenerPorCedula(cedula);
        if (!usuario) throw new Error("Cedula no encontrada");
        return usuario;
    }

    async crear(datos: CrearUsuario): Promise<Usuario> {
        if (datos.nombre.trim() === "") throw new Error("El nombre no puede estar vacio");

        const cedulaExiste = await this.UsuarioRepo.obtenerPorCedula(datos.cedula);
        if (cedulaExiste) throw new Error("Ya existe esa cedula");

        const correoExiste = await this.UsuarioRepo.obtenerPorCorreo(datos.correo);
        if (correoExiste) throw new Error("Ya este correo esta registrado");

        const hayDueno = (await this.UsuarioRepo.contarDuenos()) > 0;
        const rol = hayDueno ? (datos.rol ?? RolUsuario.MESERO) : RolUsuario.Dueno;

        // 1. usuario en Auth
        const { data: auth, error: errAuth } = await supabase.auth.admin.createUser({
            email: datos.correo,
            password: datos.contrasena,
            email_confirm: true,
            app_metadata: { rol },
        });
        if (errAuth || !auth.user) {
            throw new Error(errAuth?.message ?? "No se pudo crear el usuario en Auth");
        }

        // 2. perfil en la tabla "usuario"
        try {
            return await this.UsuarioRepo.crearUsuario({ ...datos, rol }, auth.user.id);
        } catch (e) {
            await supabase.auth.admin.deleteUser(auth.user.id);   // rollback
            throw e;
        }
    }

    async actualizar(authId: string, cambios: ActualizarUsuario): Promise<Usuario> {
        if (cambios.nombre !== undefined && cambios.nombre.trim() === "") {
            throw new Error("El nombre no puede estar vacio");
        }
        await this.ProtegerDueno(authId, cambios);
        await this.UsuarioRepo.actualizarUsuario(authId, cambios);
        return this.obtenerPorId(authId);
    }

    async ProtegerDueno(authId: string, cambios: ActualizarUsuario): Promise<void> {
        const dejaSerDueno = cambios.activo === false ||
            (cambios.rol !== undefined && cambios.rol !== RolUsuario.Dueno);
        if (!dejaSerDueno) return;

        const actual = await this.UsuarioRepo.obtenerPorId(authId);
        if (!actual || actual.rol !== RolUsuario.Dueno || !actual.activo) return;

        if ((await this.UsuarioRepo.contarDuenos()) <= 1) {
            throw new Error("No puedes quitar al ultimo dueño");
        }
    }

    async desactivar(authId: string): Promise<Usuario> {
        return this.actualizar(authId, { activo: false });
    }

    async activar(authId: string): Promise<Usuario> {
        return this.actualizar(authId, { activo: true });
    }
}