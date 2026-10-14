import { Request, Response } from "express";
import { HistorialMesaServicio } from "../servicios/HistorialMesaServicio.js";

const historialMesaServicio = new HistorialMesaServicio();

export class HistorialMesaControlador {
    async listar(req: Request, res: Response): Promise<void> {
        try {
            const filtros: { idMesa?: number; idComanda?: number } = {};

            if (req.query.idMesa !== undefined) {
                filtros.idMesa = Number(req.query.idMesa);
                if (Number.isNaN(filtros.idMesa)) {
                    res.status(400).json({ mensaje: "El idMesa debe ser un numero" });
                    return;
                }
            }
            if (req.query.idComanda !== undefined) {
                filtros.idComanda = Number(req.query.idComanda);
                if (Number.isNaN(filtros.idComanda)) {
                    res.status(400).json({ mensaje: "El idComanda debe ser un numero" });
                    return;
                }
            }

            const registros = await historialMesaServicio.listar(filtros);
            res.status(200).json(registros);
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
            const registro = await historialMesaServicio.obtenerPorId(id);
            res.status(200).json(registro);
        } catch (error: any) {
            res.status(404).json({ mensaje: error.message });
        }
    }

    async crear(req: Request, res: Response): Promise<void> {
        try {
            const nuevoRegistro = await historialMesaServicio.crear(req.body);
            res.status(201).json(nuevoRegistro);
        } catch (error: any) {
            res.status(400).json({ mensaje: error.message });
        }
    }
}