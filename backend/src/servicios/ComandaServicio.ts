import { Comanda, CrearComanda, ActualizarComanda } from "../modelos/Comanda.js";
import { EstadoComanda } from "../modelos/EstadoComanda.js";
import { ComandaRepositorio } from "../persistencia/ComandaRepositorio.js";

export class ComandaServicio {
    constructor(private comandaRepo = new ComandaRepositorio()) {}

    async listar(): Promise<Comanda[]> {
        return this.comandaRepo.listar();
    }

    async obtenerPorId(id: number): Promise<Comanda> {
        const comanda = await this.comandaRepo.obtenerPorId(id);
        if (!comanda) throw new Error("Comanda no encontrada");
        return comanda;
    }

    async crear(datos: CrearComanda): Promise<Comanda> {
        const idMesa = datos.idMesa ?? null;
        if (idMesa != null && idMesa <= 0) throw new Error("La mesa debe ser mayor a 0");
        if (datos.idVenta != null && datos.idVenta <= 0) throw new Error("La venta debe ser mayor a 0");
        if (datos.idUsuario != null && datos.idUsuario <= 0) throw new Error("El usuario debe ser mayor a 0");
        if (datos.estado !== undefined && !Object.values(EstadoComanda).includes(datos.estado as any)) {
            throw new Error("Estado de comanda no valido");
        }
        return this.comandaRepo.crearComanda({ ...datos, idMesa });
    }

    async actualizar(id: number, cambios: ActualizarComanda): Promise<Comanda> {
        if (cambios.idMesa != null && cambios.idMesa <= 0) throw new Error("La mesa debe ser mayor a 0");
        if (cambios.idUsuario != null && cambios.idUsuario <= 0) throw new Error("El usuario debe ser mayor a 0");
        if (cambios.estado !== undefined && !Object.values(EstadoComanda).includes(cambios.estado as any)) {
            throw new Error("Estado de comanda no valido");
        }

        const actual = await this.obtenerPorId(id);
        if (actual.estado === EstadoComanda.Cerrado && cambios.estado === undefined) {
            throw new Error("No se puede modificar una comanda cerrada");
        }

        await this.comandaRepo.actualizarComanda(id, cambios);
        return this.obtenerPorId(id);
    }

    async eliminar(id: number): Promise<void> {
        await this.comandaRepo.eliminarComanda(id);
    }
}
