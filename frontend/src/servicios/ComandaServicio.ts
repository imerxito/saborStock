import { fetchJson } from "./api";
import type {
    Comanda,
    EstadoComanda,
    ItemComanda,
    NuevaComanda,
    PlatoCarta,
    ProductoBackend,
    MesaBackend,
} from "../tipos/Comanda";

const CLAVE_STORAGE = "saborstock_comandas_cache";

const CARTA_DEFAULT: PlatoCarta[] = [
    { id: 1, nombre: "Bandeja Paisa Tradicional", categoria: "Platos Fuertes", precio: 34000 },
    { id: 2, nombre: "Sancocho de Gallina Criolla", categoria: "Platos Fuertes", precio: 28000 },
    { id: 3, nombre: "Lomo al Trapo (300g)", categoria: "Platos Fuertes", precio: 42000 },
    { id: 4, nombre: "Hamburguesa Artesanal Doble", categoria: "Comidas Rápidas", precio: 26000 },
    { id: 5, nombre: "Salchipapa Especial Gigante", categoria: "Comidas Rápidas", precio: 22000 },
    { id: 6, nombre: "Arepa de Choclo con Queso", categoria: "Entradas", precio: 12000 },
    { id: 7, nombre: "Empanadas Criollas (5 uds)", categoria: "Entradas", precio: 10000 },
    { id: 8, nombre: "Jugo Natural en Agua / Leche", categoria: "Bebidas", precio: 8500 },
    { id: 9, nombre: "Limonada de Coco Cremosita", categoria: "Bebidas", precio: 11000 },
    { id: 10, nombre: "Cerveza Club Colombia Dorada", categoria: "Bebidas", precio: 7500 },
    { id: 11, nombre: "Tres Leches de la Casa", categoria: "Postres", precio: 12000 },
];

let cartaMemoria: PlatoCarta[] = [...CARTA_DEFAULT];
let mesasMemoria: number[] = [1, 2, 3, 4, 5, 6, 7, 8];

function normalizarEstado(estadoBackend: string): EstadoComanda {
    switch (estadoBackend) {
        case "Abierto":
            return "Pendiente";
        case "Enviado":
            return "En preparación";
        case "Cerrado":
            return "Cerrado";
        case "Pendiente":
        case "En preparación":
        case "Lista":
        case "Entregada":
            return estadoBackend as EstadoComanda;
        default:
            return "Pendiente";
    }
}

function mapearComandaBackend(c: any): Comanda {
    const estado = normalizarEstado(c.estado);
    const items: ItemComanda[] = Array.isArray(c.detalles)
        ? c.detalles.map((d: any) => ({
              id: d.id,
              idProducto: d.idProducto,
              idCategoria: d.idCategoria ?? null,
              producto: d.nombreProducto || `Producto #${d.idProducto}`,
              cantidad: Number(d.cantidad) || 1,
              precio: Number(d.precio) || 0,
              nota: d.nota || undefined,
              categoria: "Cocina",
          }))
        : [];

    const totalCalculado = items.reduce(
        (sum, it) => sum + (it.precio || 0) * it.cantidad,
        0
    );

    const idMesa = c.idMesa != null ? Number(c.idMesa) : null;
    const mesaNumero = c.mesaNumero != null ? Number(c.mesaNumero) : null;

    return {
        id: Number(c.id),
        idVenta: c.idVenta ? Number(c.idVenta) : undefined,
        mesa: mesaNumero ?? idMesa ?? 0,
        idMesa: idMesa && idMesa > 0 ? idMesa : undefined,
        items,
        nota: c.observacion || "",
        estado,
        creada: c.fechaCreacion ? new Date(c.fechaCreacion).getTime() : Date.now(),
        mesero: c.usuarioNombre || "Mesero",
        cliente: c.cliente ?? (c.observacion?.startsWith("Cliente: ")
            ? c.observacion.split(" | ")[0].replace("Cliente: ", "")
            : undefined),
        personas: c.personas ?? undefined,
        total: totalCalculado,
        despachadaEn: c.fechaDespachada
            ? new Date(c.fechaDespachada).getTime()
            : estado === "Lista" || estado === "Entregada" || estado === "Cerrado"
                ? c.fechaCreacion
                    ? new Date(c.fechaCreacion).getTime()
                    : Date.now()
                : undefined,
    };
}

