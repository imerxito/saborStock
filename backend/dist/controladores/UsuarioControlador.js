import { UsuarioServicio } from "../servicios/UsuarioServicio.js";
const usuarioServicio = new UsuarioServicio();
export class UsuarioControlador {
    async listar(req, res) {
        try {
            const usuarios = await usuarioServicio.listar();
            res.status(200).json(usuarios);
        }
        catch (error) {
            res.status(500).json({ mensaje: error.message });
        }
    }
    async obtenerPorId(req, res) {
        try {
            const usuario = await usuarioServicio.obtenerPorId(req.params.id);
            res.status(200).json(usuario);
        }
        catch (error) {
            res.status(404).json({ mensaje: error.message });
        }
    }
    async obtenerPorCerdula(req, res) {
        try {
            const usuario = await usuarioServicio.obtenerPorCedula(req.params.cedula);
            res.status(200).json(usuario);
        }
        catch (error) {
            res.status(404).json({ mensaje: error.message });
        }
    }
    async crear(req, res) {
        try {
            const nuevoUsuario = await usuarioServicio.crear(req.body);
            res.status(201).json(nuevoUsuario);
        }
        catch (error) {
            res.status(400).json({ mensaje: error.message });
        }
    }
    async actualizar(req, res) {
        try {
            const usuarioActualizado = await usuarioServicio.actualizar(req.params.id, req.body);
            res.status(200).json(usuarioActualizado);
        }
        catch (error) {
            res.status(400).json({ mensaje: error.message });
        }
    }
    async desactivar(req, res) {
        try {
            const usuario = await usuarioServicio.desactivar(req.params.id);
            res.status(200).json(usuario);
        }
        catch (error) {
            res.status(400).json({ mensaje: error.message });
        }
    }
    async activar(req, res) {
        try {
            const usuario = await usuarioServicio.activar(req.params.id);
            res.status(200).json(usuario);
        }
        catch (error) {
            res.status(400).json({ mensaje: error.message });
        }
    }
}
