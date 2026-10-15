import { Request, Response } from "express";
import { RecetaServicio } from "../servicios/RecetaServicio.js";

const recetaServicio = new RecetaServicio();

export class RecetaControlador {

    async listar(req: Request, res: Response): Promise<void> {
        try {
            const recetas = await recetaServicio.listar();

            res.status(200).json(recetas);
        } catch (error: any) {
            res.status(500).json({ mensaje: error.message });
        }
    }

    async listarPorProducto(
        req: Request<{ idProducto: string }>,
        res: Response
    ): Promise<void> {
        try {
            const idProducto = Number(req.params.idProducto);

            const recetas =
                await recetaServicio.listarPorProducto(idProducto);

            res.status(200).json(recetas);
        } catch (error: any) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al listar las recetas del producto";

            const codigo = mensaje.includes(
                "Error al listar recetas del producto"
            ) ? 500 : 400;

            res.status(codigo).json({ mensaje });
        }
    }

    async obtenerPorId(
        req: Request<{
            idProducto: string;
            idIngrediente: string;
        }>,
        res: Response
    ): Promise<void> {
        try {
            const idProducto = Number(req.params.idProducto);
            const idIngrediente = Number(req.params.idIngrediente);

            const receta = await recetaServicio.obtenerPorId(
                idProducto,
                idIngrediente
            );

            res.status(200).json(receta);
        } catch (error: any) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al obtener la receta";

            const noEncontrado = mensaje === "La receta no existe";

            const codigo = noEncontrado
                ? 404
                : mensaje.includes("Error al obtener receta")
                    ? 500
                    : 400;

            res.status(codigo).json({ mensaje });
        }
    }

    async crear(req: Request, res: Response): Promise<void> {
        try {
            const nuevaReceta = await recetaServicio.crear(req.body);

            res.status(201).json(nuevaReceta);
        } catch (error: any) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al crear la receta";

            const codigo = mensaje.includes("Error al crear receta")
                ? 500
                : 400;

            res.status(codigo).json({ mensaje });
        }
    }

    async actualizar(
        req: Request<{
            idProducto: string;
            idIngrediente: string;
        }>,
        res: Response
    ): Promise<void> {
        try {
            const idProducto = Number(req.params.idProducto);
            const idIngrediente = Number(req.params.idIngrediente);

            await recetaServicio.actualizar(
                idProducto,
                idIngrediente,
                req.body
            );

            const recetaActualizada =
                await recetaServicio.obtenerPorId(
                    idProducto,
                    idIngrediente
                );

            res.status(200).json(recetaActualizada);
        } catch (error: any) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al actualizar la receta";

            const noEncontrado = mensaje === "La receta no existe";

            const codigo = noEncontrado
                ? 404
                : mensaje.includes("Error al actualizar receta") ||
                  mensaje.includes("Error al obtener receta")
                    ? 500
                    : 400;

            res.status(codigo).json({ mensaje });
        }
    }

    async eliminar(
        req: Request<{
            idProducto: string;
            idIngrediente: string;
        }>,
        res: Response
    ): Promise<void> {
        try {
            const idProducto = Number(req.params.idProducto);
            const idIngrediente = Number(req.params.idIngrediente);

            await recetaServicio.eliminar(
                idProducto,
                idIngrediente
            );

            res.status(200).json({
                mensaje: "Receta eliminada correctamente"
            });
        } catch (error: any) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al eliminar la receta";

            const noEncontrado = mensaje === "La receta no existe";

            const codigo = noEncontrado
                ? 404
                : mensaje.includes("Error al eliminar receta") ||
                  mensaje.includes("Error al obtener receta")
                    ? 500
                    : 400;

            res.status(codigo).json({ mensaje });
        }
    }
}