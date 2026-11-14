export interface Proveedor {
    id_proveedor: number;
    documento: string;
    nombre: string;
    contacto: string | null;
    telefono: string | null;
    correo: string | null;
    direccion: string | null;
    id_categoria_ingrediente: number | null;
    categoria_suministro: string | null;
    activo: boolean;
}

export interface CrearProveedor {
    documento: string;
    nombre: string;
    contacto?: string | null;
    telefono?: string | null;
    correo?: string | null;
    direccion?: string | null;
    id_categoria_ingrediente?: number | null;
    categoria_suministro?: string | null;
    activo?: boolean;
}

export interface ActualizarProveedor {
    documento?: string;
    nombre?: string;
    contacto?: string | null;
    telefono?: string | null;
    correo?: string | null;
    direccion?: string | null;
    id_categoria_ingrediente?: number | null;
    categoria_suministro?: string | null;
    activo?: boolean;
}

export interface ProveedorRow {
    id_proveedor: number;
    documento: string;
    nombre: string;
    contacto?: string | null;
    telefono: string | null;
    correo: string | null;
    direccion: string | null;
    id_categoria_ingrediente?: number | null;
    categoria_suministro?: string | null;
    activo: boolean;
}
