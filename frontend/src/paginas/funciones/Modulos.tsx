import type { ComponentType } from "react";
import {
    LayoutGrid,
    ClipboardList,
    Receipt,
    UtensilsCrossed,
    Package,
    Truck,
    Users,
    type LucideIcon,
} from "lucide-react";
import type { RolUsuario } from "../../tipos/Usuario";

import Mesas from "./Mesas";
import Comandas from "./Comandas";
import Caja from "./Caja";
import Productos from "./Productos";
import Inventario from "./Inventario";
import Proveedores from "./Provedores";
import Personal from "./Personal";

export interface Modulo {
    id: string;
    titulo: string;
    descripcion: string;
    icono: LucideIcon;
    roles: RolUsuario[];
    componente: ComponentType;
}

const GERENCIA: RolUsuario[] = ["Dueno", "Administrador"];

/**
 * Para agregar una función nueva:
 * 1. Crea la página en src/paginas/funciones
 * 2. Impórtala arriba
 * 3. Agrega un objeto a esta lista con los roles que pueden verla
 * El orden de la lista es el orden del menú lateral.
 */
export const MODULOS: Modulo[] = [
    {
        id: "mesas",
        titulo: "Mesas",
        descripcion: "Estado y asignación de las mesas del salón.",
        icono: LayoutGrid,
        roles: [...GERENCIA, "Mesero"],
        componente: Mesas,
    },
    {
        id: "comandas",
        titulo: "Comandas",
        descripcion: "Pedidos en curso desde la mesa hasta la cocina.",
        icono: ClipboardList,
        roles: [...GERENCIA, "Mesero", "Cocinero"],
        componente: Comandas,
    },
    {
        id: "caja",
        titulo: "Caja",
        descripcion: "Cobros, pagos y cierre del día.",
        icono: Receipt,
        roles: [...GERENCIA, "Caja"],
        componente: Caja,
    },
    {
        id: "productos",
        titulo: "Productos",
        descripcion: "Carta, platos y precios.",
        icono: UtensilsCrossed,
        roles: [...GERENCIA, "Mesero"],
        componente: Productos,
    },
    {
        id: "inventario",
        titulo: "Inventario",
        descripcion: "Existencias de ingredientes e insumos.",
        icono: Package,
        roles: [...GERENCIA, "Cocinero"],
        componente: Inventario,
    },
    {
        id: "proveedores",
        titulo: "Proveedores",
        descripcion: "Contactos y compras a proveedores.",
        icono: Truck,
        roles: GERENCIA,
        componente: Proveedores,
    },
    {
        id: "personal",
        titulo: "Personal",
        descripcion: "Usuarios, roles y estado del equipo.",
        icono: Users,
        roles: GERENCIA,
        componente: Personal,
    },
];

export function modulosPorRol(rol: RolUsuario): Modulo[] {
    return MODULOS.filter((m) => m.roles.includes(rol));
}