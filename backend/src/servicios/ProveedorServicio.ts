import {Proveedor,CrearProveedor,ActualizarProveedor} from "../modelos/Proveedor.js";
import {ProveedorRepositorio} from "../persistencia/ProveedorRepositorio.js";

export class ProveedorServicio {
    private repositorio: ProveedorRepositorio;

    constructor(repositorio: ProveedorRepositorio = new ProveedorRepositorio()) {
        this.repositorio = repositorio;
    }

    async listar(): Promise<Proveedor[]> {
        return await this.repositorio.listar();
    }

    async obtenerPorId(id: number): Promise<Proveedor | null> {
        return await this.repositorio.obtenerPorId(id);
    }

    async crear(datos: CrearProveedor): Promise<Proveedor> {
        return await this.repositorio.crear(datos);
    }

    async actualizar(id: number, datos: ActualizarProveedor): Promise<Proveedor> {
        return await this.repositorio.actualizar(id, datos);
    }

    async desactivar(id: number): Promise<void> {
        return await this.repositorio.desactivar(id);
    }

    async activar(id: number): Promise<void> {
        return await this.repositorio.activar(id);
    }

    async eliminar(id: number): Promise<void> {
        return await this.repositorio.eliminar(id);
    }
}