import {SeccionRepositorio} from '../persistencia/SeccionRepositorio.js';
import {Seccion,CrearSeccion,ActualizarSeccion} from '../modelos/Seccion.js';

export class SeccionServicio{
    private repo = new SeccionRepositorio();

    async listar():Promise<Seccion[]>{
        return this.repo.listar();
    }

    async obtenerPorId(id:string):Promise<Seccion>{
        const seccion = await this.repo.obtenerPorId(id);
        if(!seccion) throw new Error("seccion no encontrada");
        return seccion;
    }

    async buscarPorNombre(nombre:string):Promise<Seccion|null>{
        return this.repo.buscarPorNombre(nombre);
    }

    async crear(dto:CrearSeccion):Promise<Seccion>{
        if(dto.nombre.trim()==='') throw new Error("El nombre no puede estar vacio");
        return this.repo.crear(dto);
    }

    async actualizar(id:string,dto:ActualizarSeccion):Promise<Seccion>{
        await this.obtenerPorId(id);
        if(dto.nombre !== undefined && dto.nombre.trim()===""){
            throw new Error("nombre no puede estar vacio");
        }
        return this.repo.actualizar(id,dto);
    }

    async eliminar(id:string):Promise<void>{
        await this.obtenerPorId(id);
        return this.repo.eliminar(id);
    }
}