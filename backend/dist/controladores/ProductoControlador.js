import { ProductoServicio } from "../servicios/ProductoServicio.js";
const productoServicio = new ProductoServicio();
export class ProductoControlador {
    async listar(req, res) {
        try {
            const productos = await productoServicio.listar();
            res.status(200).json(productos);
        }
        catch (error) {
            res.status(500).json({ mensaje: error.message });
        }
    }
    async obtenerPorId(req, res) {
        try {
            const id = Number(req.params.id);
            const producto = await productoServicio.obtenerPorId(id);
            res.status(200).json(producto);
        }
        catch (error) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al obtener el producto";
            const noEncontrado = mensaje === "El producto no existe";
            res.status(noEncontrado ? 404 : 400).json({
                mensaje
            });
        }
    }
    async crear(req, res) {
        try {
            const nuevoProducto = await productoServicio.crear(req.body);
            res.status(201).json(nuevoProducto);
        }
        catch (error) {
            res.status(400).json({
                mensaje: error instanceof Error
                    ? error.message
                    : "Error al crear el producto"
            });
        }
    }
    async actualizar(req, res) {
        try {
            const id = Number(req.params.id);
            await productoServicio.actualizar(id, req.body);
            const productoActualizado = await productoServicio.obtenerPorId(id);
            res.status(200).json(productoActualizado);
        }
        catch (error) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al actualizar el producto";
            const noEncontrado = mensaje === "El producto no existe";
            res.status(noEncontrado ? 404 : 400).json({
                mensaje
            });
        }
    }
    async desactivar(req, res) {
        try {
            const id = Number(req.params.id);
            await productoServicio.desactivar(id);
            res.status(200).json({
                mensaje: "Producto desactivado correctamente"
            });
        }
        catch (error) {
            const mensaje = error instanceof Error
                ? error.message
                : "Error al desactivar el producto";
            const noEncontrado = mensaje === "El producto no existe";
            res.status(noEncontrado ? 404 : 400).json({
                mensaje
            });
        }
    }
}
