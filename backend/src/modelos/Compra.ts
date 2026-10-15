export interface Compra {
    id_compra: number;
    id_proveedor: number;
    fecha: string;
    estado: string;
    total: number;
}

export interface CrearCompra {
    id_proveedor: number;
    fecha?: string;
    estado?: string;
}

export interface ActualizarCompra {
    id_proveedor?: number;
    fecha?: string;
    estado?: string;
}

export interface CompraRow {
    id_compra: number;
    id_proveedor: number;
    fecha: string;
    estado: string;
    total: number;
}
