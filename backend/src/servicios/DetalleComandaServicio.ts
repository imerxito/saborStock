import {
    DetalleComanda,
    CrearDetalleComanda,
    ActualizarDetalleComanda,
} from "../modelos/DetalleComanda.js";
import { EstadoComanda } from "../modelos/EstadoComanda.js";
import { DetalleComandaRepositorio } from "../persistencia/DetalleComandaRepositorio.js";
import { ComandaRepositorio } from "../persistencia/ComandaRepositorio.js";

export class DetalleComandaServicio {
    constructor(
        private detalleRepo = new DetalleComandaRepositorio(),
        private comandaRepo = new ComandaRepositorio()
    ) {}

    async listar(idComanda?: number): Promise<DetalleComanda[]> {
        if (idComanda !== undefined) return this.detalleRepo.listarPorComanda(idComanda);
        return this.detalleRepo.listar();
    }

    async obtenerPorId(id: number): Promise<DetalleComanda> {
        const detalle = await this.detalleRepo.obtenerPorId(id);
        if (!detalle) throw new Error("Detalle de comanda no encontrado");
        return detalle;
    }

    async crear(datos: CrearDetalleComanda): Promise<DetalleComanda> {
        if (datos.idComanda <= 0) throw new Error("La comanda debe ser mayor a 0");
        if (datos.idProducto <= 0) throw new Error("El producto debe ser mayor a 0");
        if (!(datos.cantidad > 0)) throw new Error("La cantidad debe ser mayor a 0");

        await this.validarComandaEditable(datos.idComanda);
        return this.detalleRepo.crearDetalleComanda(datos);
    }

    async actualizar(id: number, cambios: ActualizarDetalleComanda): Promise<DetalleComanda> {
        if (cambios.idProducto !== undefined && cambios.idProducto <= 0) {
            throw new Error("El producto debe ser mayor a 0");
        }
        if (cambios.cantidad !== undefined && !(cambios.cantidad > 0)) {
            throw new Error("La cantidad debe ser mayor a 0");
        }

        const actual = await this.obtenerPorId(id);
        await this.validarComandaEditable(actual.idComanda);

        await this.detalleRepo.actualizarDetalleComanda(id, cambios);
        return this.obtenerPorId(id);
    }

    async eliminar(id: number): Promise<void> {
        const actual = await this.obtenerPorId(id);
        await this.validarComandaEditable(actual.idComanda);
        await this.detalleRepo.eliminarDetalleComanda(id);
    }

    // Solo se pueden agregar/editar/quitar productos mientras la comanda no esté cerrada
    private async validarComandaEditable(idComanda: number): Promise<void> {
        const comanda = await this.comandaRepo.obtenerPorId(idComanda);
        if (!comanda) throw new Error("La comanda indicada no existe");
        if (comanda.estado === EstadoComanda.Cerrado) {
            throw new Error("No se pueden modificar los productos de una comanda cerrada");
        }
    }
}