import { EstadoVenta } from '../tipos/EstadoVenta.js';
import { aFecha, aFechaNull } from '../tipos/mapeo.js';

export type { EstadoVenta };

export interface VentaRow {
  id_venta: number;
  id_mesa: number | null;
  cliente: string;
  personas: number;
  id_usuario: number | null;
  estado: EstadoVenta;
  fecha_apertura: string;
  fecha_cierre: string | null;
  observacion: string | null;
}

export interface Venta {
  id: number;
  idMesa: number | null;
  cliente: string;
  personas: number;
  idUsuario: number | null;
  estado: EstadoVenta;
  fechaApertura: Date;
  fechaCierre: Date | null;
  observacion: string | null;
}

export interface CrearVentaDTO {
  idMesa?: number | null;
  cliente?: string;
  personas?: number;
  idUsuario?: number | null;
  observacion?: string | null;
}

export interface ActualizarVentaDTO {
  cliente?: string;
  personas?: number;
  estado?: EstadoVenta;
  fechaCierre?: Date | null;
  observacion?: string | null;
}

export function mapVentaFromRow(row: VentaRow): Venta {
  return {
    id: row.id_venta,
    idMesa: row.id_mesa,
    cliente: row.cliente,
    personas: row.personas,
    idUsuario: row.id_usuario,
    estado: row.estado,
    fechaApertura: aFecha(row.fecha_apertura),
    fechaCierre: aFechaNull(row.fecha_cierre),
    observacion: row.observacion,
  };
}
