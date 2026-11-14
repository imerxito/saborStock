import {
    Compra,
    CrearCompra,
    ActualizarCompra
} from "../modelos/Compra.js";

import { CompraRepositorio } from "../persistencia/CompraRepositorio.js";
import { DetalleCompraRepositorio } from "../persistencia/DetalleCompraRepositorio.js";
import { ProveedorRepositorio } from "../persistencia/ProveedorRepositorio.js";
import { IngredienteRepositorio } from "../persistencia/IngredienteRepositorio.js";

export class CompraServicio {
    private compraRepositorio: CompraRepositorio;
    private detalleRepositorio = new DetalleCompraRepositorio();
    private proveedorRepositorio = new ProveedorRepositorio();
    private ingredienteRepositorio = new IngredienteRepositorio();

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

        const { detalles, ...datosCompra } = datos;
        const proveedor = await this.proveedorRepositorio.obtenerPorId(datos.id_proveedor);
        if (!proveedor) {
            throw new Error("El proveedor no existe");
        }

        const detallesValidos = Array.isArray(detalles) ? detalles : [];
        const itemsStock: Array<{ idIngrediente: number; cantidad: number }> = [];
        const detallesCompra: Array<{
            id_ingrediente: number;
            cantidad: number;
            precio_aplicado: number;
        }> = [];

        for (const detalle of detallesValidos) {
            if (!Number.isInteger(detalle.id_ingrediente) || detalle.id_ingrediente <= 0) {
                throw new Error("El ID del ingrediente debe ser un número entero positivo");
            }
            if (!Number.isFinite(detalle.cantidad) || detalle.cantidad <= 0) {
                throw new Error("La cantidad del detalle debe ser mayor a cero");
            }
            if (!Number.isFinite(detalle.precio_aplicado) || detalle.precio_aplicado < 0) {
                throw new Error("El precio aplicado debe ser mayor o igual a cero");
            }

            const ingrediente = await this.ingredienteRepositorio.obtenerPorId(detalle.id_ingrediente);
            if (!ingrediente) {
                throw new Error(`El ingrediente ${detalle.id_ingrediente} no existe`);
            }
            if (
                proveedor.id_categoria_ingrediente &&
                ingrediente.id_categoria_ingrediente &&
                proveedor.id_categoria_ingrediente !== ingrediente.id_categoria_ingrediente
            ) {
                throw new Error(
                    `El proveedor no abastece la categoría del insumo ${ingrediente.nombre}`
                );
            }

            detallesCompra.push({
                id_ingrediente: detalle.id_ingrediente,
                cantidad: detalle.cantidad,
                precio_aplicado: detalle.precio_aplicado
            });
            itemsStock.push({ idIngrediente: detalle.id_ingrediente, cantidad: detalle.cantidad });
        }

        // detalle_compra tiene PK compuesta (id_compra, id_ingrediente):
        // consolidar ingredientes repetidos para no violar la llave.
        const consolidados = new Map<number, { id_ingrediente: number; cantidad: number; precio_aplicado: number }>();
        for (const d of detallesCompra) {
            const prev = consolidados.get(d.id_ingrediente);
            if (prev) prev.cantidad += d.cantidad;
            else consolidados.set(d.id_ingrediente, { ...d });
        }
        const detallesFinales = Array.from(consolidados.values());

        // El trigger tg_compra_stock mueve el stock al pasar a RECIBIDA,
        // por eso la compra nace como REGISTRADA y luego se actualiza.
        const compra = await this.compraRepositorio.crear({
            ...datosCompra,
            estado: datos.estado === "ANULADA" ? "ANULADA" : "REGISTRADA"
        });

        for (const detalle of detallesFinales) {
            await this.detalleRepositorio.crear({
                id_compra: compra.id_compra,
                id_ingrediente: detalle.id_ingrediente,
                cantidad: detalle.cantidad,
                precio_aplicado: detalle.precio_aplicado
            });
        }

        if (datos.estado === "RECIBIDA") {
            await this.compraRepositorio.actualizar(compra.id_compra, { estado: "RECIBIDA" });
            const actualizada = await this.compraRepositorio.obtenerPorId(compra.id_compra);
            return actualizada ?? compra;
        }

        return compra;
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

    async eliminar(id: number): Promise<void> {
        const compra = await this.obtenerPorId(id);

        // Pasar a ANULADA dispara tg_compra_stock y revierte el stock
        // si la compra estaba RECIBIDA.
        if (compra.estado === "RECIBIDA") {
            await this.compraRepositorio.actualizar(id, { estado: "ANULADA" });
        }

        await this.detalleRepositorio.eliminarPorCompra(id);
        await this.compraRepositorio.eliminar(id);
    }
}