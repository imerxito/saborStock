import { TurnoCajaRepositorio } from "../persistencia/TurnoCajaRepositorio.js";
import { CajaRepositorio } from "../persistencia/CajaRepositorio.js";
import { TurnoCaja, AbrirTurno, CerrarTurno, EstadoTurno } from "../modelos/TurnoCaja.js";
import { supabase } from "../configuracion/Supabase.js";

async function resolverIdUsuario(candidato?: number): Promise<number> {
    if (candidato) {
        const { data: u } = await supabase
            .from("usuario")
            .select("id_usuario")
            .eq("id_usuario", candidato)
            .maybeSingle();
        if (u) return u.id_usuario;
    }
    const { data: primer } = await supabase
        .from("usuario")
        .select("id_usuario")
        .limit(1)
        .maybeSingle();
    return primer?.id_usuario ?? 1;
}

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

    async abrir(datos: AbrirTurno & { idUsuario?: number }): Promise<TurnoCaja> {
        const montoInicial = Number(datos.montoInicial);
        if (!Number.isFinite(montoInicial) || montoInicial < 0) {
            throw new Error("El monto inicial debe ser un número mayor o igual a 0");
        }

        const idUsuarioApertura = await resolverIdUsuario(datos.idUsuarioApertura ?? datos.idUsuario);

        const caja = await this.CajaRepo.obtenerCajaPorId(datos.idCaja);
        if (!caja) throw new Error("Caja no encontrada");
        if (!caja.activo) throw new Error("La caja está inactiva");

        const abierto = await this.TurnoRepo.obtenerAbiertoPorCaja(datos.idCaja);
        if (abierto) throw new Error("Esa caja ya tiene un turno abierto");

        return this.TurnoRepo.abrir({
            idCaja: datos.idCaja,
            idUsuarioApertura,
            montoInicial
        });
    }

    async cerrar(id: number, datos: CerrarTurno & { idUsuario?: number }): Promise<TurnoCaja> {
        const montoFinal = Number(datos.montoFinal);
        if (!Number.isFinite(montoFinal) || montoFinal < 0) {
            throw new Error("El monto final debe ser un número mayor o igual a 0");
        }

        const idUsuarioCierre = await resolverIdUsuario(datos.idUsuarioCierre ?? datos.idUsuario);

        const turno = await this.obtenerPorId(id);
        if (turno.estado !== EstadoTurno.Abierto) throw new Error("El turno ya está cerrado");

        return this.TurnoRepo.cerrar(id, {
            idUsuarioCierre,
            montoFinal
        });
    }
}