import { Request, Response } from "express";
import { FacturaServicio } from "../servicios/FacturaServicio.js";

const facturaServicio = new FacturaServicio();

export class FacturaControlador {
    async listar(req: Request, res: Response): Promise<void> {
        try {
            const limite = req.query.limite ? Number(req.query.limite) : 200;
            const facturas = await facturaServicio.listar(Number.isNaN(limite) ? 200 : limite);
            res.status(200).json(facturas);
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
            const factura = await facturaServicio.obtenerPorId(id);
            res.status(200).json(factura);
        } catch (error: any) {
            res.status(404).json({ mensaje: error.message });
        }
    }

    async crear(req: Request, res: Response): Promise<void> {
        try {
            const nuevaFactura = await facturaServicio.crear(req.body);
            res.status(201).json(nuevaFactura);
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
            const facturaActualizada = await facturaServicio.actualizar(id, req.body);
            res.status(200).json(facturaActualizada);
        } catch (error: any) {
            res.status(400).json({ mensaje: error.message });
        }
    }
}