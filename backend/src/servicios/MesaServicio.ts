import { Mesa, CrearMesa, ActualizarMesa } from "../modelos/Mesa.js";
import { EstadoMesa } from "../modelos/EstadoMesa.js";
import { MesaRepositorio } from "../persistencia/MesaRepositorio.js";

export class MesaServicio {
    constructor(private mesaRepo = new MesaRepositorio()) {}

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
        return this.mesaRepo.crearMesa(datos);
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

        await this.obtenerPorId(id);
        await this.mesaRepo.actualizarMesa(id, cambios);
        return this.obtenerPorId(id);
    }

}