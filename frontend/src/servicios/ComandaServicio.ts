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
            return "Entregada";
        case "Pendiente":
        case "En preparación":
        case "Lista":
        case "Entregada":
            return estadoBackend as EstadoComanda;
        default:
            return "Pendiente";
    }
}

export const ComandaServicio = {
    async obtenerComandas(): Promise<Comanda[]> {
        try {
            const data = await fetchJson<any[]>("/api/comandas");

            const comandasMapeadas: Comanda[] = (data || []).map((c: any) => {
                const estado = normalizarEstado(c.estado);
                const items: ItemComanda[] = Array.isArray(c.detalles)
                    ? c.detalles.map((d: any) => ({
                          id: d.id,
                          idProducto: d.idProducto,
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

                return {
                    id: Number(c.id),
                    mesa: Number(c.mesaNumero ?? c.idMesa ?? 1),
                    idMesa: c.idMesa ? Number(c.idMesa) : undefined,
                    items,
                    nota: c.observacion || "",
                    estado,
                    creada: c.fechaCreacion ? new Date(c.fechaCreacion).getTime() : Date.now(),
                    mesero: c.usuarioNombre || "Mesero",
                    cliente: c.observacion?.startsWith("Cliente: ")
                        ? c.observacion.split(" | ")[0].replace("Cliente: ", "")
                        : undefined,
                    total: totalCalculado,
                    despachadaEn:
                        estado === "Lista" || estado === "Entregada" ? Date.now() : undefined,
                };
            });

            // Guardar en caché local
            try {
                localStorage.setItem(CLAVE_STORAGE, JSON.stringify(comandasMapeadas));
            } catch {
                // Ignore
            }

            return comandasMapeadas;
        } catch (error) {
            console.warn("Fallo al conectar con el backend de comandas, cargando caché:", error);
            try {
                const cache = localStorage.getItem(CLAVE_STORAGE);
                if (cache) return JSON.parse(cache) as Comanda[];
            } catch {
                // Ignore
            }
            return [];
        }
    },

    async crearComanda(nueva: NuevaComanda): Promise<Comanda> {
        const observacionFinal = [
            nueva.cliente ? `Cliente: ${nueva.cliente}` : "",
            nueva.personas ? `Personas: ${nueva.personas}` : "",
            nueva.nota ? `Nota: ${nueva.nota}` : "",
        ]
            .filter(Boolean)
            .join(" | ");

        let idComandaCreada = Date.now();

        try {
            // 1. Crear comanda en backend
            const resComanda = await fetchJson<{ id: number }>("/api/comandas", {
                method: "POST",
                body: JSON.stringify({
                    idMesa: nueva.idMesa ?? nueva.mesa,
                    estado: "Pendiente",
                    observacion: observacionFinal || null,
                }),
            });
            idComandaCreada = resComanda.id;

            // 2. Crear los detalles de comanda en backend
            for (const item of nueva.items) {
                // Buscar idProducto si no viene directo
                let idProd = item.idProducto;
                if (!idProd) {
                    const match = cartaMemoria.find((p) => p.nombre === item.producto);
                    if (match && match.id) idProd = match.id;
                }

                if (idProd) {
                    await fetchJson<unknown>("/api/detalles-comanda", {
                        method: "POST",
                        body: JSON.stringify({
                            idComanda: idComandaCreada,
                            idProducto: idProd,
                            cantidad: item.cantidad,
                            nota: item.nota ?? null,
                        }),
                    }).catch((err) =>
                        console.warn("Error creando detalle de comanda en backend:", err)
                    );
                }
            }

            // 3. Si tiene mesa asignada, actualizar mesa a Ocupada
            const mesaId = nueva.idMesa ?? nueva.mesa;
            if (mesaId) {
                await fetchJson<unknown>(`/api/mesas/${mesaId}`, {
                    method: "PUT",
                    body: JSON.stringify({ estado: "Ocupada" }),
                }).catch((err) =>
                    console.warn("Error actualizando estado de mesa a Ocupada:", err)
                );
            }
        } catch (error) {
            console.warn("No se pudo persistir en backend inmediatamente, guardando local:", error);
        }

        const comandaObj: Comanda = {
            id: idComandaCreada,
            mesa: nueva.mesa,
            idMesa: nueva.idMesa,
            items: nueva.items,
            nota: observacionFinal,
            estado: "Pendiente",
            creada: Date.now(),
            mesero: nueva.mesero || "Mesero",
            cliente: nueva.cliente,
            personas: nueva.personas,
        };

        return comandaObj;
    },

    async cambiarEstado(id: number, nuevoEstado: EstadoComanda): Promise<void> {
        try {
            await fetchJson<unknown>(`/api/comandas/${id}`, {
                method: "PUT",
                body: JSON.stringify({ estado: nuevoEstado }),
            });
        } catch (error) {
            console.warn(`Error al cambiar estado de comanda #${id} en el backend:`, error);
        }
    },

    async anularComanda(id: number): Promise<void> {
        try {
            await fetchJson<unknown>(`/api/comandas/${id}`, {
                method: "PUT",
                body: JSON.stringify({ estado: "Cerrado" }),
            });
        } catch (error) {
            console.warn(`Error al anular comanda #${id} en el backend:`, error);
        }
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
