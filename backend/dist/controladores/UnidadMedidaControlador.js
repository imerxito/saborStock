import { UnidadMedidaServicio } from '../servicios/UnidadMedidaServicio.js';
const unidadMedidaServicio = new UnidadMedidaServicio();
export class UnidadMedidaControlador {
    async listar(req, res) {
        try {
            const unidades = await unidadMedidaServicio.listar();
            res.status(200).json(unidades);
        }
        catch (error) {
            res.status(500).json({ mensaje: error.message });
        }
    }
    async obtenerPorId(req, res) {
        try {
            const unidad = await unidadMedidaServicio.obtenerPorId(req.params.id);
            res.status(200).json(unidad);
        }
        catch (error) {
            res.status(404).json({ mensaje: error.message });
        }
    }
    async crear(req, res) {
        try {
            const nuevaUnidad = await unidadMedidaServicio.crear(req.body);
            res.status(201).json(nuevaUnidad);
        }
        catch (error) {
            res.status(400).json({ mensaje: error.message });
        }
    }
    async actualizar(req, res) {
        try {
            const unidadActualizada = await unidadMedidaServicio.actualizar(req.params.id, req.body);
            res.status(200).json(unidadActualizada);
        }
        catch (error) {
            res.status(400).json({ mensaje: error.message });
        }
    }
    async activar(req, res) {
        try {
            await unidadMedidaServicio.activar(req.params.id);
            res.status(200).json({ mensaje: "unidad de medida activada correctamente" });
        }
        catch (error) {
            res.status(404).json({ mensaje: error.message });
        }
    }
    async desactivar(req, res) {
        try {
            await unidadMedidaServicio.desactivar(req.params.id);
            res.status(200).json({ mensaje: "unidad de medida desactivada correctamente" });
        }
        catch (error) {
            res.status(404).json({ mensaje: error.message });
        }
    }
}