export const ComandaServicio = {
    async obtenerComandas(): Promise<Comanda[]> {
        const data = await fetchJson<any[]>("/api/comandas");
        const comandasMapeadas: Comanda[] = (data || []).map(mapearComandaBackend);

        // Guardar en caché local
        try {
            localStorage.setItem(CLAVE_STORAGE, JSON.stringify(comandasMapeadas));
        } catch {
            // Ignore
        }

        return comandasMapeadas;
    },

    async crearComanda(nueva: NuevaComanda): Promise<Comanda> {
        const observacionFinal = [
            nueva.cliente ? `Cliente: ${nueva.cliente}` : "",
            nueva.personas ? `Personas: ${nueva.personas}` : "",
            nueva.nota ? `Nota: ${nueva.nota}` : "",
        ]
            .filter(Boolean)
            .join(" | ");

        const necesitaCarta = nueva.items.some((item) => !(Number(item.idProducto) > 0));
        if (necesitaCarta) await ComandaServicio.cargarCarta();

        const itemsParaBackend = nueva.items.map((item) => {
            let idProd = Number(item.idProducto);
            if (!(idProd > 0)) {
                const match = cartaMemoria.find(
                    (p) => p.id != null && p.nombre.trim().toLowerCase() === item.producto.trim().toLowerCase()
                );
                if (match?.id) idProd = match.id;
            }
            return {
                idProducto: idProd,
                cantidad: Number(item.cantidad) || 0,
                nota: item.nota ?? null,
                producto: item.producto,
            };
        });

        const itemsInvalidos = itemsParaBackend.filter(
            (it) => !(Number(it.idProducto) > 0) || !(Number(it.cantidad) > 0)
        );
        if (nueva.items.length > 0 && itemsInvalidos.length > 0) {
            const nombres = itemsInvalidos.map((it) => it.producto).join(", ");
            throw new Error(`No se pudieron identificar los productos del pedido: ${nombres}`);
        }

        const idMesa =
            typeof nueva.idMesa === "number" && nueva.idMesa > 0 ? nueva.idMesa : null;

        const resComanda = await fetchJson<any>("/api/comandas", {
            method: "POST",
            body: JSON.stringify({
                idMesa,
                idUsuario: nueva.idUsuario ?? null,
                estado: "Pendiente",
                observacion: observacionFinal || null,
                cliente: nueva.cliente,
                personas: nueva.personas,
                items: itemsParaBackend,
            }),
        });

        return mapearComandaBackend(resComanda);
    },

    async cambiarEstado(id: number, nuevoEstado: EstadoComanda): Promise<void> {
        await fetchJson<unknown>(`/api/comandas/${id}`, {
            method: "PUT",
            body: JSON.stringify({ estado: nuevoEstado }),
        });
    },

    async anularComanda(id: number): Promise<void> {
        await fetchJson<unknown>(`/api/comandas/${id}`, {
            method: "PUT",
            body: JSON.stringify({ estado: "Cerrado" }),
        });
    },

    async eliminarComanda(id: number): Promise<void> {
        await fetchJson<unknown>(`/api/comandas/${id}`, {
            method: "DELETE",
        });
    },

    obtenerCarta(): PlatoCarta[] {
        return cartaMemoria;
    },

    async cargarCarta(): Promise<PlatoCarta[]> {
        try {
            const productos = await fetchJson<ProductoBackend[]>("/api/productos");
            if (productos && productos.length > 0) {
                cartaMemoria = productos
                    .filter((p) => p.activo !== false)
                    .map((p) => ({
                        id: p.id_producto,
                        nombre: p.nombre,
                        categoria: p.categoriaNombre || "Cocina",
                        precio: p.precio_venta,
                        descripcion: p.descripcion,
                    }));
            }
        } catch (error) {
            console.warn("Error al cargar productos desde backend:", error);
        }
        return cartaMemoria;
    },

    obtenerMesas(): number[] {
        return mesasMemoria;
    },

    async cargarMesas(): Promise<number[]> {
        try {
            const mesas = await fetchJson<MesaBackend[]>("/api/mesas");
            if (mesas && mesas.length > 0) {
                mesasMemoria = mesas.map((m) => m.numero);
            }
        } catch (error) {
            console.warn("Error al cargar números de mesas:", error);
        }
        return mesasMemoria;
    },
};
