import { Request, Response } from "express";
import { CompraServicio } from "../servicios/CompraServicio.js";

const compraServicio = new CompraServicio();

export class CompraControlador {

    async listar(req: Request, res: Response): Promise<void> {
        try {
            const compras = await compraServicio.listar();
            res.status(200).json(compras);
        } catch (error: any) {
            res.status(500).json({ mensaje: error.message });
        }
    }

    async obtenerPorId(
        req: Request<{ id: string }>,
        res: Response
    ): Promise<void> {
        try {
            const id = Number(req.params.id);
            const compra = await compraServicio.obtenerPorId(id);

            res.status(200).json(compra);
        } catch (error: any) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al obtener la compra";

            const noEncontrado = mensaje === "La compra no existe";

            const codigo = noEncontrado
                ? 404
                : mensaje.includes("Error al obtener compra")
                    ? 500
                    : 400;

            res.status(codigo).json({ mensaje });
        }
    }

    async crear(req: Request, res: Response): Promise<void> {
        try {
            const nuevaCompra = await compraServicio.crear(req.body);

            res.status(201).json(nuevaCompra);
        } catch (error: any) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al crear la compra";

            const codigo = mensaje.includes("Error al crear compra")
                ? 500
                : 400;

            res.status(codigo).json({ mensaje });
        }
    }

    async actualizar(
        req: Request<{ id: string }>,
        res: Response
    ): Promise<void> {
        try {
            const id = Number(req.params.id);

            await compraServicio.actualizar(id, req.body);

            const compraActualizada =
                await compraServicio.obtenerPorId(id);

            res.status(200).json(compraActualizada);
        } catch (error: any) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al actualizar la compra";

            const noEncontrado = mensaje === "La compra no existe";

            const codigo = noEncontrado
                ? 404
                : mensaje.includes("Error al actualizar compra") ||
                  mensaje.includes("Error al obtener compra")
                    ? 500
                    : 400;

            res.status(codigo).json({ mensaje });
        }
    }
}