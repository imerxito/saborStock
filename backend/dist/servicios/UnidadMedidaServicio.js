import { UnidadMedidaRepositorio } from "../persistencia/UnidadMedidaRepositorio.js";
export class UnidadMedidaServicio {
    repo = new UnidadMedidaRepositorio();
    async listar() {
        return this.repo.listar();
    }
    async obtenerPorId(id) {
        const unidad = await this.repo.obtenerPorId(id);
        if (!unidad)
            throw new Error("unidad de medida no encontrada");
        return unidad;
    }
    async crear(dto) {
        if (dto.nombre.trim() === '')
            throw new Error("El nombre no puede estar vacio");
        if (dto.abreviatura.trim() === '')
            throw new Error("La abreviatura no puede estar vacia");
        const nombreExiste = await this.repo.buscarPorNombre(dto.nombre.trim());
        if (nombreExiste)
            throw new Error("ya existe esta unidad de medida");
        const abreviaturaExiste = await this.repo.buscarPorAbreviatura(dto.abreviatura.trim());
        if (abreviaturaExiste)
            throw new Error("ya existe esta abreviatura");
        return this.repo.crear({
            nombre: dto.nombre.trim(),
            abreviatura: dto.abreviatura.trim(),
            descripcion: dto.descripcion?.trim() || null
        });
    }
    async actualizar(id, dto) {
        await this.obtenerPorId(id);
        if (dto.nombre !== undefined && dto.nombre.trim() === "") {
            throw new Error("nombre no puede estar vacio");
        }
        if (dto.abreviatura !== undefined && dto.abreviatura.trim() === "") {
            throw new Error("nombre no puede estar vacio");
        }
        await this.repo.actualizar(id, dto);
        return this.obtenerPorId(id);
    }
    async activar(id) {
        return this.repo.cambiarEstado(id, true);
    }
    async desactivar(id) {
        return this.repo.cambiarEstado(id, false);
    }
}
