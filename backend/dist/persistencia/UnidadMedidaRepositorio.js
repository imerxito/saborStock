import { supabase } from '../configuracion/Supabase.js';
const Tabla = 'unidad_medida';
function filaUnidadMedida(fila) {
    return {
        id: fila.id,
        nombre: fila.nombre,
        abreviatura: fila.abreviatura,
        descripcion: fila.descripcion ?? null,
        activo: fila.activo
    };
}
function mensajeError(accion, error) {
    if (error.code === '23505')
        return 'ya existe esta unidad de medida';
    return `Error al ${accion}:${error.message ?? 'Error desconocido'}`;
}
export class UnidadMedidaRepositorio {
    async listar() {
        const { data, error } = await supabase
            .from(Tabla)
            .select('*')
            .order('nombre');
        if (error)
            throw new Error(mensajeError('listar', error));
        return data.map(filaUnidadMedida);
    }
    async obtenerPorId(id) {
        const { data, error } = await supabase
            .from(Tabla)
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw new Error(mensajeError('obtenerPorId', error));
        return data ? filaUnidadMedida(data) : null;
    }
    async buscarPorNombre(nombre) {
        const { data, error } = await supabase
            .from(Tabla)
            .select('*')
            .eq('nombre', nombre)
            .maybeSingle();
        if (error)
            throw new Error(mensajeError('buscarPorNombre', error));
        return data ? filaUnidadMedida(data) : null;
    }
    async buscarPorAbreviatura(abreviatura) {
        const { data, error } = await supabase
            .from(Tabla)
            .select('*')
            .eq('abreviatura', abreviatura)
            .maybeSingle();
        if (error)
            throw new Error(mensajeError('buscarPorAbreviatura', error));
        return data ? filaUnidadMedida(data) : null;
    }
    async crear(params) {
        const { data, error } = await supabase
            .from(Tabla)
            .insert({
            nombre: params.nombre,
            abreviatura: params.abreviatura,
            descripcion: params.descripcion ?? null,
            activo: true
        })
            .select('*')
            .single();
        if (error)
            throw new Error(mensajeError('crear', error));
        return filaUnidadMedida(data);
    }
    async actualizar(id, params) {
        const { data, error } = await supabase
            .from(Tabla)
            .update({
            nombre: params.nombre,
            abreviatura: params.abreviatura,
            descripcion: params.descripcion ?? null
        })
            .eq('id', id)
            .select('*')
            .single();
        if (error)
            throw new Error(mensajeError('actualizar', error));
        return filaUnidadMedida(data);
    }
    async cambiarEstado(id, activo) {
        const { error } = await supabase
            .from(Tabla)
            .update({ activo })
            .eq('id', id);
        if (error)
            throw new Error(mensajeError('cambiarEstado', error));
    }
}
