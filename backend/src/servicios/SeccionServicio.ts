import {SeccionRepositorio} from '../persistencia/SeccionRepositorio.js';
import {MesaRepositorio} from '../persistencia/MesaRepositorio.js';
import {Seccion,CrearSeccion,ActualizarSeccion} from '../modelos/Seccion.js';
import { completarRangos, siguienteNumeroInicio } from '../utilidades/RangoSeccion.js';

export class SeccionServicio{
    private repo = new SeccionRepositorio();
    private mesaRepo = new MesaRepositorio();

    async listar():Promise<Seccion[]>{
        return completarRangos(await this.repo.listar());
    }

    async obtenerPorId(id:string):Promise<Seccion>{
        const seccion = await this.repo.obtenerPorId(id);
        if(!seccion) throw new Error("seccion no encontrada");
        const conRango = completarRangos(await this.repo.listar());
        return conRango.find((s) => String(s.id) === String(id)) ?? seccion;
    }

    async buscarPorNombre(nombre:string):Promise<Seccion|null>{
        return this.repo.buscarPorNombre(nombre);
    }

    async crear(dto:CrearSeccion):Promise<Seccion>{
        if(dto.nombre.trim()==='') throw new Error("El nombre no puede estar vacio");
        const existente = await this.repo.buscarPorNombre(dto.nombre.trim());
        if(existente) throw new Error("Ya existe una sección con ese nombre");
        this.validarConfig(dto.orden, dto.limiteMesas, dto.numeroInicio);
        const actuales = await this.repo.listar();
        const numeroInicio = dto.numeroInicio && dto.numeroInicio > 0
            ? dto.numeroInicio
            : siguienteNumeroInicio(actuales);
        return this.repo.crear({
            nombre: dto.nombre.trim(),
            orden: dto.orden ?? actuales.length + 1,
            limiteMesas: dto.limiteMesas ?? 20,
            numeroInicio,
        });
    }

    async actualizar(id:string,dto:ActualizarSeccion):Promise<Seccion>{
        await this.obtenerPorId(id);
        if(dto.nombre !== undefined && dto.nombre.trim()===""){
            throw new Error("nombre no puede estar vacio");
        }
        this.validarConfig(dto.orden, dto.limiteMesas, dto.numeroInicio);
        if(dto.nombre !== undefined){
            const existente = await this.repo.buscarPorNombre(dto.nombre.trim());
            if(existente && String(existente.id) !== String(id)){
                throw new Error("Ya existe una sección con ese nombre");
            }
            dto = { ...dto, nombre: dto.nombre.trim() };
        }
        if(dto.limiteMesas !== undefined){
            const actuales = await this.mesaRepo.contarPorSeccion(Number(id));
            if(dto.limiteMesas < actuales){
                throw new Error(`El límite no puede ser menor a las ${actuales} mesa(s) que ya tiene esta sección`);
            }
        }
        return this.repo.actualizar(id,dto);
    }

    async eliminar(id:string):Promise<void>{
        await this.obtenerPorId(id);
        const mesas = await this.mesaRepo.contarPorSeccion(Number(id));
        if(mesas > 0){
            throw new Error(`No se puede borrar la sección: todavía tiene ${mesas} mesa(s). Muévelas o bórralas primero.`);
        }
        return this.repo.eliminar(id);
    }

    private validarConfig(orden?: number, limiteMesas?: number, numeroInicio?: number){
        if(orden !== undefined && (!Number.isFinite(orden) || orden < 0)){
            throw new Error("El orden de la sección debe ser 0 o mayor");
        }
        if(limiteMesas !== undefined && (!Number.isFinite(limiteMesas) || limiteMesas < 1)){
            throw new Error("El límite de mesas debe ser al menos 1");
        }
        if(numeroInicio !== undefined && (!Number.isFinite(numeroInicio) || numeroInicio < 1)){
            throw new Error("El número inicial debe ser 1 o mayor");
        }
    }
}
