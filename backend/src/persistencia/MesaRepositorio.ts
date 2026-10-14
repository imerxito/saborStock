import { supabase } from "../configuracion/Supabase.js";
import { Mesa, MesaRow, CrearMesa, ActualizarMesa } from "../modelos/Mesa.js";
import { EstadoMesa } from "../modelos/EstadoMesa.js";

function mapearMesaRow(row: MesaRow): Mesa {
  return {
    id: row.id_mesa,
    numero: row.numero,
    estado: row.estado,
    idSeccion: row.id_seccion,
    idUsuario: row.id_usuario,
  };
}

export class MesaRepositorio {
  async listar(): Promise<Mesa[]> {
    const { data, error } = await supabase
      .from("mesa")
      .select("*")
      .order("numero", { ascending: true });

    if (error) throw new Error(`Error al listar mesas: ${error.message}`);
    return (data as MesaRow[]).map(mapearMesaRow);
  }

  async obtenerPorId(id: number): Promise<Mesa | null> {
    const { data, error } = await supabase
      .from("mesa")
      .select("*")
      .eq("id_mesa", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error al obtener mesa: ${error.message}`);
    }
    return mapearMesaRow(data as MesaRow);
  }

    async crearMesa(datos: CrearMesa): Promise<Mesa> {
    const { data, error } = await supabase
      .from("mesa")
      .insert({
        numero: datos.numero,
        estado: datos.estado ?? EstadoMesa.Libre,
        id_seccion: datos.idSeccion,
        id_usuario: datos.idUsuario,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") throw new Error("Ya existe una mesa con ese número");
      if (error.code === "23503") throw new Error("La sección o el usuario indicado no existe");
      throw new Error(`Error al crear mesa: ${error.message}`);
    }
    return mapearMesaRow(data as MesaRow);
  }

  async actualizarMesa(id: number, cambios: ActualizarMesa): Promise<void> {
    const campos: Record<string, unknown> = {};
    if (cambios.numero !== undefined) campos.numero = cambios.numero;
    if (cambios.estado !== undefined) campos.estado = cambios.estado;
    if (cambios.idSeccion !== undefined) campos.id_seccion = cambios.idSeccion;
    if (cambios.idUsuario !== undefined) campos.id_usuario = cambios.idUsuario;

    if (Object.keys(campos).length === 0) return;

    const { error } = await supabase
      .from("mesa")
      .update(campos)
      .eq("id_mesa", id);

    if (error) {
      if (error.code === "23505") throw new Error("Ya existe una mesa con ese número");
      if (error.code === "23503") throw new Error("La sección o el usuario indicado no existe");
      throw new Error(`Error al actualizar mesa: ${error.message}`);
    }
  }


}
