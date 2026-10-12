import { IngredienteServicio } from "../servicios/IngredienteServicio.js";
const ingredienteServicio = new IngredienteServicio();
export class IngredienteControlador {
    async listar(req, res) {
        try {
            const ingredientes = await ingredienteServicio.listar();
            res.status(200).json(ingredientes);
        }
        catch (error) {
            res.status(500).json({ mensaje: error.message });
        }
    }
    async obtenerPorId(req, res) {
        try {
            const id = Number(req.params.id);
            const ingrediente = await ingredienteServicio.obtenerPorId(id);
            res.status(200).json(ingrediente);
        }
        catch (error) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al obtener el ingrediente";
            const noEncontrado = mensaje === "El ingrediente no existe";
            const codigo = noEncontrado
                ? 404
                : mensaje.includes("Error al obtener ingrediente")
                    ? 500
                    : 400;
            res.status(codigo).json({ mensaje });
        }
    }
    async crear(req, res) {
        try {
            const nuevoIngrediente = await ingredienteServicio.crear(req.body);
            res.status(201).json(nuevoIngrediente);
        }
        catch (error) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al crear el ingrediente";
            const codigo = mensaje.includes("Error al crear ingrediente")
                ? 500
                : 400;
            res.status(codigo).json({ mensaje });
        }
    }
    async actualizar(req, res) {
        try {
            const id = Number(req.params.id);
            await ingredienteServicio.actualizar(id, req.body);
            const ingredienteActualizado = await ingredienteServicio.obtenerPorId(id);
            res.status(200).json(ingredienteActualizado);
        }
        catch (error) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al actualizar el ingrediente";
            const noEncontrado = mensaje === "El ingrediente no existe";
            const codigo = noEncontrado
                ? 404
                : mensaje.includes("Error al actualizar ingrediente")
                    ? 500
                    : 400;
            res.status(codigo).json({ mensaje });
        }
    }
    // Desactiva un ingrediente
    async desactivar(req, res) {
        try {
            const id = Number(req.params.id);
            await ingredienteServicio.desactivar(id);
            res.status(200).json({
                mensaje: "Ingrediente desactivado correctamente"
            });
        }
        catch (error) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al desactivar el ingrediente";
            const noEncontrado = mensaje === "El ingrediente no existe";
            const codigo = noEncontrado
                ? 404
                : mensaje.includes("Error al obtener ingrediente") ||
                    mensaje.includes("Error al actualizar ingrediente")
                    ? 500
                    : 400;
            res.status(codigo).json({ mensaje });
        }
    }
}
