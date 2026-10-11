import { supabase } from "../configuracion/Supabase.js";
import { Categoria, CrearCategoriaDTO, ActualizarCategoriaDTO } from "../modelos/Categoria.js";

const Tabla = "categoria";

function filaCategoria(fila: any): Categoria {
    return {
        id: fila.id,
        nombre: fila.nombre,
        descripcion: fila.descripcion ?? null,
        activo: fila.activo
    };
}

export class CategoriaRepositorio {
    async listar(): Promise<Categoria[]> {
        const { data, error } = await supabase
            .from(Tabla)
            .select("*")
            .order("nombre");
        if (error) {
            throw new Error(`Error al listar categorías: ${error.message}`);
        }
        return data.map(filaCategoria);
    }

    async obtenerPorId(id:string):Promise<Categoria|null>{
        const {data,error}= await supabase
        .from(Tabla)
        .select('*')
        .eq('id',id)
        .maybeSingle();
        if (error) {
            throw new Error(`Error al obtener categoría por ID: ${error.message}`);
        }
        return data ? filaCategoria(data) : null;
    }

    async buscarPorNombre(nombre:string):Promise<Categoria|null>{
        const {data,error}= await supabase
        .from(Tabla)
        .select('*')
        .eq('nombre',nombre)
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

    async actualizar(id: string, params: ActualizarCategoriaDTO): Promise<Categoria> {
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

    async cambiarEstado(id: string, activo: boolean): Promise<void> {
        const { error } = await supabase
            .from(Tabla)
            .update({ activo })
            .eq('id', id);
        if (error) {
            throw new Error(`Error al cambiar estado de categoría: ${error.message}`);
        }
    }

    async eliminar(id: string): Promise<void> {
        const { error } = await supabase
            .from(Tabla)
            .delete()
            .eq('id', id);
        if (error) {
            throw new Error(`Error al eliminar categoría: ${error.message}`);
        }
    }
}