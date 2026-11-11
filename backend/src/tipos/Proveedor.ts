export interface ProveedorRow {
  id_proveedor: number;
  documento: string | null;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  categoria_suministro: string | null;
  activo: boolean;
}

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

export interface CrearProveedorDTO {
  documento?: string | null;
  nombre: string;
  contacto?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  categoriaSuministro?: string | null;
  activo?: boolean;
}

export interface ActualizarProveedorDTO {
  documento?: string | null;
  nombre?: string;
  contacto?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  categoriaSuministro?: string | null;
  activo?: boolean;
}

export function mapProveedorFromRow(row: ProveedorRow): Proveedor {
  return {
    id: row.id_proveedor,
    documento: row.documento,
    nombre: row.nombre,
    contacto: row.contacto,
    telefono: row.telefono,
    correo: row.correo,
    direccion: row.direccion,
    categoriaSuministro: row.categoria_suministro,
    activo: row.activo,
  };
}
