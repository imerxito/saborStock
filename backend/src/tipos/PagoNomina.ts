import { MetodoPagoSimple } from './MetodoPagoSimple.js';
import { aFecha, aNumero } from './mapeo.js';

export interface PagoNominaRow {
  id_pago_nomina: number;
  id_usuario: number;
  id_turno_caja: number | null;
  monto_base: number | string;
  bono: number | string;
  monto_total: number | string;
  metodo_pago: MetodoPagoSimple;
  fecha: string;
}

export interface PagoNomina {
  id: number;
  idUsuario: number;
  idTurnoCaja: number | null;
  montoBase: number;
  bono: number;
  montoTotal: number;
  metodoPago: MetodoPagoSimple;
  fecha: Date;
}

export interface CrearPagoNominaDTO {
  idUsuario: number;
  idTurnoCaja?: number | null;
  montoBase?: number;
  bono?: number;
  metodoPago: MetodoPagoSimple;
  fecha: Date;
}

export function mapPagoNominaFromRow(row: PagoNominaRow): PagoNomina {
  return {
    id: row.id_pago_nomina,
    idUsuario: row.id_usuario,
    idTurnoCaja: row.id_turno_caja,
    montoBase: aNumero(row.monto_base),
    bono: aNumero(row.bono),
    montoTotal: aNumero(row.monto_total),
    metodoPago: row.metodo_pago,
    fecha: aFecha(row.fecha),
  };
}
