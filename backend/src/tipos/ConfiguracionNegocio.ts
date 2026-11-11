import { aFecha } from './mapeo.js';

export interface ConfiguracionNegocioRow {
  id: number;
  nombre: string;
  nit: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  moneda: string;
  logo_url: string | null;
  actualizado_en: string;
}

export interface ConfiguracionNegocio {
  id: number;
  nombre: string;
  nit: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  moneda: string;
  logoUrl: string | null;
  actualizadoEn: Date;
}

export interface ActualizarConfiguracionNegocioDTO {
  nombre?: string;
  nit?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  moneda?: string;
  logoUrl?: string | null;
}

export function mapConfiguracionNegocioFromRow(row: ConfiguracionNegocioRow): ConfiguracionNegocio {
  return {
    id: row.id,
    nombre: row.nombre,
    nit: row.nit,
    direccion: row.direccion,
    telefono: row.telefono,
    email: row.email,
    moneda: row.moneda,
    logoUrl: row.logo_url,
    actualizadoEn: aFecha(row.actualizado_en),
  };
}
