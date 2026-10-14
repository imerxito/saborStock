import { Request, Response } from "express";
import { DetalleComandaServicio } from "../servicios/DetalleComandaServicio.js";

const detalleComandaServicio = new DetalleComandaServicio();

export class DetalleComandaControlador {
    async listar(req: Request, res: Response): Promise<void> {
        try {
            let idComanda: number | undefined;
            if (req.query.idComanda !== undefined) {
                idComanda = Number(req.query.idComanda);
                if (Number.isNaN(idComanda)) {
                    res.status(400).json({ mensaje: "El idComanda debe ser un numero" });
                    return;
                }
            }
            const detalles = await detalleComandaServicio.listar(idComanda);
            res.status(200).json(detalles);
        } catch (error: any) {
            res.status(500).json({ mensaje: error.message });
        }
    }

    async obtenerPorId(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                res.status(400).json({ mensaje: "El id debe ser un numero" });
                return;
            }
            const detalle = await detalleComandaServicio.obtenerPorId(id);
            res.status(200).json(detalle);
        } catch (error: any) {
            res.status(404).json({ mensaje: error.message });
        }
    }

    async crear(req: Request, res: Response): Promise<void> {
        try {
            const nuevoDetalle = await detalleComandaServicio.crear(req.body);
            res.status(201).json(nuevoDetalle);
        } catch (error: any) {
            res.status(400).json({ mensaje: error.message });
        }
    }

    async actualizar(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                res.status(400).json({ mensaje: "El id debe ser un numero" });
                return;
            }
            const detalleActualizado = await detalleComandaServicio.actualizar(id, req.body);
            res.status(200).json(detalleActualizado);
        } catch (error: any) {
            res.status(400).json({ mensaje: error.message });
        }
    }

    async eliminar(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                res.status(400).json({ mensaje: "El id debe ser un numero" });
                return;
            }
            await detalleComandaServicio.eliminar(id);
            res.status(200).json({ mensaje: "Detalle de comanda eliminado" });
        } catch (error: any) {
            res.status(400).json({ mensaje: error.message });
        }
    }
}