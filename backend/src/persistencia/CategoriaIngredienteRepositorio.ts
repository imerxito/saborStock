import { supabase } from '../configuracion/Supabase.js';
import {
    CategoriaIngrediente,
    CategoriaIngredienteDto,
    CrearCategoriaIngredienteDTO,
    ActualizarCategoriaIngredienteDTO
} from '../modelos/CategoriaIngrediente.js';

const Tabla = 'categoria_ingrediente';

function filaCategoria(fila: any): CategoriaIngrediente {
    return {
        id_categoria_ingrediente: fila.id_categoria_ingrediente,
        nombre: fila.nombre,
        activo: fila.activo ?? true
    };
}

export function mapearCategoria(row: any): CategoriaIngredienteDto {
    return {
        id: row.id_categoria_ingrediente,
        nombre: row.nombre,
        activo: row.activo ?? true
    };
}

function mensajeError(accion: string, error: { code?: string; message?: string }) {
    if (error.code === '23505') return 'Ya existe una categoría de insumo con ese nombre';
    return `Error al ${accion}: ${error.message ?? 'Error desconocido'}`;
}

export class CategoriaIngredienteRepositorio {
    async listar(): Promise<CategoriaIngrediente[]> {
        const { data, error } = await supabase
            .from(Tabla)
            .select('*')
            .order('nombre');

        if (error) throw new Error(mensajeError('listar categorías de insumo', error));
        return (data ?? []).map(filaCategoria);
    }

    async listarActivos(): Promise<CategoriaIngrediente[]> {
        const { data, error } = await supabase
            .from(Tabla)
            .select('*')
            .eq('activo', true)
            .order('nombre');

        if (error) throw new Error(mensajeError('listar categorías activas', error));
        return (data ?? []).map(filaCategoria);
    }

    async obtenerPorId(id: number): Promise<CategoriaIngrediente | null> {
        const { data, error } = await supabase
            .from(Tabla)
            .select('*')
            .eq('id_categoria_ingrediente', id)
            .maybeSingle();

        if (error) throw new Error(mensajeError('obtener categoría', error));
        return data ? filaCategoria(data) : null;
    }

    async crear(params: CrearCategoriaIngredienteDTO): Promise<CategoriaIngrediente> {
        const { data, error } = await supabase
            .from(Tabla)
            .insert({
                nombre: params.nombre.trim(),
                activo: true
            })
            .select('*')
            .single();

        if (error) throw new Error(mensajeError('crear categoría', error));
        return filaCategoria(data);
    }

    async actualizar(id: number, params: ActualizarCategoriaIngredienteDTO): Promise<void> {
        const { error } = await supabase
            .from(Tabla)
            .update({
                nombre: params.nombre?.trim()
            })
            .eq('id_categoria_ingrediente', id);

        if (error) throw new Error(mensajeError('actualizar categoría', error));
    }

    async cambiarEstado(id: number, activo: boolean): Promise<void> {
        const { error } = await supabase
            .from(Tabla)
            .update({ activo })
            .eq('id_categoria_ingrediente', id);

        if (error) throw new Error(mensajeError('cambiar estado de categoría', error));
    }
}
