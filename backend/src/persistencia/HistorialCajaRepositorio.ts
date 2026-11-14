import { supabase } from "../configuracion/Supabase.js";
import {
  HistorialCaja,
  HistorialCajaRow,
  CrearHistorialCaja,
  FiltrosHistorialCaja,
} from "../modelos/HistorialCaja.js";
import { parseFechaDb } from "../utilidades/fechaDb.js";

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
    fechaMovimiento: parseFechaDb(row.fecha_movimiento) ?? new Date(),
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
    // Resolver usuario válido
    let idUsuarioValido = Number(datos.idUsuario);
    const { data: userExists } = await supabase
      .from("usuario")
      .select("id_usuario")
      .eq("id_usuario", idUsuarioValido)
      .maybeSingle();
    if (!userExists) {
      const { data: primerUser } = await supabase
        .from("usuario")
        .select("id_usuario")
        .limit(1)
        .maybeSingle();
      idUsuarioValido = primerUser?.id_usuario ?? 1;
    }

    // Resolver turno válido
    let idTurnoValido = Number(datos.idTurnoCaja);
    const { data: turnoExists } = await supabase
      .from("turno_caja")
      .select("id_turno_caja")
      .eq("id_turno_caja", idTurnoValido)
      .maybeSingle();
    if (!turnoExists) {
      const { data: ultimoTurno } = await supabase
        .from("turno_caja")
        .select("id_turno_caja")
        .order("id_turno_caja", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (ultimoTurno) {
        idTurnoValido = ultimoTurno.id_turno_caja;
      } else {
        const { data: nuevoTurno } = await supabase
          .from("turno_caja")
          .insert({
            id_caja: 1,
            id_usuario_apertura: idUsuarioValido,
            monto_inicial: 0
          })
          .select()
          .single();
        idTurnoValido = nuevoTurno?.id_turno_caja ?? 1;
      }
    }

    // Normalizar metodo_pago y tipo_pago según los check constraints de la BD ('efectivo', 'tarjeta', 'transferencia') y ('ingreso', 'egreso')
    const metodoLower = String(datos.metodoPago || "").toLowerCase();
    const metodoValido = ['efectivo', 'tarjeta', 'transferencia'].includes(metodoLower)
      ? metodoLower
      : 'efectivo';

    const tipoLower = String(datos.tipoPago || "").toLowerCase();
    const tipoValido = tipoLower.includes('egreso') ? 'egreso' : 'ingreso';

    const { data, error } = await supabase
      .from("historial_caja")
      .insert({
        id_turno_caja: idTurnoValido,
        id_usuario: idUsuarioValido,
        id_factura: datos.idFactura ?? null,
        metodo_pago: metodoValido,
        tipo_pago: tipoValido,
        monto: Math.max(0, Number(datos.monto) || 0),
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