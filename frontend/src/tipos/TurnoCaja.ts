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
    ventasEfectivo?: number;
    ventasTarjeta?: number;
    ventasTransferencia?: number;
    totalGenerado?: number;
    egresosTotales?: number;
    diferencia?: number;
}

export interface AbrirTurno {
    idCaja: number;
    idUsuarioApertura: number;
    montoInicial: number;
}

export interface CerrarTurno {
    idUsuarioCierre: number;
    montoFinal: number;
}