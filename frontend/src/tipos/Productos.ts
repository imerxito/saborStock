export type TipoProducto = "cocina" | "directo" | "paquete";

export interface Producto {
    id_producto: number;
    codigo: string;
    nombre: string;
    id_categoria: number;
    precio_venta: number;
    descripcion: string | null;
    activo: boolean;
    tipo: TipoProducto;
    categoriaNombre?: string;
}

export interface CrearProducto {
    codigo: string;
    nombre: string;
    id_categoria: number;
    precio_venta: number;
    descripcion?: string;
    activo?: boolean;
    tipo?: TipoProducto;
}

export interface ActualizarProducto {
    codigo?: string;
    nombre?: string;
    id_categoria?: number;
    precio_venta?: number;
    descripcion?: string;
    activo?: boolean;
    tipo?: TipoProducto;
}