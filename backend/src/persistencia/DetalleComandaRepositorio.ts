import { supabase } from "../configuracion/Supabase.js";
import {
  DetalleComanda,
  DetalleComandaRow,
  CrearDetalleComanda,
  ActualizarDetalleComanda,
} from "../modelos/DetalleComanda.js";

function mapearDetalleComandaRow(row: DetalleComandaRow): DetalleComanda {
  return {
    id: row.id_detalle_comanda,
    idComanda: row.id_comanda,
    idProducto: row.id_producto,
    cantidad: row.cantidad,
    nota: row.nota,
  };
}

export class DetalleComandaRepositorio {
  async listar(): Promise<DetalleComanda[]> {
    const { data, error } = await supabase
      .from("detalle_comanda")
      .select("*")
      .order("id_detalle_comanda", { ascending: true });

    if (error) throw new Error(`Error al listar detalles de comanda: ${error.message}`);
    return (data as DetalleComandaRow[]).map(mapearDetalleComandaRow);
  }

  async listarPorComanda(idComanda: number): Promise<DetalleComanda[]> {
    const { data, error } = await supabase
      .from("detalle_comanda")
      .select("*")
      .eq("id_comanda", idComanda)
      .order("id_detalle_comanda", { ascending: true });

    if (error) throw new Error(`Error al listar detalles de la comanda: ${error.message}`);
    return (data as DetalleComandaRow[]).map(mapearDetalleComandaRow);
  }

  async obtenerPorId(id: number): Promise<DetalleComanda | null> {
    const { data, error } = await supabase
      .from("detalle_comanda")
      .select("*")
      .eq("id_detalle_comanda", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error al obtener detalle de comanda: ${error.message}`);
    }
    return mapearDetalleComandaRow(data as DetalleComandaRow);
  }

  async crearDetalleComanda(datos: CrearDetalleComanda): Promise<DetalleComanda> {
    const { data, error } = await supabase
      .from("detalle_comanda")
      .insert({
        id_comanda: datos.idComanda,
        id_producto: datos.idProducto,
        cantidad: datos.cantidad,
        nota: datos.nota ?? null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23503") throw new Error("La comanda o el producto indicado no existe");
      throw new Error(`Error al crear detalle de comanda: ${error.message}`);
    }
    return mapearDetalleComandaRow(data as DetalleComandaRow);
  }

  async actualizarDetalleComanda(id: number, cambios: ActualizarDetalleComanda): Promise<void> {
    const campos: Record<string, unknown> = {};
    if (cambios.idProducto !== undefined) campos.id_producto = cambios.idProducto;
    if (cambios.cantidad !== undefined) campos.cantidad = cambios.cantidad;
    if (cambios.nota !== undefined) campos.nota = cambios.nota;

    if (Object.keys(campos).length === 0) return;

    const { error } = await supabase
      .from("detalle_comanda")
      .update(campos)
      .eq("id_detalle_comanda", id);

    if (error) {
      if (error.code === "23503") throw new Error("El producto indicado no existe");
      throw new Error(`Error al actualizar detalle de comanda: ${error.message}`);
    }
  }

  async eliminarDetalleComanda(id: number): Promise<void> {
    const { error } = await supabase
      .from("detalle_comanda")
      .delete()
      .eq("id_detalle_comanda", id);

    if (error) throw new Error(`Error al eliminar detalle de comanda: ${error.message}`);
  }
}