import { Request, Response } from "express";
import { MesaServicio } from "../servicios/MesaServicio.js";

const mesaServicio = new MesaServicio();

export class MesaControlador {
    async listar(req: Request, res: Response): Promise<void> {
        try {
            const mesas = await mesaServicio.listar();
            res.status(200).json(mesas);
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
            const mesa = await mesaServicio.obtenerPorId(id);
            res.status(200).json(mesa);
        } catch (error: any) {
            res.status(404).json({ mensaje: error.message });
        }
    }

    async crear(req: Request, res: Response): Promise<void> {
        try {
            const nuevaMesa = await mesaServicio.crear(req.body);
            res.status(201).json(nuevaMesa);
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
            const mesaActualizada = await mesaServicio.actualizar(id, req.body);
            res.status(200).json(mesaActualizada);
        } catch (error: any) {
            res.status(400).json({ mensaje: error.message });
        }
    }
}