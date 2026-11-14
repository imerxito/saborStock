import { supabase } from "../configuracion/Supabase.js";
import { Categoria, CrearCategoriaDTO, ActualizarCategoriaDTO } from "../modelos/Categoria.js";

const Tabla = "categoria";

function filaCategoria(fila: any): Categoria {
    const idVal = fila.id_categoria ?? fila.id;
    return {
        id: idVal,
        id_categoria: Number(idVal),
        nombre: fila.nombre,
        descripcion: fila.descripcion ?? null,
        activo: fila.activo ?? true
    };
}

export class CategoriaRepositorio {
    async listar(): Promise<Categoria[]> {
        const { data, error } = await supabase
            .from(Tabla)
            .select("*")
            .order("id_categoria", { ascending: true });
        if (error) {
            throw new Error(`Error al listar categorías: ${error.message}`);
        }
        return (data || []).map(filaCategoria);
    }

    async obtenerPorId(id: string | number): Promise<Categoria | null> {
        const { data, error } = await supabase
            .from(Tabla)
            .select("*")
            .eq("id_categoria", id)
            .maybeSingle();
        if (error) {
            throw new Error(`Error al obtener categoría por ID: ${error.message}`);
        }
        return data ? filaCategoria(data) : null;
    }

    async buscarPorNombre(nombre: string): Promise<Categoria | null> {
        const { data, error } = await supabase
            .from(Tabla)
            .select("*")
            .eq("nombre", nombre)
            .maybeSingle();
        if (error) {
            throw new Error(`Error al buscar categoría por nombre: ${error.message}`);
        }
        return data ? filaCategoria(data) : null;
    }

    async crear(params: CrearCategoriaDTO): Promise<Categoria> {
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

    async actualizar(id: string | number, params: ActualizarCategoriaDTO): Promise<Categoria> {
        const campos: Record<string, unknown> = {};
        if (params.nombre !== undefined) campos.nombre = params.nombre;
        if (params.descripcion !== undefined) campos.descripcion = params.descripcion;
        if (params.activo !== undefined) campos.activo = params.activo;

        const { data, error } = await supabase
            .from(Tabla)
            .update(campos)
            .eq("id_categoria", id)
            .select()
            .single();
        if (error) {
            throw new Error(`Error al actualizar categoría: ${error.message}`);
        }
        return filaCategoria(data);
    }

    async cambiarEstado(id: string | number, activo: boolean): Promise<void> {
        const { error } = await supabase
            .from(Tabla)
            .update({ activo })
            .eq("id_categoria", id);
        if (error) {
            throw new Error(`Error al cambiar estado de categoría: ${error.message}`);
        }
    }

    async eliminar(id: string | number): Promise<void> {
        const { error } = await supabase
            .from(Tabla)
            .delete()
            .eq("id_categoria", id);
        if (error) {
            throw new Error(`Error al eliminar categoría: ${error.message}`);
        }
    }
}
