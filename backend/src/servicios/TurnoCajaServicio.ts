import { TurnoCajaRepositorio } from "../persistencia/TurnoCajaRepositorio.js";
import { CajaRepositorio } from "../persistencia/CajaRepositorio.js";
import { TurnoCaja, AbrirTurno, CerrarTurno, EstadoTurno } from "../modelos/TurnoCaja.js";


export class TurnoCajaServicio {
    constructor(
        private TurnoRepo = new TurnoCajaRepositorio(),
        private CajaRepo = new CajaRepositorio()
    ) {}

    async listar(): Promise<TurnoCaja[]> {
        return this.TurnoRepo.listar();
    }

    async obtenerPorId(id: number): Promise<TurnoCaja> {
        const turno = await this.TurnoRepo.obtenerPorId(id);
        if (!turno) throw new Error("Turno no encontrado");
        return turno;
    }

    async obtenerAbiertoPorCaja(idCaja: number): Promise<TurnoCaja> {
        const turno = await this.TurnoRepo.obtenerAbiertoPorCaja(idCaja);
        if (!turno) throw new Error("Esa caja no tiene un turno abierto");
        return turno;
    }

    async abrir(datos: AbrirTurno): Promise<TurnoCaja> {
        const montoInicial = Number(datos.montoInicial);
        if (!Number.isFinite(montoInicial) || montoInicial < 0) {
            throw new Error("El monto inicial debe ser un número mayor o igual a 0");
        }

        const caja = await this.CajaRepo.obtenerCajaPorId(datos.idCaja);
        if (!caja) throw new Error("Caja no encontrada");
        if (!caja.activo) throw new Error("La caja está inactiva");

        const abierto = await this.TurnoRepo.obtenerAbiertoPorCaja(datos.idCaja);
        if (abierto) throw new Error("Esa caja ya tiene un turno abierto");

        return this.TurnoRepo.abrir({ ...datos, montoInicial });
    }

    async cerrar(id: number, datos: CerrarTurno): Promise<TurnoCaja> {
        const montoFinal = Number(datos.montoFinal);
        if (!Number.isFinite(montoFinal) || montoFinal < 0) {
            throw new Error("El monto final debe ser un número mayor o igual a 0");
        }

        const turno = await this.obtenerPorId(id);
        if (turno.estado !== EstadoTurno.Abierto) throw new Error("El turno ya está cerrado");

        return this.TurnoRepo.cerrar(id, { ...datos, montoFinal });
    }
}