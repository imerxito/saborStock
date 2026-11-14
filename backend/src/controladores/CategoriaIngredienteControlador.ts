import { Request, Response } from "express";
import { CategoriaIngredienteServicio } from "../servicios/CategoriaIngredienteServicio.js";

const servicio = new CategoriaIngredienteServicio();

export class CategoriaIngredienteControlador {
    async listar(_req: Request, res: Response): Promise<void> {
        try {
            res.status(200).json(await servicio.listar());
        } catch (error: any) {
            res.status(500).json({ mensaje: error.message });
        }
    }

    async obtenerPorId(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0) {
                res.status(400).json({ mensaje: "ID inválido" });
                return;
            }
            res.status(200).json(await servicio.obtenerPorId(id));
        } catch (error: any) {
            const mensaje = error instanceof Error ? error.message : "Error al obtener la categoría";
            res.status(mensaje === "La categoría de insumo no existe" ? 404 : 500).json({ mensaje });
        }
    }

    async crear(req: Request, res: Response): Promise<void> {
        try {
            res.status(201).json(await servicio.crear(req.body));
        } catch (error: any) {
            const mensaje = error instanceof Error ? error.message : "Error al crear la categoría";
            const codigo = mensaje.includes("Ya existe") || mensaje === "El nombre es obligatorio" ? 400 : 500;
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
            const mensaje = error instanceof Error ? error.message : "Error al actualizar la categoría";
            const codigo = mensaje === "La categoría de insumo no existe" ? 404 : mensaje.includes("vacío") || mensaje.includes("Ya existe") ? 400 : 500;
            res.status(codigo).json({ mensaje });
        }
    }

    async activar(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0) {
                res.status(400).json({ mensaje: "ID inválido" });
                return;
            }
            await servicio.activar(id);
            res.status(200).json({ mensaje: "Categoría activada" });
        } catch (error: any) {
            const mensaje = error instanceof Error ? error.message : "Error al activar la categoría";
            res.status(mensaje === "La categoría de insumo no existe" ? 404 : 500).json({ mensaje });
        }
    }

    async desactivar(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0) {
                res.status(400).json({ mensaje: "ID inválido" });
                return;
            }
            await servicio.desactivar(id);
            res.status(200).json({ mensaje: "Categoría desactivada" });
        } catch (error: any) {
            const mensaje = error instanceof Error ? error.message : "Error al desactivar la categoría";
            res.status(mensaje === "La categoría de insumo no existe" ? 404 : 500).json({ mensaje });
        }
    }
}
