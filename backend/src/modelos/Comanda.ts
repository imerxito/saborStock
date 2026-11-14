import { EstadoComanda } from '../tipos/EstadoComanda.js';
import { aFecha, aFechaNull } from '../tipos/mapeo.js';

export type { EstadoComanda };

// Detalle enriquecido (para respuesta con joins)
export interface ItemComandaDetalle {
  id: number;
  idProducto: number;
  nombreProducto: string;
  precio?: number;
  cantidad: number;
  nota: string | null;
}

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
  // Campos enriquecidos (joins)
  idMesa?: number | null;
  mesaNumero?: number | null;
  cliente?: string | null;
  personas?: number | null;
  usuarioNombre?: string | null;
  detalles?: ItemComandaDetalle[];
}

export interface CrearComandaDTO {
  idVenta?: number;
  idMesa?: number | null;
  idUsuario?: number | null;
  estado?: EstadoComanda;
  observacion?: string | null;
  cliente?: string | null;
  personas?: number | null;
  items?: Array<{ idProducto: number; cantidad: number; nota?: string | null }>;
}

export interface ActualizarComandaDTO {
  estado?: EstadoComanda;
  observacion?: string | null;
  fechaDespachada?: Date | null;
  idMesa?: number | null;
  idUsuario?: number | null;
}

// Alias para compatibilidad con código existente
export type CrearComanda = CrearComandaDTO;
export type ActualizarComanda = ActualizarComandaDTO;

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
