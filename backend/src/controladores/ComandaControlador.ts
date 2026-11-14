import { Request, Response } from "express";
import { ComandaServicio } from "../servicios/ComandaServicio.js";

const comandaServicio = new ComandaServicio();

export class ComandaControlador {
    async listar(req: Request, res: Response): Promise<void> {
        try {
            const comandas = await comandaServicio.listar();
            res.status(200).json(comandas);
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
            const comanda = await comandaServicio.obtenerPorId(id);
            res.status(200).json(comanda);
        } catch (error: any) {
            res.status(404).json({ mensaje: error.message });
        }
    }

    async crear(req: Request, res: Response): Promise<void> {
        try {
            const nuevaComanda = await comandaServicio.crear(req.body);
            res.status(201).json(nuevaComanda);
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
            const comandaActualizada = await comandaServicio.actualizar(id, req.body);
            res.status(200).json(comandaActualizada);
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
            await comandaServicio.eliminar(id);
            res.status(200).json({ success: true, mensaje: "Comanda eliminada correctamente" });
        } catch (error: any) {
            res.status(400).json({ mensaje: error.message });
        }
    }
}