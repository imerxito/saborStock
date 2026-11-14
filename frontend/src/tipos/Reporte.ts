export type TipoReporte = "DIARIO" | "SEMANAL";

export interface Reporte {
    id: number;
    tipo: TipoReporte;
    fechaInicio: string;
    fechaFin: string;
    contenido: string;
    fechaCreacion: string;
}

export interface ResumenDiario {
    dia: string;
    idIngrediente: number;
    ingrediente: string;
    unidad: string;
    entradas: number;
    salidas: number;
    ajustes: number;
    costosalidas: number;
}

export interface StockBajo {
    idIngrediente: number;
    codigo: string;
    nombre: string;
    unidad: string;
    stock: number;
    stockMinimo: number;
    precioReferencia: number;
    bajoMinimo: boolean;
    faltante: number;
}

export interface GenerarReporte {
    tipo: TipoReporte;
    fecha?: string;
}