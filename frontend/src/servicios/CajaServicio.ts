import { fetchJson } from "./api";

export interface TurnoCajaDTO {
    id: number;
    idCaja: number;
    idUsuarioApertura: number;
    idUsuarioCierre: number | null;
    fechaApertura: string;
    fechaCierre: string | null;
    montoInicial: number;
    montoFinal: number | null;
    estado: "Abierto" | "Cerrado";
}

export interface MovimientoCajaDTO {
    id: number;
    idTurnoCaja: number;
    idUsuario: number;
    idFactura?: number | null;
    metodoPago: string;
    tipoPago: string;
    monto: number;
    descripcion?: string | null;
    fechaMovimiento: string;
}

export interface FacturaDTO {
    id: number;
    idVenta?: number | null;
    idMesa: number | null;
    idUsuario: number;
    cliente?: string;
    fechaEmision: string;
    subtotal: number;
    descuento?: number;
    propina: number;
    totalPagar: number;
    metodoPago?: string;
    estado?: string;
}

export const CajaServicio = {
    // === TURNOS DE CAJA ===
    async obtenerTurnoActual(idCaja: number = 1): Promise<TurnoCajaDTO | null> {
        try {
            return await fetchJson<TurnoCajaDTO>(`/api/turnos-caja/caja/${idCaja}/abierto`);
        } catch (error) {
            if (error instanceof Error && error.message.includes("turno abierto")) {
                return null;
            }
            throw error;
        }
    },

    async abrirTurno(montoInicial: number, idCaja: number = 1, idUsuario: number = 1): Promise<TurnoCajaDTO> {
        return await fetchJson<TurnoCajaDTO>("/api/turnos-caja", {
            method: "POST",
            body: JSON.stringify({
                idCaja,
                idUsuarioApertura: idUsuario,
                idUsuario,
                montoInicial,
            }),
        });
    },

    async cerrarTurno(idTurno: number, montoFinal: number, idUsuario: number = 1): Promise<TurnoCajaDTO> {
        return await fetchJson<TurnoCajaDTO>(`/api/turnos-caja/${idTurno}/cerrar`, {
            method: "PATCH",
            body: JSON.stringify({
                idUsuarioCierre: idUsuario,
                idUsuario,
                montoFinal,
            }),
        });
    },

    // === HISTORIAL / MOVIMIENTOS ===
    async listarMovimientos(idTurnoCaja?: number): Promise<MovimientoCajaDTO[]> {
        const query = idTurnoCaja ? `?idTurnoCaja=${idTurnoCaja}` : "";
        return await fetchJson<MovimientoCajaDTO[]>(`/api/historial-caja${query}`);
    },

    async registrarMovimiento(datos: {
        idTurnoCaja: number;
        idUsuario: number;
        monto: number;
        metodoPago: string;
        tipoPago: string;
        descripcion?: string;
        idFactura?: number;
    }): Promise<MovimientoCajaDTO> {
        return await fetchJson<MovimientoCajaDTO>("/api/historial-caja", {
            method: "POST",
            body: JSON.stringify({
                idTurnoCaja: datos.idTurnoCaja,
                idUsuario: datos.idUsuario,
                monto: datos.monto,
                metodoPago: datos.metodoPago,
                tipoPago: datos.tipoPago,
                descripcion: datos.descripcion || null,
                idFactura: datos.idFactura ?? null,
            }),
        });
    },

    // === FACTURAS ===
    async crearFactura(datos: {
        idMesa?: number | null;
        idUsuario: number;
        subtotal: number;
        propina?: number;
        descuento?: number;
        cliente?: string;
        metodoPago?: string;
        montoEfectivo?: number;
        montoTarjeta?: number;
        montoTransferencia?: number;
        idTurnoCaja?: number;
        idVenta?: number | null;
        idsComandas?: number[];
        cerrarComandas?: boolean;
        cerrarVenta?: boolean;
        detalles?: Array<{ idProducto: number; cantidad: number; precioUnitario: number }>;
    }): Promise<FacturaDTO> {
        return await fetchJson<FacturaDTO>("/api/facturas", {
            method: "POST",
            body: JSON.stringify(datos),
        });
    },

    async listarFacturas(): Promise<FacturaDTO[]> {
        return await fetchJson<FacturaDTO[]>("/api/facturas");
    },
};
