import { CategoriaRepositorio } from "../persistencia/CategoriaRepositorio.js";
export class CategoriaServicio {
    repo = new CategoriaRepositorio();
    async listar() {
        return this.repo.listar();
    }
    async obtenerPorId(id) {
        const categoria = await this.repo.obtenerPorId(id);
        if (!categoria)
            throw new Error("categoria no encontrada");
        return categoria;
    }
    async crear(dto) {
        if (dto.nombre.trim() === '')
            throw new Error("El nombre no puede estar vacio");
        return this.repo.crear(dto);
    }
    async actualizar(id, dto) {
        await this.obtenerPorId(id);
        if (dto.nombre !== undefined && dto.nombre.trim() === "") {
            throw new Error("nombre no puede estar vacio");
        }
        await this.repo.actualizar(id, dto);
        return this.obtenerPorId(id);
    }
    async eliminar(id) {
        await this.obtenerPorId(id);
        await this.repo.eliminar(id);
    }
    async activar(id) {
        await this.obtenerPorId(id);
        return this.repo.cambiarEstado(id, true);
    }
    async desactivar(id) {
        await this.obtenerPorId(id);
        return this.repo.cambiarEstado(id, false);
    }
}
