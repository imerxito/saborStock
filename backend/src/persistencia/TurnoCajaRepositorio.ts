import { supabase } from "../configuracion/Supabase.js";
import { TurnoCaja, AbrirTurno, CerrarTurno, EstadoTurno } from "../modelos/TurnoCaja.js";

function filaTurnoCaja(fila: any): TurnoCaja {
    return {
        id: fila.id_turno_caja,
        idCaja: fila.id_caja,
        idUsuarioApertura: fila.id_usuario_apertura,
        idUsuarioCierre: fila.id_usuario_cierre,
        fechaApertura: fila.fecha_apertura,
        fechaCierre: fila.fecha_cierre,
        montoInicial: Number(fila.monto_inicial),
        montoFinal: fila.monto_final === null ? null : Number(fila.monto_final),
        estado: fila.estado as EstadoTurno,
    };
}

export class TurnoCajaRepositorio {
    async listar(): Promise<TurnoCaja[]> {
        const { data, error } = await supabase
            .from("turno_caja")
            .select("*")
            .order("fecha_apertura", { ascending: false });
        if (error) throw new Error(`Error al obtener los turnos: ${error.message}`);
        return (data ?? []).map(filaTurnoCaja);
    }

    async obtenerPorId(id: number): Promise<TurnoCaja | null> {
        const { data, error } = await supabase
            .from("turno_caja")
            .select("*")
            .eq("id_turno_caja", id)
            .maybeSingle();
        if (error) throw new Error(`Error al obtener el turno: ${error.message}`);
        return data ? filaTurnoCaja(data) : null;
    }

    async obtenerAbiertoPorCaja(idCaja: number): Promise<TurnoCaja | null> {
        const { data, error } = await supabase
            .from("turno_caja")
            .select("*")
            .eq("id_caja", idCaja)
            .eq("estado", EstadoTurno.Abierto)
            .maybeSingle();
        if (error) throw new Error(`Error al buscar el turno abierto: ${error.message}`);
        return data ? filaTurnoCaja(data) : null;
    }

    async abrir(datos: AbrirTurno): Promise<TurnoCaja> {
        const { data, error } = await supabase
            .from("turno_caja")
            .insert({
                id_caja: datos.idCaja,
                id_usuario_apertura: datos.idUsuarioApertura,
                monto_inicial: datos.montoInicial,
                // estado y fecha_apertura toman su default en la BD
            })
            .select()
            .single();
        if (error) throw new Error(`Error al abrir el turno: ${error.message}`);
        return filaTurnoCaja(data);
    }

    async cerrar(id: number, datos: CerrarTurno): Promise<TurnoCaja> {
        const { data, error } = await supabase
            .from("turno_caja")
            .update({
                id_usuario_cierre: datos.idUsuarioCierre,
                monto_final: datos.montoFinal,
                fecha_cierre: new Date().toISOString(),
                estado: EstadoTurno.Cerrado,
            })
            .eq("id_turno_caja", id)
            .select()
            .single();
        if (error) throw new Error(`Error al cerrar el turno: ${error.message}`);
        return filaTurnoCaja(data);
    }
}