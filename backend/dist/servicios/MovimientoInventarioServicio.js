import { MovimientoInventarioRepositorio } from "../persistencia/MovimientoInventarioRepositorio.js";
import { IngredienteRepositorio } from "../persistencia/IngredienteRepositorio.js";
export class MovimientoInventarioServicio {
    movimientoRepositorio;
    ingredienteRepositorio;
    constructor() {
        this.movimientoRepositorio = new MovimientoInventarioRepositorio();
        this.ingredienteRepositorio = new IngredienteRepositorio();
    }
    async listar() {
        return await this.movimientoRepositorio.listar();
    }
    async obtenerPorId(id) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("El ID del movimiento debe ser un número entero positivo");
        }
        const movimiento = await this.movimientoRepositorio.obtenerPorId(id);
        if (!movimiento) {
            throw new Error("El movimiento de inventario no existe");
        }
        return movimiento;
    }
    async listarPorIngrediente(idIngrediente) {
        if (!Number.isInteger(idIngrediente) || idIngrediente <= 0) {
            throw new Error("El ID del ingrediente debe ser un número entero positivo");
        }
        const ingrediente = await this.ingredienteRepositorio.obtenerPorId(idIngrediente);
        if (!ingrediente) {
            throw new Error("El ingrediente no existe");
        }
        return await this.movimientoRepositorio.listarPorIngrediente(idIngrediente);
    }
    async crear(datos) {
        if (!Number.isInteger(datos.id_ingrediente) || datos.id_ingrediente <= 0) {
            throw new Error("El ID del ingrediente debe ser un número entero positivo");
        }
        if (datos.tipo !== "ENTRADA" && datos.tipo !== "SALIDA") {
            throw new Error("Por ahora, el tipo de movimiento debe ser ENTRADA o SALIDA");
        }
        if (!Number.isFinite(datos.cantidad) || datos.cantidad <= 0) {
            throw new Error("La cantidad debe ser mayor que cero");
        }
        if (!datos.motivo || datos.motivo.trim() === "") {
            throw new Error("El motivo del movimiento es obligatorio");
        }
        if (datos.motivo.trim().length > 200) {
            throw new Error("El motivo no puede superar los 200 caracteres");
        }
        // El repositorio llama a la función SQL transaccional
        // esta funcion valida el ingrediente, registra el movimiento
        // y actualiza el stock
        return await this.movimientoRepositorio.registrarMovimiento({
            id_ingrediente: datos.id_ingrediente,
            tipo: datos.tipo,
            cantidad: datos.cantidad,
            motivo: datos.motivo.trim(),
            fecha: datos.fecha
        });
    }
}
