import { RolMensajeIA } from './RolMensajeIA.js';
import { aFecha } from './mapeo.js';

export interface AiMensajeMetadata {
  modelo?: string;
  latenciaMs?: number;
  [clave: string]: unknown;
}

export interface AiMensajeRow {
  id_mensaje: number;
  id_conversacion: number;
  rol: RolMensajeIA;
  contenido: string;
  tokens_entrada: number | null;
  tokens_salida: number | null;
  metadata: AiMensajeMetadata;
  fecha: string;
}

export interface AiMensaje {
  id: number;
  idConversacion: number;
  rol: RolMensajeIA;
  contenido: string;
  tokensEntrada: number | null;
  tokensSalida: number | null;
  metadata: AiMensajeMetadata;
  fecha: Date;
}

export interface CrearAiMensajeDTO {
  idConversacion: number;
  rol: RolMensajeIA;
  contenido: string;
  tokensEntrada?: number | null;
  tokensSalida?: number | null;
  metadata?: AiMensajeMetadata;
}

export function mapAiMensajeFromRow(row: AiMensajeRow): AiMensaje {
  return {
    id: row.id_mensaje,
    idConversacion: row.id_conversacion,
    rol: row.rol,
    contenido: row.contenido,
    tokensEntrada: row.tokens_entrada,
    tokensSalida: row.tokens_salida,
    metadata: row.metadata,
    fecha: aFecha(row.fecha),
  };
}
