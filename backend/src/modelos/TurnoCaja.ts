export enum EstadoTurno {
    Abierto = "Abierto",
    Cerrado = "Cerrado",
}

export interface TurnoCaja {
    id: number;
    idCaja: number;
    idUsuarioApertura: number;
    idUsuarioCierre: number | null;
    fechaApertura: string;
    fechaCierre: string | null;
    montoInicial: number;
    montoFinal: number | null;
    estado: EstadoTurno;
}

// Lo que se envía al abrir un turno
export interface AbrirTurno {
    idCaja: number;
    idUsuarioApertura: number;
    montoInicial: number;
}

// Lo que se envía al cerrarlo
export interface CerrarTurno {
    idUsuarioCierre: number;
    montoFinal: number;
}