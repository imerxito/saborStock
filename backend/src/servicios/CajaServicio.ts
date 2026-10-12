import {CajaRepositorio} from "../persistencia/CajaRepositorio.js";
import {Caja, CrearCaja, ActualizarCaja} from "../modelos/Caja.js";

export class CajaServicio {
    private repo = new CajaRepositorio();

    async listar(): Promise<Caja[]> {
        return this.repo.listar();
    }

    async obtenerPorId(id: number): Promise<Caja> {
        const caja = await this.repo.obtenerCajaPorId(id);
        if (!caja) throw new Error("Caja no encontrada");
        return caja;
    }

    async crear(dto: CrearCaja): Promise<Caja> {
        if (dto.nombre.trim() === '') throw new Error("El nombre no puede estar vacío");
        return this.repo.crearCaja(dto);
    }

    async actualizar(id: number, dto: ActualizarCaja): Promise<Caja> {
        await this.obtenerPorId(id);
        if (dto.nombre !== undefined && dto.nombre.trim() === "") {
            throw new Error("El nombre no puede estar vacío");
        }
        await this.repo.actualizarCaja(id, dto);
        return this.obtenerPorId(id);
    }

    async eliminar(id: number): Promise<void> {
        await this.obtenerPorId(id);
        await this.repo.eliminarCaja(id);
    }

}