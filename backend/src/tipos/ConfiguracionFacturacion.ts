import { EntornoFacturacion } from './EntornoFacturacion.js';
import { aFecha } from './mapeo.js';

export interface ConfiguracionFacturacionRow {
  id: number;
  habilitada: boolean;
  entorno: EntornoFacturacion;
  resolucion: string | null;
  prefijo: string | null;
  rango_inicial: number | null;
  rango_final: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  clave_tecnica: string | null;
  software_id: string | null;
  api_key: string | null;
  certificado_cargado: boolean;
  actualizado_en: string;
}

export interface ConfiguracionFacturacion {
  id: number;
  habilitada: boolean;
  entorno: EntornoFacturacion;
  resolucion: string | null;
  prefijo: string | null;
  rangoInicial: number | null;
  rangoFinal: number | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  claveTecnica: string | null;
  softwareId: string | null;
  apiKey: string | null;
  certificadoCargado: boolean;
  actualizadoEn: Date;
}

export interface ActualizarConfiguracionFacturacionDTO {
  habilitada?: boolean;
  entorno?: EntornoFacturacion;
  resolucion?: string | null;
  prefijo?: string | null;
  rangoInicial?: number | null;
  rangoFinal?: number | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  claveTecnica?: string | null;
  softwareId?: string | null;
  apiKey?: string | null;
  certificadoCargado?: boolean;
}

export function mapConfiguracionFacturacionFromRow(
  row: ConfiguracionFacturacionRow
): ConfiguracionFacturacion {
  return {
    id: row.id,
    habilitada: row.habilitada,
    entorno: row.entorno,
    resolucion: row.resolucion,
    prefijo: row.prefijo,
    rangoInicial: row.rango_inicial,
    rangoFinal: row.rango_final,
    fechaInicio: row.fecha_inicio,
    fechaFin: row.fecha_fin,
    claveTecnica: row.clave_tecnica,
    softwareId: row.software_id,
    apiKey: row.api_key,
    certificadoCargado: row.certificado_cargado,
    actualizadoEn: aFecha(row.actualizado_en),
  };
}
