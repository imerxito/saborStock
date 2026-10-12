import { Request, Response } from "express";
import { MovimientoInventarioServicio } from "../servicios/MovimientoInventarioServicio.js";

const movimientoServicio = new MovimientoInventarioServicio();

export class MovimientoInventarioControlador {

    async listar(req: Request, res: Response): Promise<void> {
        try {
            const movimientos = await movimientoServicio.listar();
            res.status(200).json(movimientos);
        } catch (error: any) {
            res.status(500).json({
                mensaje: error instanceof Error
                    ? error.message
                    : "Error al listar movimientos"
            });
        }
    }

    async obtenerPorId(
        req: Request<{ id: string }>,
        res: Response
    ): Promise<void> {
        try {
            const id = Number(req.params.id);
            const movimiento = await movimientoServicio.obtenerPorId(id);

            res.status(200).json(movimiento);
        } catch (error: any) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al obtener el movimiento";

            const codigo = mensaje === "El movimiento de inventario no existe"
                ? 404
                : mensaje.startsWith("Error al obtener movimiento")
                    ? 500
                    : 400;

            res.status(codigo).json({ mensaje });
        }
    }

    async listarPorIngrediente(
        req: Request<{ idIngrediente: string }>,
        res: Response
    ): Promise<void> {
        try {
            const idIngrediente = Number(req.params.idIngrediente);

            const movimientos = await movimientoServicio.listarPorIngrediente(
                idIngrediente
            );

            res.status(200).json(movimientos);
        } catch (error: any) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al consultar el historial";

            const codigo = mensaje === "El ingrediente no existe"
                ? 404
                : mensaje.startsWith("Error al")
                    ? 500
                    : 400;

            res.status(codigo).json({ mensaje });
        }
    }

    async crear(req: Request, res: Response): Promise<void> {
        try {
            const movimiento = await movimientoServicio.crear(req.body);

            res.status(201).json({
                mensaje: "Movimiento registrado correctamente",
                movimiento
            });
        } catch (error: any) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al registrar el movimiento";

            const codigo = mensaje.startsWith("Error al registrar movimiento")
                ? 500
                : 400;

            res.status(codigo).json({ mensaje });
        }
    }
}