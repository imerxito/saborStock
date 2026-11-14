import { CategoriaIngredienteRepositorio } from "../persistencia/CategoriaIngredienteRepositorio.js";
import {
    CategoriaIngredienteDto,
    CrearCategoriaIngredienteDTO,
    ActualizarCategoriaIngredienteDTO
} from "../modelos/CategoriaIngrediente.js";

export class CategoriaIngredienteServicio {
    private repo = new CategoriaIngredienteRepositorio();

    async listar(): Promise<CategoriaIngredienteDto[]> {
        const categorias = await this.repo.listar();
        return categorias.map((c) => ({
            id: c.id_categoria_ingrediente,
            nombre: c.nombre,
            activo: c.activo
        }));
    }

    async listarActivos(): Promise<CategoriaIngredienteDto[]> {
        const categorias = await this.repo.listarActivos();
        return categorias.map((c) => ({
            id: c.id_categoria_ingrediente,
            nombre: c.nombre,
            activo: c.activo
        }));
    }

    async obtenerPorId(id: number): Promise<CategoriaIngredienteDto> {
        const categoria = await this.repo.obtenerPorId(id);
        if (!categoria) throw new Error("La categoría de insumo no existe");
        return {
            id: categoria.id_categoria_ingrediente,
            nombre: categoria.nombre,
            activo: categoria.activo
        };
    }

    async crear(dto: CrearCategoriaIngredienteDTO): Promise<CategoriaIngredienteDto> {
        if (!dto.nombre?.trim()) throw new Error("El nombre es obligatorio");
        const creada = await this.repo.crear({ nombre: dto.nombre.trim() });
        return {
            id: creada.id_categoria_ingrediente,
            nombre: creada.nombre,
            activo: creada.activo
        };
    }

    async actualizar(id: number, dto: ActualizarCategoriaIngredienteDTO): Promise<CategoriaIngredienteDto> {
        await this.obtenerPorId(id);
        if (dto.nombre !== undefined && !dto.nombre.trim()) {
            throw new Error("El nombre no puede estar vacío");
        }
        await this.repo.actualizar(id, { nombre: dto.nombre?.trim() });
        return this.obtenerPorId(id);
    }

    async activar(id: number): Promise<void> {
        await this.obtenerPorId(id);
        await this.repo.cambiarEstado(id, true);
    }

    async desactivar(id: number): Promise<void> {
        await this.obtenerPorId(id);
        await this.repo.cambiarEstado(id, false);
    }
}
