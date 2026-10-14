import { supabase } from "../configuracion/Supabase.js";
import { Factura, FacturaRow } from "../modelos/Factura.js";

function mapearFacturaRow(row: FacturaRow): Factura {
  return {
    id: row.id_factura,
    idMesa: row.id_mesa,
    idUsuario: row.id_usuario,
    fechaEmision: new Date(row.fecha_emision),
    subtotal: Number(row.subtotal),
    propina: Number(row.propina),
    totalPagar: Number(row.total_pagar),
  };
}

// Datos ya calculados por el servicio (incluye totalPagar)
export interface DatosCrearFactura {
  idMesa: number;
  idUsuario: number;
  subtotal: number;
  propina: number;
  totalPagar: number;
}

export interface DatosActualizarFactura {
  idMesa?: number;
  idUsuario?: number;
  subtotal?: number;
  propina?: number;
  totalPagar?: number;
}

export class FacturaRepositorio {
  async listar(): Promise<Factura[]> {
    const { data, error } = await supabase
      .from("factura")
      .select("*")
      .order("fecha_emision", { ascending: false });

    if (error) throw new Error(`Error al listar facturas: ${error.message}`);
    return (data as FacturaRow[]).map(mapearFacturaRow);
  }

  async obtenerPorId(id: number): Promise<Factura | null> {
    const { data, error } = await supabase
      .from("factura")
      .select("*")
      .eq("id_factura", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error al obtener factura: ${error.message}`);
    }
    return mapearFacturaRow(data as FacturaRow);
  }

  async crearFactura(datos: DatosCrearFactura): Promise<Factura> {
    const { data, error } = await supabase
      .from("factura")
      .insert({
        id_mesa: datos.idMesa,
        id_usuario: datos.idUsuario,
        subtotal: datos.subtotal,
        propina: datos.propina,
        total_pagar: datos.totalPagar,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23503") throw new Error("La mesa o el usuario indicado no existe");
      if (error.code === "23514") throw new Error("Subtotal, propina y total no pueden ser negativos");
      throw new Error(`Error al crear factura: ${error.message}`);
    }
    return mapearFacturaRow(data as FacturaRow);
  }

  async actualizarFactura(id: number, cambios: DatosActualizarFactura): Promise<void> {
    const campos: Record<string, unknown> = {};
    if (cambios.idMesa !== undefined) campos.id_mesa = cambios.idMesa;
    if (cambios.idUsuario !== undefined) campos.id_usuario = cambios.idUsuario;
    if (cambios.subtotal !== undefined) campos.subtotal = cambios.subtotal;
    if (cambios.propina !== undefined) campos.propina = cambios.propina;
    if (cambios.totalPagar !== undefined) campos.total_pagar = cambios.totalPagar;

    if (Object.keys(campos).length === 0) return;

    const { error } = await supabase
      .from("factura")
      .update(campos)
      .eq("id_factura", id);

    if (error) {
      if (error.code === "23503") throw new Error("La mesa o el usuario indicado no existe");
      if (error.code === "23514") throw new Error("Subtotal, propina y total no pueden ser negativos");
      throw new Error(`Error al actualizar factura: ${error.message}`);
    }
  }
}