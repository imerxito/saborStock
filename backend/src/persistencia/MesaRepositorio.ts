import { supabase } from "../configuracion/Supabase.js";
import { Mesa, MesaRow, CrearMesa, ActualizarMesa } from "../modelos/Mesa.js";
import { EstadoMesa } from "../modelos/EstadoMesa.js";

function mapearMesaRow(row: any): Mesa {
  return {
    id: row.id_mesa,
    numero: row.numero,
    estado: row.estado,
    idSeccion: row.id_seccion,
    idUsuario: row.id_usuario,
    seccionNombre: row.seccion?.nombre ?? "Salón Principal",
  };
}

export class MesaRepositorio {
  async listar(): Promise<Mesa[]> {
    const { data, error } = await supabase
      .from("mesa")
      .select("*, seccion:id_seccion(id_seccion, nombre)")
      .order("numero", { ascending: true });

    if (error) throw new Error(`Error al listar mesas: ${error.message}`);
    return (data || []).map(mapearMesaRow);
  }

  async obtenerPorId(id: number): Promise<Mesa | null> {
    const { data, error } = await supabase
      .from("mesa")
      .select("*, seccion:id_seccion(id_seccion, nombre)")
      .eq("id_mesa", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error al obtener mesa: ${error.message}`);
    }
    return mapearMesaRow(data);
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
      .select("*, seccion:id_seccion(id_seccion, nombre)")
      .single();

    if (error) {
      if (error.code === "23505") throw new Error("Ya existe una mesa con ese número");
      if (error.code === "23503") throw new Error("La sección o el usuario indicado no existe");
      throw new Error(`Error al crear mesa: ${error.message}`);
    }
    return mapearMesaRow(data);
  }

    async contarPorSeccion(idSeccion: number): Promise<number> {
        const { count, error } = await supabase
            .from("mesa")
            .select("id_mesa", { count: "exact", head: true })
            .eq("id_seccion", idSeccion);

        if (error) throw new Error(`Error al contar mesas de la sección: ${error.message}`);
        return count ?? 0;
    }

    async listarNumeros(): Promise<number[]> {
        const { data, error } = await supabase
            .from("mesa")
            .select("numero");

        if (error) throw new Error(`Error al listar números de mesa: ${error.message}`);
        return (data || []).map((fila: { numero: number }) => Number(fila.numero));
    }

    async eliminarMesa(id: number): Promise<void> {
        const { error } = await supabase
            .from("mesa")
            .delete()
            .eq("id_mesa", id);

        if (error) {
            if (error.code === "23503") {
                throw new Error("No se puede borrar la mesa porque tiene pedidos o historial asociado");
            }
            throw new Error(`Error al eliminar mesa: ${error.message}`);
        }
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
