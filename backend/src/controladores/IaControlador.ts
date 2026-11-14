import { Request, Response } from "express";
import { IaServicio, FilaExcelIA } from "../servicios/IaServicio.js";

const iaServicio = new IaServicio();

export class IaControlador {
    async chat(req: Request, res: Response): Promise<void> {
        try {
            const { mensaje, conversacionId, idUsuario } = req.body || {};
            const resultado = await iaServicio.chat(String(mensaje || ""), {
                conversacionId: conversacionId != null ? Number(conversacionId) : null,
                idUsuario: idUsuario != null ? Number(idUsuario) : null,
            });
            res.status(200).json(resultado);
        } catch (error: any) {
            res.status(400).json({ mensaje: error?.message || "No se pudo procesar el mensaje" });
        }
    }

    async listarConversaciones(req: Request, res: Response): Promise<void> {
        try {
            const idUsuario = req.query.idUsuario != null ? Number(req.query.idUsuario) : null;
            const conversaciones = await iaServicio.listarConversaciones(idUsuario);
            res.status(200).json(conversaciones);
        } catch (error: any) {
            res.status(500).json({ mensaje: error?.message || "No se pudieron listar las conversaciones" });
        }
    }

    async obtenerConversacion(req: Request, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                res.status(400).json({ mensaje: "El id debe ser un numero" });
                return;
            }
            const resultado = await iaServicio.obtenerConversacion(id);
            res.status(200).json(resultado);
        } catch (error: any) {
            res.status(404).json({ mensaje: error?.message || "Conversación no encontrada" });
        }
    }

    async eliminarConversacion(req: Request, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                res.status(400).json({ mensaje: "El id debe ser un numero" });
                return;
            }
            await iaServicio.eliminarConversacion(id);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({ mensaje: error?.message || "No se pudo eliminar la conversación" });
        }
    }

    async procesarExcel(req: Request, res: Response): Promise<void> {
        try {
            const resultado = await iaServicio.procesarExcel(req.body || {});
            res.status(200).json(resultado);
        } catch (error: any) {
            res.status(400).json({ mensaje: error?.message || "No se pudo procesar el archivo" });
        }
    }

    async confirmarExcel(req: Request, res: Response): Promise<void> {
        try {
            const filas = Array.isArray(req.body?.filas) ? (req.body.filas as FilaExcelIA[]) : [];
            const resultado = await iaServicio.confirmarExcel(filas);
            res.status(200).json(resultado);
        } catch (error: any) {
            res.status(400).json({ mensaje: error?.message || "No se pudieron guardar los registros" });
        }
    }
}
