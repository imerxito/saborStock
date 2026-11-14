import { supabase } from "../configuracion/Supabase.js";
import {
  HistorialMesa,
  HistorialMesaRow,
  CrearHistorialMesa,
  FiltrosHistorialMesa,
} from "../modelos/HistorialMesa.js";
import { parseFechaDb } from "../utilidades/fechaDb.js";

function mapearHistorialMesaRow(row: HistorialMesaRow): HistorialMesa {
  return {
    id: row.id_historial_mesa,
    idMesa: row.id_mesa,
    idVenta: row.id_venta,
    idUsuario: row.id_usuario,
    estado: row.estado,
    monto: row.monto,
    motivo: row.motivo,
    fechaAccion: parseFechaDb(row.fecha_accion) ?? new Date(),
  };
}

export class HistorialMesaRepositorio {
  async listar(filtros?: FiltrosHistorialMesa): Promise<HistorialMesa[]> {
    let query = supabase
      .from("historial_mesa")
      .select("*")
      .order("fecha_accion", { ascending: false });

    if (filtros?.idMesa !== undefined) query = query.eq("id_mesa", filtros.idMesa);
    if (filtros?.idVenta !== undefined) query = query.eq("id_venta", filtros.idVenta);

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
        id_venta: datos.idVenta ?? null,
        id_usuario: datos.idUsuario,
        estado: datos.estado,
        monto: datos.monto ?? null,
        motivo: datos.motivo ?? null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23503") throw new Error("La mesa, la venta o el usuario indicado no existe");
      if (error.code === "23514") throw new Error("El estado o monto no es válido");
      throw new Error(`Error al crear historial de mesa: ${error.message}`);
    }
    return mapearHistorialMesaRow(data as HistorialMesaRow);
  }
}
