import { supabase } from "../configuracion/Supabase.js";

export interface PagoNominaCompleto {
  id: number;
  idUsuario: number;
  idTurnoCaja: number | null;
  empleado: string;
  cedula: string;
  telefono: string;
  cargo: string;
  montoBase: number;
  bono: number;
  montoTotal: number;
  metodoPago: string;
  fecha: string;
}

export interface CrearPagoNominaInput {
  idUsuario: number;
  idTurnoCaja?: number | null;
  montoBase: number;
  bono?: number;
  metodoPago?: string;
  fecha?: string;
}

export class NominaRepositorio {
  async listar(): Promise<PagoNominaCompleto[]> {
    const { data, error } = await supabase
      .from("pago_nomina")
      .select("*, usuario:id_usuario(id_usuario, nombre, cedula, telefono, rol)")
      .order("fecha", { ascending: false });

    if (error) {
      throw new Error(`Error al listar nómina: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id_pago_nomina,
      idUsuario: row.id_usuario,
      idTurnoCaja: row.id_turno_caja,
      empleado: row.usuario?.nombre || `Usuario #${row.id_usuario}`,
      cedula: row.usuario?.cedula || "",
      telefono: row.usuario?.telefono || "",
      cargo: row.usuario?.rol || "Empleado",
      montoBase: Number(row.monto_base || 0),
      bono: Number(row.bono || 0),
      montoTotal: Number(row.monto_total || 0),
      metodoPago: row.metodo_pago || "Efectivo",
      fecha: row.fecha || new Date().toISOString(),
    }));
  }

  async obtenerPorId(id: number): Promise<PagoNominaCompleto | null> {
    const { data, error } = await supabase
      .from("pago_nomina")
      .select("*, usuario:id_usuario(id_usuario, nombre, cedula, telefono, rol)")
      .eq("id_pago_nomina", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al obtener nómina: ${error.message}`);
    }
    if (!data) return null;

    return {
      id: data.id_pago_nomina,
      idUsuario: data.id_usuario,
      idTurnoCaja: data.id_turno_caja,
      empleado: data.usuario?.nombre || `Usuario #${data.id_usuario}`,
      cedula: data.usuario?.cedula || "",
      telefono: data.usuario?.telefono || "",
      cargo: data.usuario?.rol || "Empleado",
      montoBase: Number(data.monto_base || 0),
      bono: Number(data.bono || 0),
      montoTotal: Number(data.monto_total || 0),
      metodoPago: data.metodo_pago || "Efectivo",
      fecha: data.fecha || new Date().toISOString(),
    };
  }

  async crear(datos: CrearPagoNominaInput): Promise<PagoNominaCompleto> {
    const montoBase = Number(datos.montoBase) || 0;
    const bono = Number(datos.bono) || 0;
    const montoTotal = montoBase + bono;

    const rowToInsert: Record<string, any> = {
      id_usuario: Number(datos.idUsuario),
      id_turno_caja: datos.idTurnoCaja ? Number(datos.idTurnoCaja) : null,
      monto_base: montoBase,
      bono: bono,
      monto_total: montoTotal,
      metodo_pago: (datos.metodoPago || "efectivo").toLowerCase(),
      fecha: datos.fecha || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("pago_nomina")
      .insert(rowToInsert)
      .select("*, usuario:id_usuario(id_usuario, nombre, cedula, telefono, rol)")
      .single();

    if (error) {
      throw new Error(`Error al registrar pago de nómina: ${error.message}`);
    }

    return {
      id: data.id_pago_nomina,
      idUsuario: data.id_usuario,
      idTurnoCaja: data.id_turno_caja,
      empleado: data.usuario?.nombre || `Usuario #${data.id_usuario}`,
      cedula: data.usuario?.cedula || "",
      telefono: data.usuario?.telefono || "",
      cargo: data.usuario?.rol || "Empleado",
      montoBase: Number(data.monto_base || 0),
      bono: Number(data.bono || 0),
      montoTotal: Number(data.monto_total || 0),
      metodoPago: data.metodo_pago || "Efectivo",
      fecha: data.fecha || new Date().toISOString(),
    };
  }

  async eliminar(id: number): Promise<void> {
    const { error } = await supabase
      .from("pago_nomina")
      .delete()
      .eq("id_pago_nomina", id);

    if (error) {
      throw new Error(`Error al eliminar pago de nómina: ${error.message}`);
    }
  }
}
