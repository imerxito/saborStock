import { Request, Response } from "express";
import { DetalleCompraServicio } from "../servicios/DetalleCompraServicio.js";

const detalleCompraServicio = new DetalleCompraServicio();

export class DetalleCompraControlador {

    async listar(req: Request, res: Response): Promise<void> {
        try {
            const detalles = await detalleCompraServicio.listar();

            res.status(200).json(detalles);
        } catch (error: any) {
            res.status(500).json({ mensaje: error.message });
        }
    }

    async listarPorCompra(
        req: Request<{ idCompra: string }>,
        res: Response
    ): Promise<void> {
        try {
            const idCompra = Number(req.params.idCompra);

            const detalles =
                await detalleCompraServicio.listarPorCompra(idCompra);

            res.status(200).json(detalles);
        } catch (error: any) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al listar los detalles de compra";

            const codigo = mensaje.includes("Error al listar detalles")
                ? 500
                : 400;

            res.status(codigo).json({ mensaje });
        }
    }

    async obtenerPorId(
        req: Request<{ idCompra: string; idIngrediente: string }>,
        res: Response
    ): Promise<void> {
        try {
            const idCompra = Number(req.params.idCompra);
            const idIngrediente = Number(req.params.idIngrediente);

            const detalle = await detalleCompraServicio.obtenerPorId(
                idCompra,
                idIngrediente
            );

            res.status(200).json(detalle);
        } catch (error: any) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al obtener el detalle de compra";

            const noEncontrado =
                mensaje === "El detalle de compra no existe";

            const codigo = noEncontrado
                ? 404
                : mensaje.includes("Error al obtener detalle")
                    ? 500
                    : 400;

            res.status(codigo).json({ mensaje });
        }
    }

    async crear(req: Request, res: Response): Promise<void> {
        try {
            const nuevoDetalle =
                await detalleCompraServicio.crear(req.body);

            res.status(201).json(nuevoDetalle);
        } catch (error: any) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al crear el detalle de compra";

            const codigo = mensaje.includes("Error al crear detalle")
                ? 500
                : 400;

            res.status(codigo).json({ mensaje });
        }
    }

    async actualizar(
        req: Request<{
            idCompra: string;
            idIngrediente: string;
        }>,
        res: Response
    ): Promise<void> {
        try {
            const idCompra = Number(req.params.idCompra);
            const idIngrediente = Number(req.params.idIngrediente);

            await detalleCompraServicio.actualizar(
                idCompra,
                idIngrediente,
                req.body
            );

            const detalleActualizado =
                await detalleCompraServicio.obtenerPorId(
                    idCompra,
                    idIngrediente
                );

            res.status(200).json(detalleActualizado);
        } catch (error: any) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al actualizar el detalle de compra";

            const noEncontrado =
                mensaje === "El detalle de compra no existe";

            const codigo = noEncontrado
                ? 404
                : mensaje.includes("Error al actualizar detalle") ||
                  mensaje.includes("Error al obtener detalle")
                    ? 500
                    : 400;

            res.status(codigo).json({ mensaje });
        }
    }

    async eliminar(
        req: Request<{
            idCompra: string;
            idIngrediente: string;
        }>,
        res: Response
    ): Promise<void> {
        try {
            const idCompra = Number(req.params.idCompra);
            const idIngrediente = Number(req.params.idIngrediente);

            await detalleCompraServicio.eliminar(
                idCompra,
                idIngrediente
            );

            res.status(200).json({
                mensaje: "Detalle de compra eliminado correctamente"
            });
        } catch (error: any) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al eliminar el detalle de compra";

            const noEncontrado =
                mensaje === "El detalle de compra no existe";

            const codigo = noEncontrado
                ? 404
                : mensaje.includes("Error al eliminar detalle") ||
                  mensaje.includes("Error al obtener detalle")
                    ? 500
                    : 400;

            res.status(codigo).json({ mensaje });
        }
    }
}