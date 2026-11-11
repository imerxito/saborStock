import { EstadoMesa } from './EstadoMesa.js';

export interface MesaRow {
  id_mesa: number;
  numero: number;
  estado: EstadoMesa;
  id_seccion: number;
  id_usuario: number | null;
  capacidad: number;
}

export interface Mesa {
  id: number;
  numero: number;
  estado: EstadoMesa;
  idSeccion: number;
  idUsuario: number | null;
  capacidad: number;
}

export interface CrearMesaDTO {
  numero: number;
  idSeccion: number;
  idUsuario?: number | null;
  capacidad?: number;
}

export interface ActualizarMesaDTO {
  numero?: number;
  estado?: EstadoMesa;
  idSeccion?: number;
  idUsuario?: number | null;
  capacidad?: number;
}

export function mapMesaFromRow(row: MesaRow): Mesa {
  return {
    id: row.id_mesa,
    numero: row.numero,
    estado: row.estado,
    idSeccion: row.id_seccion,
    idUsuario: row.id_usuario,
    capacidad: row.capacidad,
  };
}
