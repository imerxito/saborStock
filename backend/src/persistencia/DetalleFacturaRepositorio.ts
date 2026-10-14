import { supabase } from "../configuracion/Supabase.js";
import { DetalleFactura, DetalleFacturaRow } from "../modelos/DetalleFactura.js";

function mapearDetalleFacturaRow(row: DetalleFacturaRow): DetalleFactura {
  return {
    id: row.id_detalle_factura,
    idFactura: row.id_factura,
    idProducto: row.id_producto,
    cantidad: Number(row.cantidad),
    precioUnitario: Number(row.precio_unitario),
    subtotal: Number(row.subtotal),
  };
}

// Datos ya calculados por el servicio (incluye subtotal)
export interface DatosCrearDetalleFactura {
  idFactura: number;
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface DatosActualizarDetalleFactura {
  idProducto?: number;
  cantidad?: number;
  precioUnitario?: number;
  subtotal?: number;
}

export class DetalleFacturaRepositorio {
  async listar(): Promise<DetalleFactura[]> {
    const { data, error } = await supabase
      .from("detalle_factura")
      .select("*")
      .order("id_detalle_factura", { ascending: true });

    if (error) throw new Error(`Error al listar detalles de factura: ${error.message}`);
    return (data as DetalleFacturaRow[]).map(mapearDetalleFacturaRow);
  }

  async listarPorFactura(idFactura: number): Promise<DetalleFactura[]> {
    const { data, error } = await supabase
      .from("detalle_factura")
      .select("*")
      .eq("id_factura", idFactura)
      .order("id_detalle_factura", { ascending: true });

    if (error) throw new Error(`Error al listar detalles de la factura: ${error.message}`);
    return (data as DetalleFacturaRow[]).map(mapearDetalleFacturaRow);
  }

  async obtenerPorId(id: number): Promise<DetalleFactura | null> {
    const { data, error } = await supabase
      .from("detalle_factura")
      .select("*")
      .eq("id_detalle_factura", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error al obtener detalle de factura: ${error.message}`);
    }
    return mapearDetalleFacturaRow(data as DetalleFacturaRow);
  }

  // Precio de venta actual del producto (el producto es de otro módulo, solo se consulta)
  async obtenerPrecioProducto(idProducto: number): Promise<number | null> {
    const { data, error } = await supabase
      .from("producto")
      .select("precio_venta")
      .eq("id_producto", idProducto)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error al consultar el producto: ${error.message}`);
    }
    return Number((data as { precio_venta: number }).precio_venta);
  }

  async crearDetalleFactura(datos: DatosCrearDetalleFactura): Promise<DetalleFactura> {
    const { data, error } = await supabase
      .from("detalle_factura")
      .insert({
        id_factura: datos.idFactura,
        id_producto: datos.idProducto,
        cantidad: datos.cantidad,
        precio_unitario: datos.precioUnitario,
        subtotal: datos.subtotal,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23503") throw new Error("La factura o el producto indicado no existe");
      if (error.code === "23514") throw new Error("Cantidad, precio y subtotal deben ser valores validos");
      throw new Error(`Error al crear detalle de factura: ${error.message}`);
    }
    return mapearDetalleFacturaRow(data as DetalleFacturaRow);
  }

  async actualizarDetalleFactura(id: number, cambios: DatosActualizarDetalleFactura): Promise<void> {
    const campos: Record<string, unknown> = {};
    if (cambios.idProducto !== undefined) campos.id_producto = cambios.idProducto;
    if (cambios.cantidad !== undefined) campos.cantidad = cambios.cantidad;
    if (cambios.precioUnitario !== undefined) campos.precio_unitario = cambios.precioUnitario;
    if (cambios.subtotal !== undefined) campos.subtotal = cambios.subtotal;

    if (Object.keys(campos).length === 0) return;

    const { error } = await supabase
      .from("detalle_factura")
      .update(campos)
      .eq("id_detalle_factura", id);

    if (error) {
      if (error.code === "23503") throw new Error("El producto indicado no existe");
      if (error.code === "23514") throw new Error("Cantidad, precio y subtotal deben ser valores validos");
      throw new Error(`Error al actualizar detalle de factura: ${error.message}`);
    }
  }

  async eliminarDetalleFactura(id: number): Promise<void> {
    const { error } = await supabase
      .from("detalle_factura")
      .delete()
      .eq("id_detalle_factura", id);

    if (error) throw new Error(`Error al eliminar detalle de factura: ${error.message}`);
  }
}