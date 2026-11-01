export type TipoReporte = "DIARIO" | "SEMANAL";

export interface Reporte {
    id_reporte: number;
    tipo: TipoReporte;
    fecha_inicio: string;
    fecha_fin: string;
    contenido: string;
    fecha_creacion: string;
}

export interface CrearReporte {
    tipo: TipoReporte;
    fecha_inicio: string;
    fecha_fin: string;
    contenido: string;
}

export interface ReporteRow {
    id_reporte: number;
    tipo: TipoReporte;
    fecha_inicio: string;
    fecha_fin: string;
    contenido: string;
    fecha_creacion: string;
}

// Una fila de la vista v_resumen_diario (un ingrediente en un día)
export interface ResumenDiario {
    dia: string;
    id_ingrediente: number;
    ingrediente: string;
    unidad: string;
    entradas: number;
    salidas: number;
    ajustes: number;
    costo_salidas: number;
}

export interface ResumenDiarioRow {
    dia: string;
    id_ingrediente: number;
    ingrediente: string;
    unidad: string;
    entradas: number | string;
    salidas: number | string;
    ajustes: number | string;
    costo_salidas: number | string;
}

// Una fila de la vista v_stock_ingrediente
export interface StockIngrediente {
    id_ingrediente: number;
    codigo: string;
    nombre: string;
    unidad: string;
    stock: number;
    stock_minimo: number;
    precio_referencia: number;
    bajo_minimo: boolean;
    faltante: number;
}

export interface StockIngredienteRow {
    id_ingrediente: number;
    codigo: string;
    nombre: string;
    unidad: string;
    stock: number | string;
    stock_minimo: number | string;
    precio_referencia: number | string;
    bajo_minimo: boolean;
    faltante: number | string;
}
