export interface ComponenteComboRow {
    id: number;
    id_combo: number;
    id_producto_hijo: number;
    cantidad: number;
}

export interface ComponenteComboDto {
    id: number;
    idCombo: number;
    idProductoHijo: number;
    cantidad: number;
}

export interface CrearComponenteComboDTO {
    idCombo: number;
    idProductoHijo: number;
    cantidad?: number;
}

export interface ActualizarComponenteComboDTO {
    cantidad?: number;
    id_producto_hijo?: number;
}

export interface ComponenteCombo {
    id_combo: number;
    id_producto_hijo: number;
    cantidad: number;
}

export interface CrearComponenteCombo {
    id_combo: number;
    id_producto_hijo: number;
    cantidad?: number;
}

export interface ActualizarComponenteCombo {
    cantidad?: number;
}

export interface ComponenteComboRowLegacy {
    id_combo: number;
    id_producto_hijo: number;
    cantidad: number;
}
