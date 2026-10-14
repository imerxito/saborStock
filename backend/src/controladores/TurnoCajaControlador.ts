import { Request, Response } from "express";
import { TurnoCajaServicio } from "../servicios/TurnoCajaServicio.js";

const servicio = new TurnoCajaServicio();

export class TurnoCajaControlador {
    async listar(req: Request, res: Response): Promise<void> {
        try {
            res.status(200).json(await servicio.listar());
        } catch (error: any) {
            res.status(500).json({ mensaje: error.message });
        }
    }

    async obtenerPorId(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            res.status(200).json(await servicio.obtenerPorId(Number(req.params.id)));
        } catch (error: any) {
            res.status(404).json({ mensaje: error.message });
        }
    }

    async obtenerAbiertoPorCaja(req: Request<{ idCaja: string }>, res: Response): Promise<void> {
        try {
            res.status(200).json(await servicio.obtenerAbiertoPorCaja(Number(req.params.idCaja)));
        } catch (error: any) {
            res.status(404).json({ mensaje: error.message });
        }
    }

    async abrir(req: Request, res: Response): Promise<void> {
        try {
            res.status(201).json(await servicio.abrir(req.body));
        } catch (error: any) {
            res.status(400).json({ mensaje: error.message });
        }
    }

    async cerrar(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            res.status(200).json(await servicio.cerrar(Number(req.params.id), req.body));
        } catch (error: any) {
            res.status(400).json({ mensaje: error.message });
        }
    }
}