import { Factura, CrearFactura, ActualizarFactura } from "../modelos/Factura.js";
import { FacturaRepositorio } from "../persistencia/FacturaRepositorio.js";

export class FacturaServicio {
    constructor(private facturaRepo = new FacturaRepositorio()) {}

    async listar(): Promise<Factura[]> {
        return this.facturaRepo.listar();
    }

    async obtenerPorId(id: number): Promise<Factura> {
        const factura = await this.facturaRepo.obtenerPorId(id);
        if (!factura) throw new Error("Factura no encontrada");
        return factura;
    }

    async crear(datos: CrearFactura): Promise<Factura> {
        if (!(datos.idMesa > 0)) throw new Error("La mesa debe ser mayor a 0");
        if (!(datos.idUsuario > 0)) throw new Error("El usuario debe ser mayor a 0");

        const subtotal = datos.subtotal ?? 0;
        const propina = datos.propina ?? 0;
        if (subtotal < 0) throw new Error("El subtotal no puede ser negativo");
        if (propina < 0) throw new Error("La propina no puede ser negativa");

        // El total siempre se calcula en el servidor, no se confía en el que mande el cliente
        const totalPagar = subtotal + propina;

        return this.facturaRepo.crearFactura({
            idMesa: datos.idMesa,
            idUsuario: datos.idUsuario,
            subtotal,
            propina,
            totalPagar,
        });
    }

    async actualizar(id: number, cambios: ActualizarFactura): Promise<Factura> {
        if (cambios.idMesa !== undefined && !(cambios.idMesa > 0)) {
            throw new Error("La mesa debe ser mayor a 0");
        }
        if (cambios.idUsuario !== undefined && !(cambios.idUsuario > 0)) {
            throw new Error("El usuario debe ser mayor a 0");
        }
        if (cambios.subtotal !== undefined && cambios.subtotal < 0) {
            throw new Error("El subtotal no puede ser negativo");
        }
        if (cambios.propina !== undefined && cambios.propina < 0) {
            throw new Error("La propina no puede ser negativa");
        }

        const actual = await this.obtenerPorId(id);

        const subtotal = cambios.subtotal ?? actual.subtotal;
        const propina = cambios.propina ?? actual.propina;

        await this.facturaRepo.actualizarFactura(id, {
            idMesa: cambios.idMesa,
            idUsuario: cambios.idUsuario,
            subtotal: cambios.subtotal,
            propina: cambios.propina,
            totalPagar: subtotal + propina,
        });
        return this.obtenerPorId(id);
    }
}