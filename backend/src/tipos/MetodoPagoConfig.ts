import { TipoMetodoPago } from './TipoMetodoPago.js';

export interface MetodoPagoConfigRow {
  id_metodo: number;
  nombre: string;
  tipo: TipoMetodoPago;
  activo: boolean;
  requiere_referencia: boolean;
  cuenta_destino: string | null;
}

export interface MetodoPagoConfig {
  id: number;
  nombre: string;
  tipo: TipoMetodoPago;
  activo: boolean;
  requiereReferencia: boolean;
  cuentaDestino: string | null;
}

export interface CrearMetodoPagoConfigDTO {
  nombre: string;
  tipo: TipoMetodoPago;
  activo?: boolean;
  requiereReferencia?: boolean;
  cuentaDestino?: string | null;
}

export interface ActualizarMetodoPagoConfigDTO {
  nombre?: string;
  tipo?: TipoMetodoPago;
  activo?: boolean;
  requiereReferencia?: boolean;
  cuentaDestino?: string | null;
}

export function mapMetodoPagoConfigFromRow(row: MetodoPagoConfigRow): MetodoPagoConfig {
  return {
    id: row.id_metodo,
    nombre: row.nombre,
    tipo: row.tipo,
    activo: row.activo,
    requiereReferencia: row.requiere_referencia,
    cuentaDestino: row.cuenta_destino,
  };
}
