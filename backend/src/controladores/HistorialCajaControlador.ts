import { Request, Response } from "express";
import { HistorialCajaServicio } from "../servicios/HistorialCajaServicio.js";

const historialCajaServicio = new HistorialCajaServicio();

export class HistorialCajaControlador {
    async listar(req: Request, res: Response): Promise<void> {
        try {
            const filtros: { idTurnoCaja?: number; idFactura?: number } = {};

            if (req.query.idTurnoCaja !== undefined) {
                filtros.idTurnoCaja = Number(req.query.idTurnoCaja);
                if (Number.isNaN(filtros.idTurnoCaja)) {
                    res.status(400).json({ mensaje: "El idTurnoCaja debe ser un numero" });
                    return;
                }
            }
            if (req.query.idFactura !== undefined) {
                filtros.idFactura = Number(req.query.idFactura);
                if (Number.isNaN(filtros.idFactura)) {
                    res.status(400).json({ mensaje: "El idFactura debe ser un numero" });
                    return;
                }
            }

            const registros = await historialCajaServicio.listar(filtros);
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
            const registro = await historialCajaServicio.obtenerPorId(id);
            res.status(200).json(registro);
        } catch (error: any) {
            res.status(404).json({ mensaje: error.message });
        }
    }

    async crear(req: Request, res: Response): Promise<void> {
        try {
            const nuevoRegistro = await historialCajaServicio.crear(req.body);
            res.status(201).json(nuevoRegistro);
        } catch (error: any) {
            res.status(400).json({ mensaje: error.message });
        }
    }
}