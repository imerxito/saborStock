import { supabase } from "../configuracion/Supabase.js";
const Tabla = "categoria";
function filaCategoria(fila) {
    return {
        id: fila.id,
        nombre: fila.nombre,
        descripcion: fila.descripcion ?? null,
        activo: fila.activo
    };
}
export class CategoriaRepositorio {
    async listar() {
        const { data, error } = await supabase
            .from(Tabla)
            .select("*")
            .order("nombre");
        if (error) {
            throw new Error(`Error al listar categorías: ${error.message}`);
        }
        return data.map(filaCategoria);
    }
    async obtenerPorId(id) {
        const { data, error } = await supabase
            .from(Tabla)
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) {
            throw new Error(`Error al obtener categoría por ID: ${error.message}`);
        }
        return data ? filaCategoria(data) : null;
    }
    async buscarPorNombre(nombre) {
        const { data, error } = await supabase
            .from(Tabla)
            .select('*')
            .eq('nombre', nombre)
            .maybeSingle();
        if (error) {
            throw new Error(`Error al buscar categoría por nombre: ${error.message}`);
        }
        return data ? filaCategoria(data) : null;
    }
    async crear(params) {
        const { data, error } = await supabase
            .from(Tabla)
            .insert({
            nombre: params.nombre,
            descripcion: params.descripcion ?? null,
            activo: true
        })
            .select()
            .single();
        if (error) {
            throw new Error(`Error al crear categoría: ${error.message}`);
        }
        return filaCategoria(data);
    }
    async actualizar(id, params) {
        const { data, error } = await supabase
            .from(Tabla)
            .update({
            nombre: params.nombre,
            descripcion: params.descripcion ?? null,
            activo: params.activo
        })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw new Error(`Error al actualizar categoría: ${error.message}`);
        }
        return filaCategoria(data);
    }
    async cambiarEstado(id, activo) {
        const { error } = await supabase
            .from(Tabla)
            .update({ activo })
            .eq('id', id);
        if (error) {
            throw new Error(`Error al cambiar estado de categoría: ${error.message}`);
        }
    }
    async eliminar(id) {
        const { error } = await supabase
            .from(Tabla)
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Error al eliminar categoría: ${error.message}`);
        }
    }
}
