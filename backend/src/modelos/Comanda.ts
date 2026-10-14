import { EstadoComanda } from "./EstadoComanda.js";

export interface Comanda {
    id: number;
    idMesa: number | null;
    idUsuario: number | null;
    estado: EstadoComanda;
    observacion: string | null;
    fechaCreacion: Date;
}

export interface CrearComanda {
    idMesa?: number | null;
    idUsuario?: number | null;
    estado?: EstadoComanda;
    observacion?: string | null;
}

export interface ActualizarComanda {
    idMesa?: number | null;
    idUsuario?: number | null;
    estado?: EstadoComanda;
    observacion?: string | null;
}

export interface ComandaRow {
    id_comanda: number;
    id_mesa: number | null;
    id_usuario: number | null;
    estado: EstadoComanda;
    observacion: string | null;
    fecha_creacion: string;
}