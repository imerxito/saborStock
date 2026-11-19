import { supabase } from "../configuracion/Supabase.js";
import { ProductoRepositorio } from "../persistencia/ProductoRepositorio.js";
import { RecetaRepositorio } from "../persistencia/RecetaRepositorio.js";
import { ComponenteComboRepositorio } from "../persistencia/ComponenteComboRepositorio.js";
import { IngredienteRepositorio } from "../persistencia/IngredienteRepositorio.js";
import { Producto } from "../modelos/Producto.js";

export interface ItemVenta {
    idProducto: number;
    cantidad: number;
}

export class InventarioServicio {
    private productoRepo = new ProductoRepositorio();
    private recetaRepo = new RecetaRepositorio();
    private componenteRepo = new ComponenteComboRepositorio();
    private ingredienteRepo = new IngredienteRepositorio();

    // Expande productos vendidos a la cantidad de insumos necesarios.
    // cocina/directo -> receta; paquete -> componentes (recursivo).
    async calcularConsumo(items: ItemVenta[]): Promise<Map<number, number>> {
        const consumo = new Map<number, number>();
        const visitados = new Set<number>();

        for (const item of items) {
            if (!Number.isInteger(item.idProducto) || item.idProducto <= 0) {
                throw new Error("El id del producto no es válido");
            }
            if (!Number.isFinite(item.cantidad) || item.cantidad <= 0) {
                throw new Error("La cantidad vendida debe ser mayor a 0");
            }
        }

        await Promise.all(
            items.map((item) => this.acumularProducto(item.idProducto, item.cantidad, consumo, visitados))
        );

        return consumo;
    }

    async descontarPorVenta(items: ItemVenta[], motivo: string): Promise<void> {
        const consumo = await this.calcularConsumo(items);
        if (consumo.size === 0) return;

        await this.validarStock(consumo);

        const payload = Array.from(consumo.entries()).map(([id_ingrediente, cantidad]) => ({
            id_ingrediente,
            cantidad
        }));

        const { error } = await supabase.rpc("descontar_insumos_venta", {
            p_items: payload,
            p_motivo: motivo.slice(0, 200)
        });

        if (error) {
            throw new Error(`Error al descontar inventario: ${error.message}`);
        }
    }

    async ingresarPorCompra(items: Array<{ idIngrediente: number; cantidad: number }>, motivo: string): Promise<void> {
        const validos = items.filter((i) => Number.isInteger(i.idIngrediente) && i.idIngrediente > 0 && Number.isFinite(i.cantidad) && i.cantidad > 0);
        if (validos.length === 0) return;

        const payload = validos.map((i) => ({
            id_ingrediente: i.idIngrediente,
            cantidad: i.cantidad
        }));

        const { error } = await supabase.rpc("ingresar_insumos_compra", {
            p_items: payload,
            p_motivo: motivo.slice(0, 200)
        });

        if (error) {
            throw new Error(`Error al ingresar inventario: ${error.message}`);
        }
    }

    private async acumularProducto(
        idProducto: number,
        cantidad: number,
        consumo: Map<number, number>,
        visitados: Set<number>
    ): Promise<void> {
        if (visitados.has(idProducto)) {
            throw new Error(`El combo contiene un ciclo en el producto ${idProducto}`);
        }

        const producto = await this.productoRepo.obtenerPorId(idProducto);
        if (!producto) {
            throw new Error(`El producto ${idProducto} no existe`);
        }
        if (!producto.activo) {
            throw new Error(`El producto ${producto.nombre} está inactivo`);
        }

        const componentes = await this.componenteRepo.listarPorCombo(idProducto);
        if (componentes.length > 0) {
            visitados.add(idProducto);
            for (const componente of componentes) {
                await this.acumularProducto(
                    componente.id_producto_hijo,
                    cantidad * Number(componente.cantidad),
                    consumo,
                    visitados
                );
            }
            visitados.delete(idProducto);
            return;
        }

        const recetas = await this.recetaRepo.listarPorProducto(idProducto);
        for (const receta of recetas) {
            const total = Number(receta.cantidad) * cantidad;
            consumo.set(
                receta.id_ingrediente,
                (consumo.get(receta.id_ingrediente) ?? 0) + total
            );
        }
    }

    private async validarStock(consumo: Map<number, number>): Promise<void> {
        const ids = Array.from(consumo.keys());
        if (ids.length === 0) return;

        const ingredientes = await this.ingredienteRepo.obtenerPorIds(ids);
        const mapaIngredientes = new Map(ingredientes.map((i) => [i.id_ingrediente, i]));

        const faltantes: string[] = [];
        for (const [idIngrediente, requerido] of consumo.entries()) {
            const ingrediente = mapaIngredientes.get(idIngrediente);
            if (!ingrediente) {
                throw new Error(`El ingrediente ${idIngrediente} no existe`);
            }
            if (ingrediente.stock < requerido) {
                faltantes.push(`${ingrediente.nombre} (disponible: ${ingrediente.stock}, requerido: ${requerido})`);
            }
        }
        if (faltantes.length > 0) {
            throw new Error(`Stock insuficiente: ${faltantes.join("; ")}`);
        }
    }
}
