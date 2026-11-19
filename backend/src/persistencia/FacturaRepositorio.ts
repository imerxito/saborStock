import { supabase } from "../configuracion/Supabase.js";
import { Factura, FacturaRow, mapFacturaFromRow } from "../modelos/Factura.js";
import { MetodoPago } from "../tipos/MetodoPago.js";
import { EstadoFactura } from "../tipos/EstadoFactura.js";

export interface DatosCrearFactura {
    idVenta?: number | null;
    idMesa: number | null;
    idUsuario: number;
    cliente?: string;
    subtotal: number;
    descuento: number;
    propina: number;
    totalPagar: number;
    metodoPago: MetodoPago;
    montoEfectivo?: number | null;
    montoTarjeta?: number | null;
    montoTransferencia?: number | null;
    estado?: EstadoFactura;
}

export interface DatosActualizarFactura {
    idVenta?: number | null;
    idMesa?: number | null;
    idUsuario?: number;
    cliente?: string;
    subtotal?: number;
    descuento?: number;
    propina?: number;
    totalPagar?: number;
    metodoPago?: MetodoPago;
    montoEfectivo?: number | null;
    montoTarjeta?: number | null;
    montoTransferencia?: number | null;
    estado?: EstadoFactura;
}

export class FacturaRepositorio {
    async listar(limite: number = 200): Promise<Factura[]> {
        let query = supabase
            .from("factura")
            .select(`
                *,
                usuario:id_usuario(nombre),
                mesa:id_mesa(id_mesa, numero, id_seccion, seccion:id_seccion(nombre)),
                venta:id_venta(id_mesa, cliente, mesa:id_mesa(numero, id_seccion, seccion:id_seccion(nombre))),
                detalle_factura(*, producto:id_producto(nombre, precio_venta))
            `)
            .order("fecha_emision", { ascending: false });

        if (limite > 0) {
            query = query.limit(limite);
        }

        const { data, error } = await query;

        if (error) throw new Error(`Error al listar facturas: ${error.message}`);
        return (data as FacturaRow[]).map(mapFacturaFromRow);
    }

    async obtenerPorId(id: number): Promise<Factura | null> {
        const { data, error } = await supabase
            .from("factura")
            .select(`
                *,
                usuario:id_usuario(nombre),
                mesa:id_mesa(id_mesa, numero, id_seccion, seccion:id_seccion(nombre)),
                venta:id_venta(id_mesa, cliente, mesa:id_mesa(numero, id_seccion, seccion:id_seccion(nombre))),
                detalle_factura(*, producto:id_producto(nombre, precio_venta))
            `)
            .eq("id_factura", id)
            .maybeSingle();

        if (error) throw new Error(`Error al obtener factura: ${error.message}`);
        return data ? mapFacturaFromRow(data as FacturaRow) : null;
    }

    async crearFactura(datos: DatosCrearFactura): Promise<Factura> {
        const { data, error } = await supabase
            .from("factura")
            .insert({
                id_venta: datos.idVenta ?? null,
                id_mesa: datos.idMesa && datos.idMesa > 0 ? datos.idMesa : null,
                id_usuario: datos.idUsuario,
                cliente: datos.cliente?.trim() || "Consumidor Final",
                subtotal: datos.subtotal,
                descuento: datos.descuento,
                propina: datos.propina,
                total_pagar: datos.totalPagar,
                metodo_pago: datos.metodoPago,
                monto_efectivo: datos.montoEfectivo ?? null,
                monto_tarjeta: datos.montoTarjeta ?? null,
                monto_transferencia: datos.montoTransferencia ?? null,
                estado: datos.estado ?? "Pagada",
            })
            .select()
            .single();

        if (error) {
            if (error.code === "23503") throw new Error("La venta, mesa o usuario indicado no existe");
            if (error.code === "23514") throw new Error("Los valores de la factura no son válidos");
            throw new Error(`Error al crear factura: ${error.message}`);
        }
        return mapFacturaFromRow(data as FacturaRow);
    }

    async actualizarFactura(id: number, cambios: DatosActualizarFactura): Promise<void> {
        const campos: Record<string, unknown> = {};
        if (cambios.idVenta !== undefined) campos.id_venta = cambios.idVenta;
        if (cambios.idMesa !== undefined) campos.id_mesa = cambios.idMesa && cambios.idMesa > 0 ? cambios.idMesa : null;
        if (cambios.idUsuario !== undefined) campos.id_usuario = cambios.idUsuario;
        if (cambios.cliente !== undefined) campos.cliente = cambios.cliente;
        if (cambios.subtotal !== undefined) campos.subtotal = cambios.subtotal;
        if (cambios.descuento !== undefined) campos.descuento = cambios.descuento;
        if (cambios.propina !== undefined) campos.propina = cambios.propina;
        if (cambios.totalPagar !== undefined) campos.total_pagar = cambios.totalPagar;
        if (cambios.metodoPago !== undefined) campos.metodo_pago = cambios.metodoPago;
        if (cambios.montoEfectivo !== undefined) campos.monto_efectivo = cambios.montoEfectivo;
        if (cambios.montoTarjeta !== undefined) campos.monto_tarjeta = cambios.montoTarjeta;
        if (cambios.montoTransferencia !== undefined) campos.monto_transferencia = cambios.montoTransferencia;
        if (cambios.estado !== undefined) campos.estado = cambios.estado;

        if (Object.keys(campos).length === 0) return;

        const { error } = await supabase
            .from("factura")
            .update(campos)
            .eq("id_factura", id);

        if (error) {
            if (error.code === "23503") throw new Error("La venta, mesa o usuario indicado no existe");
            if (error.code === "23514") throw new Error("Los valores de la factura no son válidos");
            throw new Error(`Error al actualizar factura: ${error.message}`);
        }
    }
}
