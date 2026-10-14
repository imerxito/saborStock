import { supabase } from "../configuracion/Supabase.js";
import { Comanda, ComandaRow, CrearComanda, ActualizarComanda } from "../modelos/Comanda.js";
import { EstadoComanda } from "../modelos/EstadoComanda.js";

function mapearComandaRow(row: ComandaRow): Comanda {
  return {
    id: row.id_comanda,
    idMesa: row.id_mesa,
    idUsuario: row.id_usuario,
    estado: row.estado,
    observacion: row.observacion,
    fechaCreacion: new Date(row.fecha_creacion),
  };
}

export class ComandaRepositorio {
  async listar(): Promise<Comanda[]> {
    const { data, error } = await supabase
      .from("comanda")
      .select("*")
      .order("fecha_creacion", { ascending: false });

    if (error) throw new Error(`Error al listar comandas: ${error.message}`);
    return (data as ComandaRow[]).map(mapearComandaRow);
  }

  async obtenerPorId(id: number): Promise<Comanda | null> {
    const { data, error } = await supabase
      .from("comanda")
      .select("*")
      .eq("id_comanda", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error al obtener comanda: ${error.message}`);
    }
    return mapearComandaRow(data as ComandaRow);
  }

  async crearComanda(datos: CrearComanda): Promise<Comanda> {
    const { data, error } = await supabase
      .from("comanda")
      .insert({
        id_mesa: datos.idMesa ?? null,
        id_usuario: datos.idUsuario ?? null,
        estado: datos.estado ?? EstadoComanda.Abierto,
        observacion: datos.observacion ?? null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23503") throw new Error("La mesa o el usuario indicado no existe");
      throw new Error(`Error al crear comanda: ${error.message}`);
    }
    return mapearComandaRow(data as ComandaRow);
  }

  async actualizarComanda(id: number, cambios: ActualizarComanda): Promise<void> {
    const campos: Record<string, unknown> = {};
    if (cambios.idMesa !== undefined) campos.id_mesa = cambios.idMesa;
    if (cambios.idUsuario !== undefined) campos.id_usuario = cambios.idUsuario;
    if (cambios.estado !== undefined) campos.estado = cambios.estado;
    if (cambios.observacion !== undefined) campos.observacion = cambios.observacion;

    if (Object.keys(campos).length === 0) return;

    const { error } = await supabase
      .from("comanda")
      .update(campos)
      .eq("id_comanda", id);

    if (error) {
      if (error.code === "23503") throw new Error("La mesa o el usuario indicado no existe");
      throw new Error(`Error al actualizar comanda: ${error.message}`);
    }
  }
}