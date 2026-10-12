import {Request, Response} from "express";
import {CajaServicio} from "../servicios/CajaServicio.js";

const servicio = new CajaServicio();

export class CajaControlador {
    async listar(req: Request, res: Response): Promise<void> {
        try {
            const cajas = await servicio.listar();
            res.status(200).json(cajas);
        } catch (error: any) {
            res.status(500).json({ mensaje: error.message });
        }
    }

    async obtenerPorId(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const caja = await servicio.obtenerPorId(Number(req.params.id));
            res.status(200).json(caja);
        } catch (error: any) {
            res.status(404).json({ mensaje: error.message });
        }
    }

    async crear(req: Request, res: Response): Promise<void> {
        try {
            const nuevaCaja = await servicio.crear(req.body);
            res.status(201).json(nuevaCaja);
        } catch (error: any) {
            res.status(400).json({ mensaje: error.message });
        }
    }

    async actualizar(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const cajaActualizada = await servicio.actualizar(Number(req.params.id), req.body);
            res.status(200).json(cajaActualizada);
        } catch (error: any) {
            res.status(400).json({ mensaje: error.message });
        }
    }

    async eliminar(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            await servicio.eliminar(Number(req.params.id));
            res.status(200).json({ mensaje: "Caja eliminada correctamente" });
        } catch (error: any) {
            res.status(404).json({ mensaje: error.message });
        }
    }
}