import { supabase } from "../configuracion/Supabase.js";
import { Comanda, ComandaRow, CrearComanda, ActualizarComanda, ItemComandaDetalle } from "../modelos/Comanda.js";
import { EstadoComanda } from "../modelos/EstadoComanda.js";

function mapearComandaCompleta(row: any): Comanda {
  const detalles: ItemComandaDetalle[] = Array.isArray(row.detalle_comanda)
    ? row.detalle_comanda.map((d: any) => ({
        id: d.id_detalle_comanda,
        idProducto: d.id_producto,
        nombreProducto: d.producto?.nombre ?? `Producto #${d.id_producto}`,
        precio: d.producto?.precio_venta ?? 0,
        cantidad: d.cantidad,
        nota: d.nota ?? null,
      }))
    : [];

  return {
    id: row.id_comanda,
    idMesa: row.id_mesa,
    idUsuario: row.id_usuario,
    estado: row.estado,
    observacion: row.observacion,
    fechaCreacion: new Date(row.fecha_creacion),
    mesaNumero: row.mesa?.numero ?? null,
    usuarioNombre: row.usuario?.nombre ?? null,
    detalles,
  };
}

export class ComandaRepositorio {
  async listar(): Promise<Comanda[]> {
    const { data, error } = await supabase
      .from("comanda")
      .select("*, mesa:id_mesa(id_mesa, numero, estado), usuario:id_usuario(id_usuario, nombre), detalle_comanda(*, producto:id_producto(*))")
      .order("fecha_creacion", { ascending: false });

    if (error) throw new Error(`Error al listar comandas: ${error.message}`);
    return (data || []).map(mapearComandaCompleta);
  }

  async obtenerPorId(id: number): Promise<Comanda | null> {
    const { data, error } = await supabase
      .from("comanda")
      .select("*, mesa:id_mesa(id_mesa, numero, estado), usuario:id_usuario(id_usuario, nombre), detalle_comanda(*, producto:id_producto(*))")
      .eq("id_comanda", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error al obtener comanda: ${error.message}`);
    }
    return mapearComandaCompleta(data);
  }

  async crearComanda(datos: CrearComanda): Promise<Comanda> {
    const { data, error } = await supabase
      .from("comanda")
      .insert({
        id_mesa: datos.idMesa ?? null,
        id_usuario: datos.idUsuario ?? null,
        estado: datos.estado ?? EstadoComanda.Pendiente,
        observacion: datos.observacion ?? null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23503") throw new Error("La mesa o el usuario indicado no existe");
      throw new Error(`Error al crear comanda: ${error.message}`);
    }
    return {
      id: data.id_comanda,
      idMesa: data.id_mesa,
      idUsuario: data.id_usuario,
      estado: data.estado,
      observacion: data.observacion,
      fechaCreacion: new Date(data.fecha_creacion),
      detalles: [],
    };
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
