import { Request, Response } from "express";
import { ComponenteComboServicio } from "../servicios/ComponenteComboServicio.js";

const servicio = new ComponenteComboServicio();

export class ComponenteComboControlador {
    async listarPorCombo(req: Request<{ idCombo: string }>, res: Response): Promise<void> {
        try {
            const idCombo = Number(req.params.idCombo);
            if (!Number.isInteger(idCombo) || idCombo <= 0) {
                res.status(400).json({ mensaje: "ID de combo inválido" });
                return;
            }
            res.status(200).json(await servicio.listarPorCombo(idCombo));
        } catch (error: any) {
            res.status(500).json({ mensaje: error.message });
        }
    }

    async listarTodos(_req: Request, res: Response): Promise<void> {
        try {
            res.status(200).json(await servicio.listarTodos());
        } catch (error: any) {
            res.status(500).json({ mensaje: error.message });
        }
    }

    async crear(req: Request, res: Response): Promise<void> {
        try {
            res.status(201).json(await servicio.crear(req.body));
        } catch (error: any) {
            const mensaje = error instanceof Error ? error.message : "Error al crear el componente";
            const codigo = mensaje.includes("obligatorio") || mensaje.includes("mayor a 0") ? 400 : 500;
            res.status(codigo).json({ mensaje });
        }
    }

    async actualizar(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0) {
                res.status(400).json({ mensaje: "ID inválido" });
                return;
            }
            res.status(200).json(await servicio.actualizar(id, req.body));
        } catch (error: any) {
            const mensaje = error instanceof Error ? error.message : "Error al actualizar el componente";
            const codigo = mensaje === "El componente de combo no existe" ? 404 : mensaje.includes("mayor a 0") ? 400 : 500;
            res.status(codigo).json({ mensaje });
        }
    }

    async eliminarPorCombo(req: Request<{ idCombo: string }>, res: Response): Promise<void> {
        try {
            const idCombo = Number(req.params.idCombo);
            if (!Number.isInteger(idCombo) || idCombo <= 0) {
                res.status(400).json({ mensaje: "ID de combo inválido" });
                return;
            }
            await servicio.eliminarPorCombo(idCombo);
            res.status(200).json({ mensaje: "Componentes del combo eliminados" });
        } catch (error: any) {
            res.status(500).json({ mensaje: error.message });
        }
    }

    async eliminar(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0) {
                res.status(400).json({ mensaje: "ID inválido" });
                return;
            }
            await servicio.eliminar(id);
            res.status(200).json({ mensaje: "Componente eliminado" });
        } catch (error: any) {
            res.status(500).json({ mensaje: error.message });
        }
    }
}
