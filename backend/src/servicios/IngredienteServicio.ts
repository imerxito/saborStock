import {
    Ingrediente,
    CrearIngrediente,
    ActualizarIngrediente
} from "../modelos/Ingrediente.js";

import { IngredienteRepositorio } from "../persistencia/IngredienteRepositorio.js";

export class IngredienteServicio {
    private ingredienteRepositorio: IngredienteRepositorio;

    constructor() {
        this.ingredienteRepositorio = new IngredienteRepositorio();
    }

    async listar(): Promise<Ingrediente[]> {
        return await this.ingredienteRepositorio.listar();
    }

    async obtenerPorId(id: number): Promise<Ingrediente> {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("El ID del ingrediente debe ser un número entero positivo");
        }

        const ingrediente = await this.ingredienteRepositorio.obtenerPorId(id);

        if (!ingrediente) {
            throw new Error("El ingrediente no existe");
        }

        return ingrediente;
    }

    async crear(datos: CrearIngrediente): Promise<Ingrediente> {
        if (!datos.codigo || datos.codigo.trim() === "") {
            throw new Error("El código del ingrediente es obligatorio");
        }

        if (!datos.nombre || datos.nombre.trim() === "") {
            throw new Error("El nombre del ingrediente es obligatorio");
        }

        if (!Number.isInteger(datos.id_unidad) || datos.id_unidad <= 0) {
            throw new Error("La unidad de medida debe ser un número entero positivo");
        }

        if (
            datos.stock !== undefined &&
            (!Number.isFinite(datos.stock) || datos.stock < 0)
        ) {
            throw new Error("El stock debe ser un número mayor o igual a cero");
        }

        if (
            datos.stock_minimo !== undefined &&
            (!Number.isFinite(datos.stock_minimo) || datos.stock_minimo < 0)
        ) {
            throw new Error("El stock mínimo debe ser un número mayor o igual a cero");
        }

        if (
            datos.precio_referencia !== undefined &&
            (!Number.isFinite(datos.precio_referencia) || datos.precio_referencia < 0)
        ) {
            throw new Error("El precio de referencia debe ser mayor o igual a cero");
        }

        const datosLimpios: CrearIngrediente = {
            ...datos,
            codigo: datos.codigo.trim(),
            nombre: datos.nombre.trim()
        };

        return await this.ingredienteRepositorio.crear(datosLimpios);
    }

    async actualizar(
        id: number,
        cambios: ActualizarIngrediente
    ): Promise<void> {
        await this.obtenerPorId(id);

        if (Object.keys(cambios).length === 0) {
            throw new Error("Debe enviar al menos un dato para actualizar");
        }

        if (
            cambios.codigo !== undefined &&
            cambios.codigo.trim() === ""
        ) {
            throw new Error("El código del ingrediente no puede estar vacío");
        }

        if (
            cambios.nombre !== undefined &&
            cambios.nombre.trim() === ""
        ) {
            throw new Error("El nombre del ingrediente no puede estar vacío");
        }

        if (
            cambios.id_unidad !== undefined &&
            (!Number.isInteger(cambios.id_unidad) || cambios.id_unidad <= 0)
        ) {
            throw new Error("La unidad de medida debe ser un número entero positivo");
        }

        if (
            cambios.stock !== undefined &&
            (!Number.isFinite(cambios.stock) || cambios.stock < 0)
        ) {
            throw new Error("El stock debe ser un número mayor o igual a cero");
        }

        if (
            cambios.stock_minimo !== undefined &&
            (!Number.isFinite(cambios.stock_minimo) || cambios.stock_minimo < 0)
        ) {
            throw new Error("El stock mínimo debe ser un número mayor o igual a cero");
        }

        if (
            cambios.precio_referencia !== undefined &&
            (!Number.isFinite(cambios.precio_referencia) || cambios.precio_referencia < 0)
        ) {
            throw new Error("El precio de referencia debe ser mayor o igual a cero");
        }

        const cambiosLimpios: ActualizarIngrediente = {
            ...cambios,
            ...(cambios.codigo !== undefined
                ? { codigo: cambios.codigo.trim() }
                : {}),
            ...(cambios.nombre !== undefined
                ? { nombre: cambios.nombre.trim() }
                : {})
        };

        await this.ingredienteRepositorio.actualizar(id, cambiosLimpios);
    }

    // Desactiva un ingrediente sin eliminarlo de la base de datos
    async desactivar(id: number): Promise<void> {
        const ingrediente = await this.obtenerPorId(id);

        if (!ingrediente.activo) {
            throw new Error("El ingrediente ya está inactivo");
        }

        await this.ingredienteRepositorio.desactivar(id);
    }
}