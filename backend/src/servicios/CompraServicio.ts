import {
    Compra,
    CrearCompra,
    ActualizarCompra
} from "../modelos/Compra.js";

import { CompraRepositorio } from "../persistencia/CompraRepositorio.js";

export class CompraServicio {
    private compraRepositorio: CompraRepositorio;

    constructor() {
        this.compraRepositorio = new CompraRepositorio();
    }

    async listar(): Promise<Compra[]> {
        return await this.compraRepositorio.listar();
    }

    async obtenerPorId(id: number): Promise<Compra> {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error(
                "El ID de la compra debe ser un número entero positivo"
            );
        }

        const compra = await this.compraRepositorio.obtenerPorId(id);

        if (!compra) {
            throw new Error("La compra no existe");
        }

        return compra;
    }

    async crear(datos: CrearCompra): Promise<Compra> {
        if (
            !Number.isInteger(datos.id_proveedor) ||
            datos.id_proveedor <= 0
        ) {
            throw new Error(
                "El ID del proveedor debe ser un número entero positivo"
            );
        }

        if (
            datos.fecha !== undefined &&
            (
                typeof datos.fecha !== "string" ||
                datos.fecha.trim() === "" ||
                Number.isNaN(Date.parse(datos.fecha))
            )
        ) {
            throw new Error("La fecha de la compra no es válida");
        }

        const estadosPermitidos = [
            "REGISTRADA",
            "RECIBIDA",
            "ANULADA"
        ];

        if (
            datos.estado !== undefined &&
            !estadosPermitidos.includes(datos.estado)
        ) {
            throw new Error(
                "El estado debe ser REGISTRADA, RECIBIDA o ANULADA"
            );
        }

        return await this.compraRepositorio.crear(datos);
    }

    async actualizar(
        id: number,
        cambios: ActualizarCompra
    ): Promise<void> {
        await this.obtenerPorId(id);

        if (Object.keys(cambios).length === 0) {
            throw new Error(
                "Debe enviar al menos un dato para actualizar"
            );
        }

        if (
            cambios.id_proveedor !== undefined &&
            (
                !Number.isInteger(cambios.id_proveedor) ||
                cambios.id_proveedor <= 0
            )
        ) {
            throw new Error(
                "El ID del proveedor debe ser un número entero positivo"
            );
        }

        if (
            cambios.fecha !== undefined &&
            (
                typeof cambios.fecha !== "string" ||
                cambios.fecha.trim() === "" ||
                Number.isNaN(Date.parse(cambios.fecha))
            )
        ) {
            throw new Error("La fecha de la compra no es válida");
        }

        const estadosPermitidos = [
            "REGISTRADA",
            "RECIBIDA",
            "ANULADA"
        ];

        if (
            cambios.estado !== undefined &&
            !estadosPermitidos.includes(cambios.estado)
        ) {
            throw new Error(
                "El estado debe ser REGISTRADA, RECIBIDA o ANULADA"
            );
        }

        await this.compraRepositorio.actualizar(id, cambios);
    }
}