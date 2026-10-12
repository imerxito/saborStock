export interface Producto {
    id_producto: number;
    codigo: string;
    nombre: string;
    id_categoria: number;
    precio_venta: number;
    descripcion: string;
    activo: boolean;
}

export interface CrearProducto {
    codigo: string;
    nombre: string;
    id_categoria: number;
    precio_venta: number;
    descripcion?: string;
    activo?: boolean;
}

export interface ActualizarProducto {
    codigo?: string;
    nombre?: string;
    id_categoria?: number;
    precio_venta?: number;
    descripcion?: string;
    activo?: boolean;
}

export interface ProductoRow {
    id_producto: number;
    codigo: string;
    nombre: string;
    id_categoria: number;
    precio_venta: number;
    descripcion: string;
    activo: boolean;
}
