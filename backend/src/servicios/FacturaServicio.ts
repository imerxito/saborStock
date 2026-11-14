import { Factura, CrearFactura, ActualizarFactura } from "../modelos/Factura.js";
import { FacturaRepositorio } from "../persistencia/FacturaRepositorio.js";
import { DetalleFacturaRepositorio } from "../persistencia/DetalleFacturaRepositorio.js";
import { ComandaRepositorio } from "../persistencia/ComandaRepositorio.js";
import { VentaRepositorio } from "../persistencia/VentaRepositorio.js";
import { InventarioServicio } from "./InventarioServicio.js";
import { supabase } from "../configuracion/Supabase.js";
import { MetodoPago } from "../tipos/MetodoPago.js";

export interface DetalleCobro {
    idProducto: number;
    cantidad: number;
    precioUnitario: number;
}

export interface CobrarFactura extends CrearFactura {
    idVenta?: number | null;
    cliente?: string;
    descuento?: number;
    metodoPago?: MetodoPago;
    montoEfectivo?: number;
    montoTarjeta?: number;
    montoTransferencia?: number;
    idTurnoCaja?: number;
    idsComandas?: number[];
    cerrarComandas?: boolean;
    cerrarVenta?: boolean;
    detalles?: DetalleCobro[];
}

export class FacturaServicio {
    constructor(
        private facturaRepo = new FacturaRepositorio(),
        private detalleRepo = new DetalleFacturaRepositorio(),
        private comandaRepo = new ComandaRepositorio(),
        private ventaRepo = new VentaRepositorio(),
        private inventarioServicio = new InventarioServicio()
    ) {}

    async listar(): Promise<Factura[]> {
        return this.facturaRepo.listar();
    }

    async obtenerPorId(id: number): Promise<Factura> {
        const factura = await this.facturaRepo.obtenerPorId(id);
        if (!factura) throw new Error("Factura no encontrada");
        return factura;
    }

    async crear(datos: CobrarFactura): Promise<Factura> {
        let idUsuario = Number(datos.idUsuario);
        const { data: userExists } = await supabase
            .from("usuario")
            .select("id_usuario")
            .eq("id_usuario", idUsuario)
            .maybeSingle();
        if (!userExists) {
            const { data: primerUser } = await supabase
                .from("usuario")
                .select("id_usuario")
                .limit(1)
                .maybeSingle();
            idUsuario = primerUser?.id_usuario ?? 1;
        }

        const idMesa = datos.idMesa && datos.idMesa > 0 ? datos.idMesa : null;
        const subtotal = Math.max(0, Number(datos.subtotal ?? 0));
        const propina = Math.max(0, Number(datos.propina ?? 0));
        const descuento = Math.max(0, Number(datos.descuento ?? 0));
        const totalPagar = Math.max(0, subtotal - descuento + propina);

        const metodoPago = this.normalizarMetodoPago(datos.metodoPago);
        const detalles = await this.resolverDetallesVenta(datos);

        const factura = await this.facturaRepo.crearFactura({
            idVenta: datos.idVenta ?? null,
            idMesa,
            idUsuario,
            cliente: datos.cliente,
            subtotal,
            descuento,
            propina,
            totalPagar,
            metodoPago,
            montoEfectivo: datos.montoEfectivo ?? (metodoPago === "efectivo" ? totalPagar : 0),
            montoTarjeta: datos.montoTarjeta ?? (metodoPago === "tarjeta" ? totalPagar : 0),
            montoTransferencia: datos.montoTransferencia ?? (metodoPago === "transferencia" ? totalPagar : 0),
            estado: "Pagada",
        });

        for (const d of detalles) {
            const precio = Number(d.precioUnitario) || 0;
            await this.detalleRepo.crearDetalleFactura({
                idFactura: factura.id,
                idProducto: d.idProducto,
                cantidad: d.cantidad,
                precioUnitario: precio,
                subtotal: precio * d.cantidad,
            });
        }

        try {
            await this.inventarioServicio.descontarPorVenta(
                detalles.map((d) => ({ idProducto: d.idProducto, cantidad: d.cantidad })),
                `Factura #${factura.id}`
            );
        } catch (error: any) {
            console.warn(`Aviso al descontar inventario en Factura #${factura.id}:`, error.message);
        }

        // El trigger tg_factura_caja registra el ingreso en historial_caja
        // y marca la venta como Pagada al insertar la factura.
        await this.cerrarDocumentos(datos);

        if (idMesa) {
            await supabase.from("mesa").update({ estado: "Libre" }).eq("id_mesa", idMesa);
        }

        if (idMesa && datos.idVenta) {
            await this.registrarHistorialPago(idMesa, datos.idVenta, idUsuario, factura.id, totalPagar);
        }

        return factura;
    }

    private normalizarMetodoPago(metodo?: string): "efectivo" | "tarjeta" | "transferencia" | "mixto" {
        const valor = String(metodo || "efectivo").toLowerCase();
        if (valor === "tarjeta" || valor === "transferencia" || valor === "mixto") return valor;
        return "efectivo";
    }

