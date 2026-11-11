import { aFecha } from './mapeo.js';

export interface AiAnalisisContenido {
  hallazgos?: string[];
  recomendaciones?: string[];
  [clave: string]: unknown;
}

export interface AiAnalisisRow {
  id_analisis: number;
  id_usuario: number | null;
  tipo: string;
  titulo: string;
  resumen: string | null;
  contenido: AiAnalisisContenido;
  periodo_inicio: string | null;
  periodo_fin: string | null;
  fecha_creacion: string;
}

export interface AiAnalisis {
  id: number;
  idUsuario: number | null;
  tipo: string;
  titulo: string;
  resumen: string | null;
  contenido: AiAnalisisContenido;
  periodoInicio: string | null;
  periodoFin: string | null;
  fechaCreacion: Date;
}

export interface CrearAiAnalisisDTO {
  idUsuario?: number | null;
  tipo?: string;
  titulo: string;
  resumen?: string | null;
  contenido: AiAnalisisContenido;
  periodoInicio?: string | null;
  periodoFin?: string | null;
}

export function mapAiAnalisisFromRow(row: AiAnalisisRow): AiAnalisis {
  return {
    id: row.id_analisis,
    idUsuario: row.id_usuario,
    tipo: row.tipo,
    titulo: row.titulo,
    resumen: row.resumen,
    contenido: row.contenido,
    periodoInicio: row.periodo_inicio,
    periodoFin: row.periodo_fin,
    fechaCreacion: aFecha(row.fecha_creacion),
  };
}
