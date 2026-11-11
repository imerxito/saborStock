import { aFecha } from './mapeo.js';

export interface AiConversacionRow {
  id_conversacion: number;
  id_usuario: number | null;
  titulo: string;
  contexto: string;
  archivada: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface AiConversacion {
  id: number;
  idUsuario: number | null;
  titulo: string;
  contexto: string;
  archivada: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface CrearAiConversacionDTO {
  idUsuario?: number | null;
  titulo: string;
  contexto?: string;
  archivada?: boolean;
}

export interface ActualizarAiConversacionDTO {
  titulo?: string;
  contexto?: string;
  archivada?: boolean;
}

export function mapAiConversacionFromRow(row: AiConversacionRow): AiConversacion {
  return {
    id: row.id_conversacion,
    idUsuario: row.id_usuario,
    titulo: row.titulo,
    contexto: row.contexto,
    archivada: row.archivada,
    fechaCreacion: aFecha(row.fecha_creacion),
    fechaActualizacion: aFecha(row.fecha_actualizacion),
  };
}
