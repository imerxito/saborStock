import {
    DetalleFactura,
    CrearDetalleFactura,
    ActualizarDetalleFactura,
} from "../modelos/DetalleFactura.js";
import { DetalleFacturaRepositorio } from "../persistencia/DetalleFacturaRepositorio.js";
import { FacturaServicio } from "./FacturaServicio.js";

export class DetalleFacturaServicio {
    constructor(
        private detalleRepo = new DetalleFacturaRepositorio(),
        private facturaServicio = new FacturaServicio()
    ) {}

    async listar(idFactura?: number): Promise<DetalleFactura[]> {
        if (idFactura !== undefined) return this.detalleRepo.listarPorFactura(idFactura);
        return this.detalleRepo.listar();
    }

    async obtenerPorId(id: number): Promise<DetalleFactura> {
        const detalle = await this.detalleRepo.obtenerPorId(id);
        if (!detalle) throw new Error("Detalle de factura no encontrado");
        return detalle;
    }

    async crear(datos: CrearDetalleFactura): Promise<DetalleFactura> {
        if (!(datos.idFactura > 0)) throw new Error("La factura debe ser mayor a 0");
        if (!(datos.idProducto > 0)) throw new Error("El producto debe ser mayor a 0");
        if (!(datos.cantidad > 0)) throw new Error("La cantidad debe ser mayor a 0");
        if (datos.precioUnitario !== undefined && datos.precioUnitario < 0) {
            throw new Error("El precio unitario no puede ser negativo");
        }

        await this.facturaServicio.obtenerPorId(datos.idFactura); // lanza error si no existe

        // Si no se envía precio, se toma el precio de venta actual del producto
        const precioUnitario =
            datos.precioUnitario ?? (await this.precioDelProducto(datos.idProducto));

        const nuevo = await this.detalleRepo.crearDetalleFactura({
            idFactura: datos.idFactura,
            idProducto: datos.idProducto,
            cantidad: datos.cantidad,
            precioUnitario,
            subtotal: datos.cantidad * precioUnitario,
        });

        await this.recalcularFactura(nuevo.idFactura);
        return nuevo;
    }

    async actualizar(id: number, cambios: ActualizarDetalleFactura): Promise<DetalleFactura> {
        if (cambios.idProducto !== undefined && !(cambios.idProducto > 0)) {
            throw new Error("El producto debe ser mayor a 0");
        }
        if (cambios.cantidad !== undefined && !(cambios.cantidad > 0)) {
            throw new Error("La cantidad debe ser mayor a 0");
        }
        if (cambios.precioUnitario !== undefined && cambios.precioUnitario < 0) {
            throw new Error("El precio unitario no puede ser negativo");
        }

        const actual = await this.obtenerPorId(id);

        const cantidad = cambios.cantidad ?? actual.cantidad;
        let precioUnitario = cambios.precioUnitario ?? actual.precioUnitario;

        // Si cambia el producto y no se indica precio, se toma el del nuevo producto
        if (
            cambios.idProducto !== undefined &&
            cambios.idProducto !== actual.idProducto &&
            cambios.precioUnitario === undefined
        ) {
            precioUnitario = await this.precioDelProducto(cambios.idProducto);
        }

        await this.detalleRepo.actualizarDetalleFactura(id, {
            idProducto: cambios.idProducto,
            cantidad: cambios.cantidad,
            precioUnitario,
            subtotal: cantidad * precioUnitario,
        });

        await this.recalcularFactura(actual.idFactura);
        return this.obtenerPorId(id);
    }

    async eliminar(id: number): Promise<void> {
        const actual = await this.obtenerPorId(id);
        await this.detalleRepo.eliminarDetalleFactura(id);
        await this.recalcularFactura(actual.idFactura);
    }

    private async precioDelProducto(idProducto: number): Promise<number> {
        const precio = await this.detalleRepo.obtenerPrecioProducto(idProducto);
        if (precio === null) throw new Error("El producto indicado no existe");
        return precio;
    }

    // subtotal de la factura = suma de los subtotales de sus detalles; FacturaServicio recalcula el total
    private async recalcularFactura(idFactura: number): Promise<void> {
        const detalles = await this.detalleRepo.listarPorFactura(idFactura);
        const subtotal = detalles.reduce((suma, d) => suma + d.subtotal, 0);
        await this.facturaServicio.actualizar(idFactura, { subtotal });
    }
}