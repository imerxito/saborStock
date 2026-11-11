import { TipoMovimiento } from './TipoMovimiento.js';
import { aFecha, aNumero } from './mapeo.js';

export interface MovimientoInventarioRow {
  id_movimiento: number;
  id_ingrediente: number;
  tipo: TipoMovimiento;
  cantidad: number | string;
  fecha: string;
  motivo: string;
}

export interface MovimientoInventario {
  id: number;
  idIngrediente: number;
  tipo: TipoMovimiento;
  cantidad: number;
  fecha: Date;
  motivo: string;
}

export interface CrearMovimientoInventarioDTO {
  idIngrediente: number;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string;
}

export function mapMovimientoInventarioFromRow(row: MovimientoInventarioRow): MovimientoInventario {
  return {
    id: row.id_movimiento,
    idIngrediente: row.id_ingrediente,
    tipo: row.tipo,
    cantidad: aNumero(row.cantidad),
    fecha: aFecha(row.fecha),
    motivo: row.motivo,
  };
}
