import { HistorialCaja, CrearHistorialCaja, FiltrosHistorialCaja } from "../modelos/HistorialCaja.js";
import { HistorialCajaRepositorio } from "../persistencia/HistorialCajaRepositorio.js";

export class HistorialCajaServicio {
    constructor(private historialRepo = new HistorialCajaRepositorio()) {}

    async listar(filtros?: FiltrosHistorialCaja): Promise<HistorialCaja[]> {
        return this.historialRepo.listar(filtros);
    }

    async obtenerPorId(id: number): Promise<HistorialCaja> {
        const registro = await this.historialRepo.obtenerPorId(id);
        if (!registro) throw new Error("Registro de historial de caja no encontrado");
        return registro;
    }

    async crear(datos: CrearHistorialCaja): Promise<HistorialCaja> {
        if (!(datos.idTurnoCaja > 0)) throw new Error("El turno de caja debe ser mayor a 0");
        if (!(datos.idUsuario > 0)) throw new Error("El usuario debe ser mayor a 0");
        if (datos.idFactura != null && datos.idFactura <= 0) {
            throw new Error("La factura debe ser mayor a 0");
        }
        if (typeof datos.metodoPago !== "string" || datos.metodoPago.trim() === "") {
            throw new Error("El metodo de pago es obligatorio");
        }
        if (typeof datos.tipoPago !== "string" || datos.tipoPago.trim() === "") {
            throw new Error("El tipo de pago es obligatorio");
        }
        if (typeof datos.monto !== "number" || Number.isNaN(datos.monto) || datos.monto < 0) {
            throw new Error("El monto debe ser un numero mayor o igual a 0");
        }

        return this.historialRepo.crearHistorialCaja({
            ...datos,
            metodoPago: datos.metodoPago.trim(),
            tipoPago: datos.tipoPago.trim(),
        });
    }
}