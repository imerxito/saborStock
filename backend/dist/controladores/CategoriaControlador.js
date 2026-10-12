import { CategoriaServicio } from "../servicios/CategoriaServicio.js";
const servicio = new CategoriaServicio();
export class CategoriaControlador {
    async listar(req, res) {
        try {
            const categorias = await servicio.listar();
            res.status(200).json(categorias);
        }
        catch (error) {
            res.status(500).json({ mensaje: error.message });
        }
    }
    async obtenerPorId(req, res) {
        try {
            const categoria = await servicio.obtenerPorId(req.params.id);
            res.status(200).json(categoria);
        }
        catch (error) {
            res.status(404).json({ mensaje: error.message });
        }
    }
    async crear(req, res) {
        try {
            const nuevaCategoria = await servicio.crear(req.body);
            res.status(201).json(nuevaCategoria);
        }
        catch (error) {
            res.status(400).json({ mensaje: error.message });
        }
    }
    async actualizar(req, res) {
        try {
            const categoriaActualizada = await servicio.actualizar(req.params.id, req.body);
            res.status(200).json(categoriaActualizada);
        }
        catch (error) {
            res.status(400).json({ mensaje: error.message });
        }
    }
    async eliminar(req, res) {
        try {
            await servicio.eliminar(req.params.id);
            res.status(200).json({ mensaje: "categoria eliminada correctamente" });
        }
        catch (error) {
            res.status(404).json({ mensaje: error.message });
        }
    }
    async activar(req, res) {
        try {
            await servicio.activar(req.params.id);
            res.status(200).json({ mensaje: "categoria activada correctamente" });
        }
        catch (error) {
            res.status(404).json({ mensaje: error.message });
        }
    }
    async desactivar(req, res) {
        try {
            await servicio.desactivar(req.params.id);
            res.status(200).json({ mensaje: "categoria desactivada correctamente" });
        }
        catch (error) {
            res.status(404).json({ mensaje: error.message });
        }
    }
}
