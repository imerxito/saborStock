import { EstadoTurno } from './EstadoTurno.js';
import { aFecha, aFechaNull, aNumero, aNumeroNull } from './mapeo.js';

export interface TurnoCajaRow {
  id_turno_caja: number;
  id_caja: number;
  id_usuario_apertura: number;
  id_usuario_cierre: number | null;
  fecha_apertura: string;
  fecha_cierre: string | null;
  monto_inicial: number | string;
  monto_final: number | string | null;
  estado: EstadoTurno;
  ventas_efectivo: number | string;
  ventas_tarjeta: number | string;
  ventas_transferencia: number | string;
  total_generado: number | string;
  egresos_totales: number | string;
  diferencia: number | string;
}

export interface TurnoCaja {
  id: number;
  idCaja: number;
  idUsuarioApertura: number;
  idUsuarioCierre: number | null;
  fechaApertura: Date;
  fechaCierre: Date | null;
  montoInicial: number;
  montoFinal: number | null;
  estado: EstadoTurno;
  ventasEfectivo: number;
  ventasTarjeta: number;
  ventasTransferencia: number;
  totalGenerado: number;
  egresosTotales: number;
  diferencia: number;
}

export interface AbrirTurnoDTO {
  idCaja: number;
  idUsuarioApertura: number;
  montoInicial: number;
}

export interface CerrarTurnoDTO {
  idUsuarioCierre: number;
  montoFinal: number;
}

export function mapTurnoCajaFromRow(row: TurnoCajaRow): TurnoCaja {
  return {
    id: row.id_turno_caja,
    idCaja: row.id_caja,
    idUsuarioApertura: row.id_usuario_apertura,
    idUsuarioCierre: row.id_usuario_cierre,
    fechaApertura: aFecha(row.fecha_apertura),
    fechaCierre: aFechaNull(row.fecha_cierre),
    montoInicial: aNumero(row.monto_inicial),
    montoFinal: aNumeroNull(row.monto_final),
    estado: row.estado,
    ventasEfectivo: aNumero(row.ventas_efectivo),
    ventasTarjeta: aNumero(row.ventas_tarjeta),
    ventasTransferencia: aNumero(row.ventas_transferencia),
    totalGenerado: aNumero(row.total_generado),
    egresosTotales: aNumero(row.egresos_totales),
    diferencia: aNumero(row.diferencia),
  };
}
