import { EstadoComanda } from './EstadoComanda.js';
import { aFecha, aFechaNull } from './mapeo.js';

export interface ComandaRow {
  id_comanda: number;
  id_venta: number;
  id_usuario: number | null;
  estado: EstadoComanda;
  observacion: string | null;
  fecha_creacion: string;
  fecha_despachada: string | null;
}

export interface Comanda {
  id: number;
  idVenta: number;
  idUsuario: number | null;
  estado: EstadoComanda;
  observacion: string | null;
  fechaCreacion: Date;
  fechaDespachada: Date | null;
}

export interface CrearComandaDTO {
  idVenta: number;
  idUsuario?: number | null;
  observacion?: string | null;
}

export interface ActualizarComandaDTO {
  estado?: EstadoComanda;
  observacion?: string | null;
  fechaDespachada?: Date | null;
}

export function mapComandaFromRow(row: ComandaRow): Comanda {
  return {
    id: row.id_comanda,
    idVenta: row.id_venta,
    idUsuario: row.id_usuario,
    estado: row.estado,
    observacion: row.observacion,
    fechaCreacion: aFecha(row.fecha_creacion),
    fechaDespachada: aFechaNull(row.fecha_despachada),
  };
}
