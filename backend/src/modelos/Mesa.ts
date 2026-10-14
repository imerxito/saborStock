import { EstadoMesa } from "./EstadoMesa.js";

export interface Mesa {
    id: number;
    numero: number;
    estado: EstadoMesa;
    idSeccion: number;
    idUsuario: number | null;
}

export interface CrearMesa {
    numero: number;
    estado?: EstadoMesa;
    idSeccion: number;
    idUsuario: number | null;
}

export interface ActualizarMesa {
    numero?: number;
    estado?: EstadoMesa;
    idSeccion?: number;
    idUsuario?: number | null;
}

export interface MesaRow {
    id_mesa: number;
    numero: number;
    estado: EstadoMesa;
    id_seccion: number;
    id_usuario: number | null;
}