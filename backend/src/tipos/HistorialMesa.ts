import { EstadoMesa } from './EstadoMesa.js';
import { aFecha, aNumeroNull } from './mapeo.js';

export interface HistorialMesaRow {
  id_historial_mesa: number;
  id_mesa: number;
  id_venta: number | null;
  id_usuario: number;
  estado: EstadoMesa;
  monto: number | string | null;
  motivo: string | null;
  fecha_accion: string;
}

export interface HistorialMesa {
  id: number;
  idMesa: number;
  idVenta: number | null;
  idUsuario: number;
  estado: EstadoMesa;
  monto: number | null;
  motivo: string | null;
  fechaAccion: Date;
}

export interface CrearHistorialMesaDTO {
  idMesa: number;
  idVenta?: number | null;
  idUsuario: number;
  estado: EstadoMesa;
  monto?: number | null;
  motivo?: string | null;
}

export function mapHistorialMesaFromRow(row: HistorialMesaRow): HistorialMesa {
  return {
    id: row.id_historial_mesa,
    idMesa: row.id_mesa,
    idVenta: row.id_venta,
    idUsuario: row.id_usuario,
    estado: row.estado,
    monto: aNumeroNull(row.monto),
    motivo: row.motivo,
    fechaAccion: aFecha(row.fecha_accion),
  };
}
