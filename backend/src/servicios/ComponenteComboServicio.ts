import { ComponenteComboRepositorio } from "../persistencia/ComponenteComboRepositorio.js";
import {
    ComponenteComboRow,
    ComponenteComboDto,
    CrearComponenteComboDTO
} from "../modelos/ComponenteCombo.js";

export class ComponenteComboServicio {
    private repo = new ComponenteComboRepositorio();

    private mapear(row: ComponenteComboRow): ComponenteComboDto {
        return {
            id: row.id,
            idCombo: row.id_combo,
            idProductoHijo: row.id_producto_hijo,
            cantidad: row.cantidad
        };
    }

    async listarPorCombo(idCombo: number): Promise<ComponenteComboDto[]> {
        const rows = await this.repo.listarPorCombo(idCombo);
        return rows.map((r) => this.mapear(r));
    }

    async listarTodos(): Promise<ComponenteComboDto[]> {
        const rows = await this.repo.listarTodos();
        return rows.map((r) => this.mapear(r));
    }

    async crear(dto: CrearComponenteComboDTO): Promise<ComponenteComboDto> {
        if (!Number.isInteger(dto.idCombo) || dto.idCombo <= 0) {
            throw new Error("El id del combo es obligatorio");
        }
        if (!Number.isInteger(dto.idProductoHijo) || dto.idProductoHijo <= 0) {
            throw new Error("El id del producto hijo es obligatorio");
        }
        const cantidad = Number(dto.cantidad ?? 1);
        if (!Number.isFinite(cantidad) || cantidad <= 0) {
            throw new Error("La cantidad debe ser mayor a 0");
        }

        const creado = await this.repo.crear({
            idCombo: dto.idCombo,
            idProductoHijo: dto.idProductoHijo,
            cantidad
        });
        return this.mapear(creado);
    }

    async actualizar(id: number, dto: Partial<CrearComponenteComboDTO>): Promise<ComponenteComboDto> {
        if (dto.cantidad !== undefined && (!Number.isFinite(dto.cantidad) || dto.cantidad <= 0)) {
            throw new Error("La cantidad debe ser mayor a 0");
        }
        const actualizado = await this.repo.actualizar(id, {
            cantidad: dto.cantidad,
            id_producto_hijo: dto.idProductoHijo
        });
        if (!actualizado) throw new Error("El componente de combo no existe");
        return this.mapear(actualizado);
    }

    async eliminar(id: number): Promise<void> {
        await this.repo.eliminar(id);
    }

    async eliminarPorCombo(idCombo: number): Promise<void> {
        await this.repo.eliminarPorCombo(idCombo);
    }
}
