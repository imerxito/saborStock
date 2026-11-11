import { TipoReporte } from './TipoReporte.js';
import { aFecha } from './mapeo.js';

export interface ReporteRow {
  id_reporte: number;
  tipo: TipoReporte;
  fecha_inicio: string;
  fecha_fin: string;
  contenido: string;
  fecha_creacion: string;
}

export interface Reporte {
  id: number;
  tipo: TipoReporte;
  fechaInicio: string;
  fechaFin: string;
  contenido: string;
  fechaCreacion: Date;
}

export interface CrearReporteDTO {
  tipo?: TipoReporte;
  fechaInicio: string;
  fechaFin: string;
  contenido: string;
}

export function mapReporteFromRow(row: ReporteRow): Reporte {
  return {
    id: row.id_reporte,
    tipo: row.tipo,
    fechaInicio: row.fecha_inicio,
    fechaFin: row.fecha_fin,
    contenido: row.contenido,
    fechaCreacion: aFecha(row.fecha_creacion),
  };
}
