import {
    DetalleCompra,
    CrearDetalleCompra,
    ActualizarDetalleCompra
} from "../modelos/DetalleCompra.js";

import {
    DetalleCompraRepositorio
} from "../persistencia/DetalleCompraRepositorio.js";

export class DetalleCompraServicio {
    private detalleCompraRepositorio: DetalleCompraRepositorio;

    constructor() {
        this.detalleCompraRepositorio = new DetalleCompraRepositorio();
    }

    async listar(): Promise<DetalleCompra[]> {
        return await this.detalleCompraRepositorio.listar();
    }

    async listarPorCompra(
        idCompra: number
    ): Promise<DetalleCompra[]> {
        if (!Number.isInteger(idCompra) || idCompra <= 0) {
            throw new Error(
                "El ID de la compra debe ser un número entero positivo"
            );
        }

        return await this.detalleCompraRepositorio.listarPorCompra(
            idCompra
        );
    }

    async obtenerPorId(
        idCompra: number,
        idIngrediente: number
    ): Promise<DetalleCompra> {
        this.validarIdentificadores(idCompra, idIngrediente);

        const detalle = await this.detalleCompraRepositorio.obtenerPorId(
            idCompra,
            idIngrediente
        );

        if (!detalle) {
            throw new Error("El detalle de compra no existe");
        }

        return detalle;
    }

    async crear(
        datos: CrearDetalleCompra
    ): Promise<DetalleCompra> {
        this.validarIdentificadores(
            datos.id_compra,
            datos.id_ingrediente
        );

        this.validarCantidad(datos.cantidad);
        this.validarPrecio(datos.precio_aplicado);

        return await this.detalleCompraRepositorio.crear(datos);
    }

    async actualizar(
        idCompra: number,
        idIngrediente: number,
        cambios: ActualizarDetalleCompra
    ): Promise<void> {
        await this.obtenerPorId(idCompra, idIngrediente);

        if (Object.keys(cambios).length === 0) {
            throw new Error(
                "Debe enviar al menos un dato para actualizar"
            );
        }

        if (cambios.cantidad !== undefined) {
            this.validarCantidad(cambios.cantidad);
        }

        if (cambios.precio_aplicado !== undefined) {
            this.validarPrecio(cambios.precio_aplicado);
        }

        await this.detalleCompraRepositorio.actualizar(
            idCompra,
            idIngrediente,
            cambios
        );
    }

    async eliminar(
        idCompra: number,
        idIngrediente: number
    ): Promise<void> {
        await this.obtenerPorId(idCompra, idIngrediente);

        await this.detalleCompraRepositorio.eliminar(
            idCompra,
            idIngrediente
        );
    }

    private validarIdentificadores(
        idCompra: number,
        idIngrediente: number
    ): void {
        if (!Number.isInteger(idCompra) || idCompra <= 0) {
            throw new Error(
                "El ID de la compra debe ser un número entero positivo"
            );
        }

        if (!Number.isInteger(idIngrediente) || idIngrediente <= 0) {
            throw new Error(
                "El ID del ingrediente debe ser un número entero positivo"
            );
        }
    }

    private validarCantidad(cantidad: number): void {
        if (
            typeof cantidad !== "number" ||
            !Number.isFinite(cantidad) ||
            cantidad <= 0
        ) {
            throw new Error(
                "La cantidad debe ser un número mayor que cero"
            );
        }
    }

    private validarPrecio(precio: number): void {
        if (
            typeof precio !== "number" ||
            !Number.isFinite(precio) ||
            precio < 0
        ) {
            throw new Error(
                "El precio aplicado debe ser un número mayor o igual a cero"
            );
        }
    }
}