import {CategoriaRepositorio} from "../persistencia/CategoriaRepositorio.js";
import {Categoria,CrearCategoriaDTO,ActualizarCategoriaDTO} from "../modelos/Categoria.js";

export class CategoriaServicio{
    private repo = new CategoriaRepositorio();

    async listar():Promise<Categoria[]>{
        return this.repo.listar();
    }

    async obtenerPorId(id:string):Promise<Categoria>{
        const categoria = await this.repo.obtenerPorId(id);
        if(!categoria) throw new Error("categoria no encontrada");
        return categoria;
    }

    async crear(dto:CrearCategoriaDTO):Promise<Categoria>{
        if(dto.nombre.trim()==='') throw new Error("El nombre no puede estar vacio");
        return this.repo.crear(dto);
    }

    async actualizar(id:string,dto:ActualizarCategoriaDTO):Promise<Categoria>{
        await this.obtenerPorId(id); 
        if(dto.nombre !== undefined && dto.nombre.trim()===""){
            throw new Error("nombre no puede estar vacio");
        }
        await this.repo.actualizar(id, dto);
        return this.obtenerPorId(id);
    }

    async eliminar(id:string):Promise<void>{
        await this.obtenerPorId(id);
        await this.repo.eliminar(id);
    }

    async activar(id:string):Promise<void>{
        await this.obtenerPorId(id);
        return this.repo.cambiarEstado(id,true);
    }

    async desactivar(id:string):Promise<void>{
        await this.obtenerPorId(id);
        return this.repo.cambiarEstado(id,false);
    }
}