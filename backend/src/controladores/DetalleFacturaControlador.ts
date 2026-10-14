import { Request, Response } from "express";
import { DetalleFacturaServicio } from "../servicios/DetalleFacturaServicio.js";

const detalleFacturaServicio = new DetalleFacturaServicio();

export class DetalleFacturaControlador {
    async listar(req: Request, res: Response): Promise<void> {
        try {
            let idFactura: number | undefined;
            if (req.query.idFactura !== undefined) {
                idFactura = Number(req.query.idFactura);
                if (Number.isNaN(idFactura)) {
                    res.status(400).json({ mensaje: "El idFactura debe ser un numero" });
                    return;
                }
            }
            const detalles = await detalleFacturaServicio.listar(idFactura);
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
            const detalle = await detalleFacturaServicio.obtenerPorId(id);
            res.status(200).json(detalle);
        } catch (error: any) {
            res.status(404).json({ mensaje: error.message });
        }
    }

    async crear(req: Request, res: Response): Promise<void> {
        try {
            const nuevoDetalle = await detalleFacturaServicio.crear(req.body);
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
            const detalleActualizado = await detalleFacturaServicio.actualizar(id, req.body);
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
            await detalleFacturaServicio.eliminar(id);
            res.status(200).json({ mensaje: "Detalle de factura eliminado" });
        } catch (error: any) {
            res.status(400).json({ mensaje: error.message });
        }
    }
}