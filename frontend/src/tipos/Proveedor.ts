export interface Proveedor {
    id: number;
    documento: string | null;
    nombre: string;
    contacto: string | null;
    telefono: string | null;
    correo: string | null;
    direccion: string | null;
    categoriaSuministro: string | null;
    activo: boolean;
}

export interface CrearProveedor {
    documento?: string;
    nombre: string;
    contacto?: string;
    telefono?: string;
    correo?: string;
    direccion?: string;
    categoriaSuministro?: string;
}

export interface ActualizarProveedor extends Partial<CrearProveedor> {
    activo?: boolean;
}