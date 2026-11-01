import { supabase } from "../configuracion/Supabase.js";
import { Caja, CrearCaja, ActualizarCaja } from "../modelos/Caja.js";

function filaCaja(fila: any): Caja {
    return {
        id: fila.id_caja,
        nombre: fila.nombre,
        activo: fila.activo,
    };
}

export class CajaRepositorio {
    async listar(): Promise<Caja[]> {
        const { data, error } = await supabase
            .from("caja")
            .select("*")
            .order("nombre");
        if (error) throw new Error(`Error al obtener las cajas: ${error.message}`);
        return (data ?? []).map(filaCaja);
    }

    async obtenerCajaPorId(id: number): Promise<Caja | null> {
        const { data, error } = await supabase
            .from("caja")
            .select("*")
            .eq("id_caja", id)
            .maybeSingle();
        if (error) throw new Error(`Error al obtener la caja: ${error.message}`);
        return data ? filaCaja(data) : null;
    }

    async crearCaja(params: CrearCaja): Promise<Caja> {
        const { data, error } = await supabase
            .from("caja")
            .insert({ nombre: params.nombre })
            .select()
            .single();
        if (error) throw new Error(`Error al crear la caja: ${error.message}`);
        return filaCaja(data);
    }

    async actualizarCaja(id: number, params: ActualizarCaja): Promise<Caja> {
        const campos: Record<string, unknown> = {};
        if (params.nombre !== undefined) campos.nombre = params.nombre;
        if (params.activo !== undefined) campos.activo = params.activo;

        const { data, error } = await supabase
            .from("caja")
            .update(campos)
            .eq("id_caja", id)
            .select()
            .single();
        if (error) throw new Error(`Error al actualizar la caja: ${error.message}`);
        return filaCaja(data);
    }

    async eliminarCaja(id: number): Promise<void> {
        const { error } = await supabase
        .from("caja")
        .delete()
        .eq("id_caja", id);
        if (error) throw new Error(`Error al eliminar la caja: ${error.message}`);
    }

    async cambiarEstado(id: number, activo: boolean): Promise<void> {
        const { error } = await supabase
        .from("caja")
        .update({ activo })
        .eq("id_caja", id);
        if (error) throw new Error(`Error al cambiar estado de la caja: ${error.message}`);
    }
}