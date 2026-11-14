import { supabase } from "../configuracion/Supabase.js";
import {
    Ingrediente,
    CrearIngrediente,
    ActualizarIngrediente,
    IngredienteRow
} from "../modelos/Ingrediente.js";

function mapearIngredienteRow(row: IngredienteRow): Ingrediente {
    return {
        id_ingrediente: row.id_ingrediente,
        codigo: row.codigo,
        nombre: row.nombre,
        id_unidad: row.id_unidad,
        id_categoria_ingrediente: row.id_categoria_ingrediente ?? null,
        stock: Number(row.stock),
        stock_minimo: Number(row.stock_minimo),
        stock_maximo: Number(row.stock_maximo ?? 0),
        precio_referencia: Number(row.precio_referencia),
        caducidad: row.caducidad ?? null,
        activo: row.activo
    };
}

export class IngredienteRepositorio {

    async listar(soloActivos = true): Promise<Ingrediente[]> {
        let consulta = supabase
            .from("ingrediente")
            .select("*")
            .order("id_ingrediente", { ascending: true });

        if (soloActivos) {
            consulta = consulta.eq("activo", true);
        }

        const { data, error } = await consulta;

        if (error) {
            throw new Error(`Error al listar ingredientes: ${error.message}`);
        }

        return (data as IngredienteRow[]).map(mapearIngredienteRow);
    }

    async obtenerPorId(id: number): Promise<Ingrediente | null> {
        const { data, error } = await supabase
            .from("ingrediente")
            .select("*")
            .eq("id_ingrediente", id)
            .maybeSingle();

        if (error) {
            throw new Error(`Error al obtener ingrediente: ${error.message}`);
        }

        if (!data) {
            return null;
        }

        return mapearIngredienteRow(data as IngredienteRow);
    }

    async crear(datos: CrearIngrediente): Promise<Ingrediente> {
        const { data, error } = await supabase
            .from("ingrediente")
            .insert(datos)
            .select("*")
            .single();

        if (error) {
            if (error.code === "23505" || error.message.includes("unique")) {
                throw new Error(`El código "${datos.codigo}" ya está registrado en otro insumo.`);
            }
            throw new Error(`Error al crear ingrediente: ${error.message}`);
        }

        return mapearIngredienteRow(data as IngredienteRow);
    }

    async actualizar(
        id: number,
        cambios: ActualizarIngrediente
    ): Promise<void> {
        const { error } = await supabase
            .from("ingrediente")
            .update(cambios)
            .eq("id_ingrediente", id);

        if (error) {
            if (error.code === "23505" || error.message.includes("unique")) {
                throw new Error(`El código ya está registrado en otro insumo.`);
            }
            throw new Error(`Error al actualizar ingrediente: ${error.message}`);
        }
    }

    // Desactiva un ingrediente sin eliminarlo
    async desactivar(id: number): Promise<void> {
        const { error } = await supabase
            .from("ingrediente")
            .update({ activo: false })
            .eq("id_ingrediente", id);

        if (error) {
            throw new Error(`Error al desactivar ingrediente: ${error.message}`);
        }
    }
}
