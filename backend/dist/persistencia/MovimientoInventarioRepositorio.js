import { supabase } from "../configuracion/Supabase.js";
function mapearMovimientoRow(row) {
    return {
        id_movimiento: row.id_movimiento,
        id_ingrediente: row.id_ingrediente,
        tipo: row.tipo,
        cantidad: Number(row.cantidad),
        fecha: row.fecha,
        motivo: row.motivo
    };
}
export class MovimientoInventarioRepositorio {
    async listar() {
        const { data, error } = await supabase
            .from("movimiento_inventario")
            .select("*")
            .order("id_movimiento", { ascending: true });
        if (error) {
            throw new Error(`Error al listar movimientos: ${error.message}`);
        }
        return data.map(mapearMovimientoRow);
    }
    async obtenerPorId(id) {
        const { data, error } = await supabase
            .from("movimiento_inventario")
            .select("*")
            .eq("id_movimiento", id)
            .maybeSingle();
        if (error) {
            throw new Error(`Error al obtener movimiento: ${error.message}`);
        }
        if (!data) {
            return null;
        }
        return mapearMovimientoRow(data);
    }
    async listarPorIngrediente(idIngrediente) {
        const { data, error } = await supabase
            .from("movimiento_inventario")
            .select("*")
            .eq("id_ingrediente", idIngrediente)
            .order("fecha", { ascending: false });
        if (error) {
            throw new Error(`Error al listar movimientos del ingrediente: ${error.message}`);
        }
        return data.map(mapearMovimientoRow);
    }
    async crear(datos) {
        const { data, error } = await supabase
            .from("movimiento_inventario")
            .insert(datos)
            .select("*")
            .single();
        if (error) {
            throw new Error(`Error al crear movimiento: ${error.message}`);
        }
        return mapearMovimientoRow(data);
    }
    // Registrar un movimiento y actualizar el stock en Supabase
    async registrarMovimiento(datos) {
        const { data, error } = await supabase.rpc("registrar_movimiento_inventario", {
            p_id_ingrediente: datos.id_ingrediente,
            p_tipo: datos.tipo,
            p_cantidad: datos.cantidad,
            p_motivo: datos.motivo.trim()
        });
        if (error) {
            throw new Error(`Error al registrar movimiento: ${error.message}`);
        }
        if (!data || data.length === 0) {
            throw new Error("No se recibió el movimiento registrado");
        }
        const movimiento = data[0];
        return {
            id_movimiento: movimiento.id_movimiento,
            id_ingrediente: movimiento.id_ingrediente,
            tipo: movimiento.tipo,
            cantidad: Number(movimiento.cantidad),
            fecha: movimiento.fecha,
            motivo: movimiento.motivo,
            nuevo_stock: Number(movimiento.nuevo_stock)
        };
    }
}
