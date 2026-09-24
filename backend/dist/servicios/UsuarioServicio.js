import { RolUsuario } from "../modelos/RolUsuario.js";
import { UsuarioRepositorio } from "../persistencia/UsuarioRepositorio.js";
export class UsuarioServicio {
    UsuarioRepo;
    constructor(UsuarioRepo = new UsuarioRepositorio()) {
        this.UsuarioRepo = UsuarioRepo;
    }
    async listar() {
        return this.UsuarioRepo.listar();
    }
    async obtenerPorId(id) {
        const usuario = await this.UsuarioRepo.obtenerPorId(id);
        if (!usuario)
            throw new Error("Usuario no encontrado");
        return usuario;
    }
    async obtenerPorCedula(cedula) {
        const usuario = await this.UsuarioRepo.obtenerPorCedula(cedula);
        if (!usuario) {
            throw new Error("Cedula no encontrado");
        }
        return usuario;
    }
    async crear(datos) {
        if (datos.nombre.trim() === "") {
            throw new Error("El nombre no puede estar vacio");
        }
        const cedulaExiste = await this.UsuarioRepo.obtenerPorCedula(datos.cedula);
        if (cedulaExiste)
            throw Error("Ya esta esta cedula");
        const CorreoExiste = await this.UsuarioRepo.obtenerPorCorreo(datos.correo);
        if (CorreoExiste)
            throw Error("ya este correo esta registrado");
        const hayDueno = Number(await this.UsuarioRepo.ContarAdmin()) > 0;
        if (Number(hayDueno) === 0) {
            datos.rol = RolUsuario.Dueno;
        }
        return this.UsuarioRepo.crearUsuario(datos);
    }
    async actualizar(id, cambios) {
        if (cambios.nombre !== undefined && cambios.nombre.trim() === "") {
            throw new Error("El nombre no puede estar vacio");
        }
        await this.UsuarioRepo.actualizarUsuario(id, cambios);
        return this.obtenerPorId(id);
    }
    async ProtegerDueno(id, cambios) {
        const dejaSerDueno = cambios.activo === false || (cambios.rol !== undefined && cambios.rol !== RolUsuario.Dueno);
        if (!dejaSerDueno)
            return;
        const actual = await this.UsuarioRepo.obtenerPorId(id);
        if (!actual || actual.rol !== RolUsuario.Dueno || !actual.activo)
            return;
        if (Number(await this.UsuarioRepo.ContarAdmin()) <= 1) {
            throw new Error(`no puedes quitar al ultimo dueño`);
        }
    }
    async desactivar(id) {
        return this.actualizar(id, { activo: false });
    }
    async activar(id) {
        return this.actualizar(id, { activo: true });
    }
}
