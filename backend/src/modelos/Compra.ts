export interface Compra {
    id_compra: number;
    id_proveedor: number;
    fecha: string;
    estado: string;
    total: number;
    factura: string | null;
}

export interface CrearCompra {
    id_proveedor: number;
    fecha?: string;
    estado?: string;
    total?: number;
    factura?: string | null;
    detalles?: Array<{
        id_ingrediente: number;
        cantidad: number;
        precio_aplicado: number;
    }>;
}

export interface ActualizarCompra {
    id_proveedor?: number;
    fecha?: string;
    estado?: string;
    total?: number;
    factura?: string | null;
}

export interface CompraRow {
    id_compra: number;
    id_proveedor: number;
    fecha: string;
    estado: string;
    total: number;
    factura?: string | null;
}
