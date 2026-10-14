import { supabase } from "../configuracion/Supabase.js";
import {
  HistorialCaja,
  HistorialCajaRow,
  CrearHistorialCaja,
  FiltrosHistorialCaja,
} from "../modelos/HistorialCaja.js";

function mapearHistorialCajaRow(row: HistorialCajaRow): HistorialCaja {
  return {
    id: row.id_historial_caja,
    idTurnoCaja: row.id_turno_caja,
    idUsuario: row.id_usuario,
    idFactura: row.id_factura,
    metodoPago: row.metodo_pago,
    tipoPago: row.tipo_pago,
    monto: Number(row.monto),
    descripcion: row.descripcion,
    fechaMovimiento: new Date(row.fecha_movimiento),
  };
}

export class HistorialCajaRepositorio {
  async listar(filtros?: FiltrosHistorialCaja): Promise<HistorialCaja[]> {
    let query = supabase
      .from("historial_caja")
      .select("*")
      .order("fecha_movimiento", { ascending: false });

    if (filtros?.idTurnoCaja !== undefined) query = query.eq("id_turno_caja", filtros.idTurnoCaja);
    if (filtros?.idFactura !== undefined) query = query.eq("id_factura", filtros.idFactura);

    const { data, error } = await query;

    if (error) throw new Error(`Error al listar historial de caja: ${error.message}`);
    return (data as HistorialCajaRow[]).map(mapearHistorialCajaRow);
  }

  async obtenerPorId(id: number): Promise<HistorialCaja | null> {
    const { data, error } = await supabase
      .from("historial_caja")
      .select("*")
      .eq("id_historial_caja", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error al obtener historial de caja: ${error.message}`);
    }
    return mapearHistorialCajaRow(data as HistorialCajaRow);
  }

  async crearHistorialCaja(datos: CrearHistorialCaja): Promise<HistorialCaja> {
    const { data, error } = await supabase
      .from("historial_caja")
      .insert({
        id_turno_caja: datos.idTurnoCaja,
        id_usuario: datos.idUsuario,
        id_factura: datos.idFactura ?? null,
        metodo_pago: datos.metodoPago,
        tipo_pago: datos.tipoPago,
        monto: datos.monto,
        descripcion: datos.descripcion ?? null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23503") throw new Error("El turno de caja, el usuario o la factura indicada no existe");
      if (error.code === "23514") throw new Error("El monto no puede ser negativo");
      throw new Error(`Error al crear historial de caja: ${error.message}`);
    }
    return mapearHistorialCajaRow(data as HistorialCajaRow);
  }
}