import { TipoImpresora } from './TipoImpresora.js';

export interface ImpresoraRow {
  id_impresora: number;
  nombre: string;
  tipo: TipoImpresora;
  direccion: string;
  activa: boolean;
  auto_print: boolean;
}

export interface Impresora {
  id: number;
  nombre: string;
  tipo: TipoImpresora;
  direccion: string;
  activa: boolean;
  autoPrint: boolean;
}

export interface CrearImpresoraDTO {
  nombre: string;
  tipo?: TipoImpresora;
  direccion: string;
  activa?: boolean;
  autoPrint?: boolean;
}

export interface ActualizarImpresoraDTO {
  nombre?: string;
  tipo?: TipoImpresora;
  direccion?: string;
  activa?: boolean;
  autoPrint?: boolean;
}

export function mapImpresoraFromRow(row: ImpresoraRow): Impresora {
  return {
    id: row.id_impresora,
    nombre: row.nombre,
    tipo: row.tipo,
    direccion: row.direccion,
    activa: row.activa,
    autoPrint: row.auto_print,
  };
}
