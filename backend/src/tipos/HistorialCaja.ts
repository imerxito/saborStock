import { MetodoPagoSimple } from './MetodoPagoSimple.js';
import { TipoPago } from './TipoPago.js';
import { aFecha, aNumero } from './mapeo.js';

export interface HistorialCajaRow {
  id_historial_caja: number;
  id_turno_caja: number;
  id_usuario: number;
  id_factura: number | null;
  metodo_pago: MetodoPagoSimple;
  tipo_pago: TipoPago;
  monto: number | string;
  descripcion: string | null;
  fecha_movimiento: string;
}

export interface HistorialCaja {
  id: number;
  idTurnoCaja: number;
  idUsuario: number;
  idFactura: number | null;
  metodoPago: MetodoPagoSimple;
  tipoPago: TipoPago;
  monto: number;
  descripcion: string | null;
  fechaMovimiento: Date;
}

export interface CrearHistorialCajaDTO {
  idTurnoCaja: number;
  idUsuario: number;
  idFactura?: number | null;
  metodoPago: MetodoPagoSimple;
  tipoPago: TipoPago;
  monto: number;
  descripcion?: string | null;
}

export function mapHistorialCajaFromRow(row: HistorialCajaRow): HistorialCaja {
  return {
    id: row.id_historial_caja,
    idTurnoCaja: row.id_turno_caja,
    idUsuario: row.id_usuario,
    idFactura: row.id_factura,
    metodoPago: row.metodo_pago,
    tipoPago: row.tipo_pago,
    monto: aNumero(row.monto),
    descripcion: row.descripcion,
    fechaMovimiento: aFecha(row.fecha_movimiento),
  };
}
