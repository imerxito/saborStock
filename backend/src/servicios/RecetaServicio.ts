import {
    Receta,
    CrearReceta,
    ActualizarReceta
} from "../modelos/Receta.js";

import { RecetaRepositorio } from "../persistencia/RecetaRepositorio.js";

export class RecetaServicio {
    private recetaRepositorio: RecetaRepositorio;

    constructor() {
        this.recetaRepositorio = new RecetaRepositorio();
    }

    async listar(): Promise<Receta[]> {
        return await this.recetaRepositorio.listar();
    }

    async listarPorProducto(idProducto: number): Promise<Receta[]> {
        if (!Number.isInteger(idProducto) || idProducto <= 0) {
            throw new Error("El ID del producto debe ser un número entero positivo");
        }

        return await this.recetaRepositorio.listarPorProducto(idProducto);
    }

    async obtenerPorId(
        idProducto: number,
        idIngrediente: number
    ): Promise<Receta> {
        this.validarIdentificadores(idProducto, idIngrediente);

        const receta = await this.recetaRepositorio.obtenerPorId(
            idProducto,
            idIngrediente
        );

        if (!receta) {
            throw new Error("La receta no existe");
        }

        return receta;
    }

    async crear(datos: CrearReceta & { idProducto?: number; idIngrediente?: number }): Promise<Receta> {
        const id_producto = Number(datos.id_producto ?? datos.idProducto);
        const id_ingrediente = Number(datos.id_ingrediente ?? datos.idIngrediente);
        const cantidad = Number(datos.cantidad);

        this.validarIdentificadores(id_producto, id_ingrediente);
        this.validarCantidad(cantidad);

        const existente = await this.recetaRepositorio.obtenerPorId(id_producto, id_ingrediente);
        if (existente) {
            await this.recetaRepositorio.actualizar(id_producto, id_ingrediente, { cantidad });
            return { id_producto, id_ingrediente, cantidad };
        }

        return await this.recetaRepositorio.crear({ id_producto, id_ingrediente, cantidad });
    }

    async actualizar(
        idProducto: number,
        idIngrediente: number,
        cambios: ActualizarReceta
    ): Promise<void> {
        await this.obtenerPorId(idProducto, idIngrediente);

        if (Object.keys(cambios).length === 0) {
            throw new Error(
                "Debe enviar al menos un dato para actualizar"
            );
        }

        if (cambios.cantidad !== undefined) {
            this.validarCantidad(cambios.cantidad);
        }

        await this.recetaRepositorio.actualizar(
            idProducto,
            idIngrediente,
            cambios
        );
    }

    async eliminar(
        idProducto: number,
        idIngrediente: number
    ): Promise<void> {
        await this.obtenerPorId(idProducto, idIngrediente);

        await this.recetaRepositorio.eliminar(
            idProducto,
            idIngrediente
        );
    }

    private validarIdentificadores(
        idProducto: number,
        idIngrediente: number
    ): void {
        if (!Number.isInteger(idProducto) || idProducto <= 0) {
            throw new Error(
                "El ID del producto debe ser un número entero positivo"
            );
        }

        if (!Number.isInteger(idIngrediente) || idIngrediente <= 0) {
            throw new Error(
                "El ID del ingrediente debe ser un número entero positivo"
            );
        }
    }

    private validarCantidad(cantidad: number): void {
        if (
            typeof cantidad !== "number" ||
            !Number.isFinite(cantidad) ||
            cantidad <= 0
        ) {
            throw new Error(
                "La cantidad debe ser un número mayor que cero"
            );
        }
    }
}