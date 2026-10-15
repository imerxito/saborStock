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

    async crear(datos: CrearReceta): Promise<Receta> {
        this.validarIdentificadores(
            datos.id_producto,
            datos.id_ingrediente
        );

        this.validarCantidad(datos.cantidad);

        return await this.recetaRepositorio.crear(datos);
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