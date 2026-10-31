/**
 * Capa tipos: el modelo de una comanda y entidades de Mesas / Cocina.
 */

export type EstadoComanda =
    | "Pendiente"
    | "En preparación"
    | "Lista"
    | "Entregada"
    | "Abierto"
    | "Enviado"
    | "Cerrado";

export type CategoriaPlato =
    | "Cocina"
    | "Parrilla"
    | "Bebidas"
    | "Postres"
    | "Platos Fuertes"
    | "Comidas Rápidas"
    | "Entradas";

export interface ItemComanda {
    id?: number;
    idProducto?: number;
    producto: string;
    cantidad: number;
    categoria?: CategoriaPlato | string;
    precio?: number;
    nota?: string;
}

export interface Comanda {
    id: number;
    mesa: number;
    idMesa?: number;
    items: ItemComanda[];
    nota: string;
    estado: EstadoComanda;
    /** Marca de tiempo (ms) de cuándo se creó */
    creada: number;
    mesero: string;
    /** Marca de tiempo (ms) de cuándo salió de la cocina (Lista / Entregada) */
    despachadaEn?: number;
    cliente?: string;
    personas?: number;
    total?: number;
}

/** Lo que el mesero envía al crear una comanda */
export interface NuevaComanda {
    mesa: number;
    idMesa?: number;
    items: ItemComanda[];
    nota: string;
    mesero?: string;
    cliente?: string;
    personas?: number;
}

/** Plato de la carta tal como lo usa el formulario de comandas */
export interface PlatoCarta {
    id?: number;
    nombre: string;
    categoria: CategoriaPlato | string;
    precio?: number;
    descripcion?: string;
}

export type EstadoMesa = "Libre" | "Ocupada" | "Reservada" | "Disponible";

export interface MesaBackend {
    id: number;
    numero: number;
    estado: EstadoMesa;
    idSeccion: number;
    idUsuario: number | null;
    seccionNombre?: string;
}

export interface ProductoBackend {
    id_producto: number;
    codigo: string;
    nombre: string;
    id_categoria: number;
    precio_venta: number;
    descripcion: string;
    activo: boolean;
    categoriaNombre?: string;
}

export const ESTADOS: EstadoComanda[] = ["Pendiente", "En preparación", "Lista", "Entregada"];
export const CATEGORIAS: CategoriaPlato[] = [
    "Cocina",
    "Parrilla",
    "Bebidas",
    "Postres",
    "Platos Fuertes",
    "Comidas Rápidas",
    "Entradas",
];
