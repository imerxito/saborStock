import { Mesa, CrearMesa, ActualizarMesa } from "../modelos/Mesa.js";
import { EstadoMesa } from "../modelos/EstadoMesa.js";
import { MesaRepositorio } from "../persistencia/MesaRepositorio.js";
import { SeccionRepositorio } from "../persistencia/SeccionRepositorio.js";
import { completarRangos, numeroFin, numerosLibresEnRango } from "../utilidades/rangoSeccion.js";

export class MesaServicio {
    constructor(
        private mesaRepo = new MesaRepositorio(),
        private seccionRepo = new SeccionRepositorio(),
    ) {}

    async listar(): Promise<Mesa[]> {
        return this.mesaRepo.listar();
    }

    async obtenerPorId(id: number): Promise<Mesa> {
        const mesa = await this.mesaRepo.obtenerPorId(id);
        if (!mesa) throw new Error("Mesa no encontrada");
        return mesa;
    }

    async crear(datos: CrearMesa): Promise<Mesa> {
        if (datos.numero <= 0) throw new Error("El numero de mesa debe ser mayor a 0");
        if (datos.idSeccion <= 0) throw new Error("La seccion de la mesa debe ser mayor a 0");
        if (datos.estado !== undefined && !Object.values(EstadoMesa).includes(datos.estado)) {
            throw new Error("Estado de mesa no valido");
        }
        await this.asegurarCupoSeccion(datos.idSeccion, 1);
        return this.mesaRepo.crearMesa(datos);
    }

    async crearVarias(datos: {
        idSeccion: number;
        cantidad: number;
        numeroInicial?: number;
        estado?: EstadoMesa;
        idUsuario?: number | null;
    }): Promise<Mesa[]> {
        if (datos.idSeccion <= 0) throw new Error("La seccion de la mesa debe ser mayor a 0");
        if (!Number.isFinite(datos.cantidad) || datos.cantidad < 1) {
            throw new Error("Debes agregar al menos una mesa");
        }
        if (datos.cantidad > 50) {
            throw new Error("No se pueden agregar más de 50 mesas a la vez");
        }

        const seccion = await this.seccionConRango(datos.idSeccion);
        await this.asegurarCupoSeccion(seccion, datos.cantidad);

        const usados = new Set(await this.mesaRepo.listarNumeros());
        const libres = numerosLibresEnRango(seccion, usados);
        const desde = datos.numeroInicial && datos.numeroInicial > 0
            ? libres.filter((n) => n >= Math.floor(datos.numeroInicial!))
            : libres;

        if (desde.length < datos.cantidad) {
            throw new Error(
                `En "${seccion.nombre}" el rango fijo es ${seccion.numeroInicio}-${numeroFin(seccion)} y solo quedan ${desde.length} número(s) libre(s).`,
            );
        }

        const creadas: Mesa[] = [];
        for (let i = 0; i < datos.cantidad; i++) {
            const numero = desde[i];
            const mesa = await this.mesaRepo.crearMesa({
                numero,
                idSeccion: datos.idSeccion,
                estado: datos.estado ?? EstadoMesa.Libre,
                idUsuario: datos.idUsuario ?? null,
            });
            creadas.push(mesa);
        }
        return creadas;
    }

    async actualizar(id: number, cambios: ActualizarMesa): Promise<Mesa> {
        if (cambios.numero !== undefined && cambios.numero <= 0) {
            throw new Error("El numero de mesa debe ser mayor a 0");
        }
        if (cambios.idSeccion !== undefined && cambios.idSeccion <= 0) {
            throw new Error("La seccion de la mesa debe ser mayor a 0");
        }
        if (cambios.estado !== undefined && !Object.values(EstadoMesa).includes(cambios.estado)) {
            throw new Error("Estado de mesa no valido");
        }

        const actual = await this.obtenerPorId(id);
        if (cambios.idSeccion !== undefined && cambios.idSeccion !== actual.idSeccion) {
            const destino = await this.seccionConRango(cambios.idSeccion);
            await this.asegurarCupoSeccion(destino, 1);
            const fin = numeroFin(destino);
            const enRango = actual.numero >= destino.numeroInicio && actual.numero <= fin;
            if (!enRango && cambios.numero === undefined) {
                const usados = new Set(await this.mesaRepo.listarNumeros());
                usados.delete(actual.numero);
                const libres = numerosLibresEnRango(destino, usados);
                if (libres.length === 0) {
                    throw new Error(`No hay números libres en el rango ${destino.numeroInicio}-${fin} de "${destino.nombre}"`);
                }
                cambios = { ...cambios, numero: libres[0] };
            }
        }
        await this.mesaRepo.actualizarMesa(id, cambios);
        return this.obtenerPorId(id);
    }

    async eliminar(id: number): Promise<void> {
        const mesa = await this.obtenerPorId(id);
        if (mesa.estado === EstadoMesa.Ocupada) {
            throw new Error("No se puede borrar una mesa ocupada. Libérala primero.");
        }
        await this.mesaRepo.eliminarMesa(id);
    }

    private async seccionConRango(idSeccion: number) {
        const seccion = await this.seccionRepo.obtenerPorId(String(idSeccion));
        if (!seccion) throw new Error("La sección indicada no existe");
        const conRango = completarRangos(await this.seccionRepo.listar());
        return conRango.find((s) => s.id === seccion.id) ?? seccion;
    }

    private async asegurarCupoSeccion(
        idSeccionOSeccion: number | Awaited<ReturnType<MesaServicio["seccionConRango"]>>,
        cantidadNueva: number,
    ): Promise<void> {
        const seccion = typeof idSeccionOSeccion === "number"
            ? await this.seccionConRango(idSeccionOSeccion)
            : idSeccionOSeccion;
        const actuales = await this.mesaRepo.contarPorSeccion(seccion.id);
        if (actuales + cantidadNueva > seccion.limiteMesas) {
            const libres = Math.max(0, seccion.limiteMesas - actuales);
            throw new Error(
                `La sección "${seccion.nombre}" admite ${seccion.limiteMesas} mesas (${seccion.numeroInicio}-${numeroFin(seccion)}) y ya tiene ${actuales}. Quedan ${libres} cupos.`
            );
        }
    }
}