    private async registrarHistorialPago(
        idMesa: number,
        idVenta: number,
        idUsuario: number,
        idFactura: number,
        monto: number
    ): Promise<void> {
        const { error } = await supabase.from("historial_mesa").insert({
            id_mesa: idMesa,
            id_venta: idVenta,
            id_usuario: idUsuario,
            estado: "Pagando",
            monto,
            motivo: `Factura #${idFactura}`,
        });
        if (error) console.error(`No se pudo registrar historial_mesa del pago: ${error.message}`);
    }

    private async resolverDetallesVenta(datos: CobrarFactura): Promise<DetalleCobro[]> {
        const detalles = (Array.isArray(datos.detalles) ? datos.detalles : [])
            .filter((d) => Number.isInteger(d.idProducto) && d.idProducto > 0 && Number.isFinite(d.cantidad) && d.cantidad > 0);

        if (detalles.length > 0 || !datos.idVenta) return detalles;

        const { data: comandas, error: errorComandas } = await supabase
            .from("comanda")
            .select("id_comanda")
            .eq("id_venta", datos.idVenta)
            .neq("estado", "Cerrado");

        if (errorComandas) {
            throw new Error(`Error al consultar comandas de la venta: ${errorComandas.message}`);
        }

        const idsComandas = (comandas || []).map((c: any) => c.id_comanda);
        if (idsComandas.length === 0) return [];

        const { data: detallesComanda, error: errorDetalles } = await supabase
            .from("detalle_comanda")
            .select("id_producto, cantidad")
            .in("id_comanda", idsComandas);

        if (errorDetalles) {
            throw new Error(`Error al consultar detalles de comanda: ${errorDetalles.message}`);
        }

        const agregados = new Map<number, number>();
        for (const d of detallesComanda || []) {
            agregados.set(d.id_producto, (agregados.get(d.id_producto) ?? 0) + Number(d.cantidad));
        }

        const idsProductos = Array.from(agregados.keys());
        const { data: productos, error: errorProductos } = idsProductos.length > 0
            ? await supabase
                .from("producto")
                .select("id_producto, precio_venta")
                .in("id_producto", idsProductos)
            : { data: [], error: null };

        if (errorProductos) {
            throw new Error(`Error al consultar precios de productos: ${errorProductos.message}`);
        }

        const precios = new Map<number, number>(
            (productos || []).map((p: any) => [p.id_producto, Number(p.precio_venta)])
        );

        return Array.from(agregados.entries()).map(([idProducto, cantidad]) => ({
            idProducto,
            cantidad,
            precioUnitario: precios.get(idProducto) ?? 0
        }));
    }

    private async limpiarFacturaFallida(idFactura: number): Promise<void> {
        const { error: errorDetalles } = await supabase
            .from("detalle_factura")
            .delete()
            .eq("id_factura", idFactura);
        if (errorDetalles) {
            console.error(`No se pudieron eliminar los detalles de la factura ${idFactura}:`, errorDetalles.message);
        }

        const { error: errorFactura } = await supabase
            .from("factura")
            .delete()
            .eq("id_factura", idFactura);
        if (errorFactura) {
            console.error(`No se pudo eliminar la factura ${idFactura}:`, errorFactura.message);
        }
    }

    private async cerrarDocumentos(datos: CobrarFactura) {
        const cerrarComandas = datos.cerrarComandas !== false;
        const cerrarVenta = datos.cerrarVenta ?? cerrarComandas;

        const ids = new Set<number>(datos.idsComandas || []);
        if (cerrarComandas && datos.idVenta) {
            const { data } = await supabase
                .from("comanda")
                .select("id_comanda")
                .eq("id_venta", datos.idVenta)
                .neq("estado", "Cerrado");
            for (const row of data || []) ids.add(row.id_comanda);
        }

        if (cerrarComandas) {
            for (const id of ids) {
                await this.comandaRepo.actualizarComanda(id, { estado: "Cerrado" as any });
            }
        }

        if (cerrarVenta && datos.idVenta) {
            await this.ventaRepo.cerrar(datos.idVenta);
        }
    }

    async actualizar(id: number, cambios: ActualizarFactura): Promise<Factura> {
        if (cambios.idMesa !== undefined && cambios.idMesa !== null && !(cambios.idMesa > 0)) {
            throw new Error("La mesa debe ser mayor a 0");
        }
        if (cambios.idUsuario !== undefined && !(cambios.idUsuario > 0)) {
            throw new Error("El usuario debe ser mayor a 0");
        }
        if (cambios.subtotal !== undefined && cambios.subtotal < 0) {
            throw new Error("El subtotal no puede ser negativo");
        }
        if (cambios.descuento !== undefined && cambios.descuento < 0) {
            throw new Error("El descuento no puede ser negativo");
        }
        if (cambios.propina !== undefined && cambios.propina < 0) {
            throw new Error("La propina no puede ser negativa");
        }

        const actual = await this.obtenerPorId(id);
        const subtotal = cambios.subtotal ?? actual.subtotal;
        const descuento = cambios.descuento ?? actual.descuento;
        const propina = cambios.propina ?? actual.propina;

        await this.facturaRepo.actualizarFactura(id, {
            ...cambios,
            subtotal,
            descuento,
            propina,
            totalPagar: Math.max(0, subtotal - descuento + propina),
            metodoPago: cambios.metodoPago ? this.normalizarMetodoPago(cambios.metodoPago) : undefined,
        });
        return this.obtenerPorId(id);
    }
}
