export interface Proveedor {
    id_proveedor: number;
    documento: string;
    nombre: string;
    telefono: string;
    correo: string;
    direccion: string;
    activo: boolean;
}

export interface CrearProveedor {
    documento: string;
    nombre: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    activo?: boolean;
}

export interface ActualizarProveedor {
    documento?: string;
    nombre?: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    activo?: boolean;
}

export interface ProveedorRow {
    id_proveedor: number;
    documento: string;
    nombre: string;
    telefono: string ;
    correo: string ;
    direccion: string ;
    activo: boolean;
}