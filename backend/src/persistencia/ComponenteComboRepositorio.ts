import { supabase } from '../configuracion/Supabase.js';
import {
    ComponenteComboRow,
    CrearComponenteComboDTO,
    ActualizarComponenteComboDTO
} from '../modelos/ComponenteCombo.js';

const Tabla = 'componente_combo';

function filaComponente(fila: any): ComponenteComboRow {
    return {
        id: Number(fila.id_combo) * 1000000 + Number(fila.id_producto_hijo),
        id_combo: fila.id_combo,
        id_producto_hijo: fila.id_producto_hijo,
        cantidad: fila.cantidad ?? 1
    };
}

export class ComponenteComboRepositorio {
    async listarPorCombo(idCombo: number): Promise<ComponenteComboRow[]> {
        const { data, error } = await supabase
            .from(Tabla)
            .select('*')
            .eq('id_combo', idCombo)
            .order('id_producto_hijo');

        if (error) throw new Error(`Error al listar componentes del combo: ${error.message}`);
        return (data ?? []).map(filaComponente);
    }

    async listarTodos(): Promise<ComponenteComboRow[]> {
        const { data, error } = await supabase
            .from(Tabla)
            .select('*')
            .order('id_combo')
            .order('id_producto_hijo');

        if (error) throw new Error(`Error al listar componentes de combos: ${error.message}`);
        return (data ?? []).map(filaComponente);
    }

    async crear(params: CrearComponenteComboDTO): Promise<ComponenteComboRow> {
        const { data, error } = await supabase
            .from(Tabla)
            .upsert({
                id_combo: params.idCombo,
                id_producto_hijo: params.idProductoHijo,
                cantidad: params.cantidad ?? 1
            }, { onConflict: 'id_combo,id_producto_hijo' })
            .select('*')
            .single();

        if (error) throw new Error(`Error al crear componente de combo: ${error.message}`);
        return filaComponente(data);
    }

    async actualizar(id: number, params: ActualizarComponenteComboDTO): Promise<ComponenteComboRow | null> {
        // id = idCombo * 1000000 + idProductoHijo
        const idCombo = Math.floor(id / 1000000);
        const idHijo = id % 1000000;

        const { data, error } = await supabase
            .from(Tabla)
            .update({
                cantidad: params.cantidad,
                id_producto_hijo: params.id_producto_hijo ?? idHijo
            })
            .eq('id_combo', idCombo)
            .eq('id_producto_hijo', idHijo)
            .select('*')
            .maybeSingle();

        if (error) throw new Error(`Error al actualizar componente: ${error.message}`);
        return data ? filaComponente(data) : null;
    }

    async eliminar(id: number): Promise<void> {
        const idCombo = Math.floor(id / 1000000);
        const idHijo = id % 1000000;

        const { error } = await supabase
            .from(Tabla)
            .delete()
            .eq('id_combo', idCombo)
            .eq('id_producto_hijo', idHijo);

        if (error) throw new Error(`Error al eliminar componente: ${error.message}`);
    }

    async eliminarPorCombo(idCombo: number): Promise<void> {
        const { error } = await supabase
            .from(Tabla)
            .delete()
            .eq('id_combo', idCombo);

        if (error) throw new Error(`Error al eliminar componentes del combo: ${error.message}`);
    }
}
