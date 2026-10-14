import { HistorialMesa, CrearHistorialMesa, FiltrosHistorialMesa } from "../modelos/HistorialMesa.js";
import { HistorialMesaRepositorio } from "../persistencia/HistorialMesaRepositorio.js";

export class HistorialMesaServicio {
    constructor(private historialRepo = new HistorialMesaRepositorio()) {}

    async listar(filtros?: FiltrosHistorialMesa): Promise<HistorialMesa[]> {
        return this.historialRepo.listar(filtros);
    }

    async obtenerPorId(id: number): Promise<HistorialMesa> {
        const registro = await this.historialRepo.obtenerPorId(id);
        if (!registro) throw new Error("Registro de historial de mesa no encontrado");
        return registro;
    }

    async crear(datos: CrearHistorialMesa): Promise<HistorialMesa> {
        if (!(datos.idMesa > 0)) throw new Error("La mesa debe ser mayor a 0");
        if (!(datos.idUsuario > 0)) throw new Error("El usuario debe ser mayor a 0");
        if (datos.idComanda != null && datos.idComanda <= 0) {
            throw new Error("La comanda debe ser mayor a 0");
        }
        if (typeof datos.estado !== "string" || datos.estado.trim() === "") {
            throw new Error("El estado es obligatorio");
        }
        if (datos.monto != null && datos.monto < 0) {
            throw new Error("El monto no puede ser negativo");
        }

        return this.historialRepo.crearHistorialMesa({
            ...datos,
            estado: datos.estado.trim(),
        });
    }
}