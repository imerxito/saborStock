import { supabase } from "../configuracion/Supabase.js";
import {
  HistorialMesa,
  HistorialMesaRow,
  CrearHistorialMesa,
  FiltrosHistorialMesa,
} from "../modelos/HistorialMesa.js";

function mapearHistorialMesaRow(row: HistorialMesaRow): HistorialMesa {
  return {
    id: row.id_historial_mesa,
    idMesa: row.id_mesa,
    idComanda: row.id_comanda,
    idUsuario: row.id_usuario,
    estado: row.estado,
    monto: row.monto,
    motivo: row.motivo,
    fechaAccion: new Date(row.fecha_accion),
  };
}

export class HistorialMesaRepositorio {
  async listar(filtros?: FiltrosHistorialMesa): Promise<HistorialMesa[]> {
    let query = supabase
      .from("historial_mesa")
      .select("*")
      .order("fecha_accion", { ascending: false });

    if (filtros?.idMesa !== undefined) query = query.eq("id_mesa", filtros.idMesa);
    if (filtros?.idComanda !== undefined) query = query.eq("id_comanda", filtros.idComanda);

    const { data, error } = await query;

    if (error) throw new Error(`Error al listar historial de mesas: ${error.message}`);
    return (data as HistorialMesaRow[]).map(mapearHistorialMesaRow);
  }

  async obtenerPorId(id: number): Promise<HistorialMesa | null> {
    const { data, error } = await supabase
      .from("historial_mesa")
      .select("*")
      .eq("id_historial_mesa", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error al obtener historial de mesa: ${error.message}`);
    }
    return mapearHistorialMesaRow(data as HistorialMesaRow);
  }

  async crearHistorialMesa(datos: CrearHistorialMesa): Promise<HistorialMesa> {
    const { data, error } = await supabase
      .from("historial_mesa")
      .insert({
        id_mesa: datos.idMesa,
        id_comanda: datos.idComanda ?? null,
        id_usuario: datos.idUsuario,
        estado: datos.estado,
        monto: datos.monto ?? null,
        motivo: datos.motivo ?? null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23503") throw new Error("La mesa, la comanda o el usuario indicado no existe");
      if (error.code === "23514") throw new Error("El monto no puede ser negativo");
      throw new Error(`Error al crear historial de mesa: ${error.message}`);
    }
    return mapearHistorialMesaRow(data as HistorialMesaRow);
  }
}