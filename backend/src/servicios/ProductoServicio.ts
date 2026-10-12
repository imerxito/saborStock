
import {
    Producto,
    CrearProducto,
    ActualizarProducto
} from "../modelos/Producto.js";

import { ProductoRepositorio } from "../persistencia/ProductoRepositorio.js";

export class ProductoServicio {
    private repositorio: ProductoRepositorio;

    constructor() {
        this.repositorio = new ProductoRepositorio();
    }

    // Listar todos los productos
    async listar(): Promise<Producto[]> {
        return await this.repositorio.listar();
    }

    // Buscar un producto por su ID.
    async obtenerPorId(id: number): Promise<Producto> {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("El ID del producto no es válido");
        }

        const producto = await this.repositorio.obtenerPorId(id);

        if (!producto) {
            throw new Error("El producto no existe");
        }

        return producto;
    }

    // Registrar un producto nuevo.
    async crear(datos: CrearProducto): Promise<Producto> {
        if (datos.codigo.trim() === "") throw new Error("El código del producto no puede estar vacío");

        if (datos.nombre.trim() === "") {
            throw new Error("El nombre del producto es obligatorio");
        }

        if (!Number.isInteger(datos.id_categoria) || datos.id_categoria <= 0) {
            throw new Error("La categoría del producto no es válida");
        }

        if (
            typeof datos.precio_venta !== "number" ||
            !Number.isFinite(datos.precio_venta) ||
            datos.precio_venta < 0
        ) {
            throw new Error("El precio de venta debe ser un número mayor o igual a cero");
        }

        return await this.repositorio.crear({
            ...datos,
            codigo: datos.codigo.trim(),
            nombre: datos.nombre.trim(),
            descripcion: datos.descripcion?.trim() || "",
        });
    }

    // Actualizar un producto existente.
    async actualizar(
        id: number,
        cambios: ActualizarProducto
    ): Promise<void> {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("El ID del producto no es válido");
        }

        const producto = await this.repositorio.obtenerPorId(id);

        if (!producto) {
            throw new Error("El producto no existe");
        }

        if (cambios.codigo !== undefined && !cambios.codigo.trim()) {
            throw new Error("El código del producto no puede estar vacío");
        }

        if (cambios.nombre !== undefined && !cambios.nombre.trim()) {
            throw new Error("El nombre del producto no puede estar vacío");
        }

        if (
            cambios.id_categoria !== undefined &&
            (!Number.isInteger(cambios.id_categoria) || cambios.id_categoria <= 0)
        ) {
            throw new Error("La categoría del producto no es válida");
        }

        if (
            cambios.precio_venta !== undefined &&
            (
                typeof cambios.precio_venta !== "number" ||
                !Number.isFinite(cambios.precio_venta) ||
                cambios.precio_venta < 0
            )
        ) {
            throw new Error("El precio de venta debe ser un número mayor o igual a cero");
        }

        const datosLimpios: ActualizarProducto = { ...cambios };

        if (datosLimpios.codigo !== undefined) {
            datosLimpios.codigo = datosLimpios.codigo.trim();
        }

        if (datosLimpios.nombre !== undefined) {
            datosLimpios.nombre = datosLimpios.nombre.trim();
        }

        if (datosLimpios.descripcion !== undefined) {
            datosLimpios.descripcion = datosLimpios.descripcion.trim();
        }

        await this.repositorio.actualizar(id, datosLimpios);
    }

    // Desactiva sin eliminar
    async desactivar(id: number): Promise<void> {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("El ID del producto no es válido");
        }

        const producto = await this.repositorio.obtenerPorId(id);

        if (!producto) {
            throw new Error("El producto no existe");
        }

        if (!producto.activo) {
            throw new Error("El producto ya está desactivado");
        }

        await this.repositorio.desactivar(id);
    }
}
