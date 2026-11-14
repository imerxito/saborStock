import { GoogleGenAI } from "@google/genai";
import { supabase } from "../configuracion/Supabase.js";
import { ReporteRepositorio } from "../persistencia/ReporteRepositorio.js";
import { ProductoRepositorio } from "../persistencia/ProductoRepositorio.js";
import { IngredienteRepositorio } from "../persistencia/IngredienteRepositorio.js";
import { CategoriaRepositorio } from "../persistencia/CategoriaRepositorio.js";
import { AiConversacionRepositorio } from "../persistencia/AiConversacionRepositorio.js";
import { AiMensajeRepositorio } from "../persistencia/AiMensajeRepositorio.js";
import { AiConversacion } from "../modelos/AiConversacion.js";
import { AiMensaje } from "../modelos/AiMensaje.js";

export type EstadoFilaExcel = "valido" | "advertencia" | "error";
export type TipoFilaExcel = "producto" | "insumo";

export interface FilaExcelIA {
    fila: number;
    nombre: string;
    tipo: TipoFilaExcel;
    categoria: string;
    precio: number;
    stock: number;
    unidad?: string;
    estado: EstadoFilaExcel;
    motivo?: string;
}

interface FilaCruda {
    [clave: string]: string;
}

const MODELO_POR_DEFECTO = "gemini-2.5-flash-lite";

function normalizarTexto(texto: string): string {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function numeroDesdeTexto(valor: unknown): number {
    if (typeof valor === "number" && Number.isFinite(valor)) return valor;
    if (valor === null || valor === undefined) return 0;

    let texto = String(valor).trim();
    if (!texto) return 0;

    texto = texto.replace(/[^\d.,-]/g, "");
    if (!texto) return 0;

    const negativo = texto.startsWith("-");
    texto = texto.replace(/-/g, "");

    if (texto.includes(",") && texto.includes(".")) {
        texto = texto.replace(/\./g, "").replace(",", ".");
    } else if (texto.includes(",")) {
        const partes = texto.split(",");
        if (partes.length === 2 && partes[1].length <= 2) {
            texto = texto.replace(",", ".");
        } else {
            texto = texto.replace(/,/g, "");
        }
    } else if (/^\d{1,3}(\.\d{3})+$/.test(texto)) {
        texto = texto.replace(/\./g, "");
    }

    const numero = Number(texto);
    if (!Number.isFinite(numero)) return 0;
    return negativo ? -numero : numero;
}

function elegirDelimitador(linea: string): string {
    const candidatos = [",", ";", "\t", "|"];
    return candidatos.reduce((mejor, actual) => {
        const actualCount = linea.split(actual).length - 1;
        const mejorCount = linea.split(mejor).length - 1;
        return actualCount > mejorCount ? actual : mejor;
    }, ",");
}

function parsearLineaCsv(linea: string, delimitador: string): string[] {
    const resultado: string[] = [];
    let actual = "";
    let enComillas = false;

    for (let i = 0; i < linea.length; i++) {
        const char = linea[i];
        const siguiente = linea[i + 1];

        if (char === '"') {
            if (enComillas && siguiente === '"') {
                actual += '"';
                i++;
            } else {
                enComillas = !enComillas;
            }
            continue;
        }

        if (char === delimitador && !enComillas) {
            resultado.push(actual.trim());
            actual = "";
            continue;
        }

        actual += char;
    }

    resultado.push(actual.trim());
    return resultado;
}

function parsearCsv(texto: string): string[][] {
    const limpio = texto.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lineas = limpio.split("\n").filter((linea) => linea.trim().length > 0);
    if (lineas.length === 0) return [];

    const delimitador = elegirDelimitador(lineas[0]);
    return lineas.map((linea) => parsearLineaCsv(linea, delimitador));
}

function valorPorAlias(fila: FilaCruda, alias: string[]): string {
    const claves = Object.keys(fila);
    for (const aliasBuscada of alias) {
        const normalizada = normalizarTexto(aliasBuscada);
        const encontrada = claves.find((clave) => normalizarTexto(clave) === normalizada);
        if (encontrada) return fila[encontrada] ?? "";
    }

    for (const clave of claves) {
        const normalizada = normalizarTexto(clave);
        if (alias.some((a) => normalizada.includes(normalizarTexto(a)))) {
            return fila[clave] ?? "";
        }
    }

    return "";
}

function filasDesdeCsv(texto: string): { encabezados: string[]; filas: FilaCruda[] } {
    const matriz = parsearCsv(texto);
    if (matriz.length === 0) return { encabezados: [], filas: [] };

    const encabezados = matriz[0].map((h, index) => h || `columna_${index + 1}`);
    const filas = matriz.slice(1).map((celdas) => {
        const fila: FilaCruda = {};
        encabezados.forEach((encabezado, index) => {
            fila[encabezado] = celdas[index] ?? "";
        });
        return fila;
    });

    return { encabezados, filas };
}

function mapearFilaExcel(fila: FilaCruda, numeroFila: number): FilaExcelIA {
    const nombre = valorPorAlias(fila, ["nombre", "producto", "plato", "insumo", "item", "descripcion"]).trim();
    const tipoTexto = normalizarTexto(valorPorAlias(fila, ["tipo", "clase", "naturaleza"]));
    const tipo: TipoFilaExcel = tipoTexto.includes("insumo") || tipoTexto.includes("ingrediente")
        ? "insumo"
        : "producto";
    const categoria = valorPorAlias(fila, ["categoria", "categoría", "grupo", "seccion", "sección"]).trim() || "General";
    const precio = Math.max(0, numeroDesdeTexto(valorPorAlias(fila, ["precio", "precio_venta", "valor", "costo"])));
    const stock = Math.max(0, numeroDesdeTexto(valorPorAlias(fila, ["stock", "existencia", "cantidad", "inventario"])));
    const unidad = valorPorAlias(fila, ["unidad", "medida", "uom"]).trim();

    let estado: EstadoFilaExcel = "valido";
    const motivos: string[] = [];

    if (!nombre) {
        estado = "error";
        motivos.push("Falta el nombre");
    }
    if (!precio && tipo === "producto") {
        estado = estado === "error" ? estado : "advertencia";
        motivos.push("Precio vacío o cero");
    }
    if (!stock && tipo === "insumo") {
        estado = estado === "error" ? estado : "advertencia";
        motivos.push("Stock vacío o cero");
    }

    return {
        fila: numeroFila,
        nombre,
        tipo,
        categoria,
        precio,
        stock,
        unidad: unidad || undefined,
        estado,
        motivo: motivos.length > 0 ? motivos.join("; ") : undefined,
    };
}

function extraerJson(texto: string): unknown {
    const inicio = texto.indexOf("[");
    const fin = texto.lastIndexOf("]");
    if (inicio >= 0 && fin > inicio) {
        return JSON.parse(texto.slice(inicio, fin + 1));
    }
    return JSON.parse(texto);
}

export class IaServicio {
    private reporteRepositorio = new ReporteRepositorio();
    private productoRepositorio = new ProductoRepositorio();
    private ingredienteRepositorio = new IngredienteRepositorio();
    private categoriaRepositorio = new CategoriaRepositorio();
    private aiConversacionRepositorio = new AiConversacionRepositorio();
    private aiMensajeRepositorio = new AiMensajeRepositorio();

    private get modelo(): string {
        return process.env.GEMINI_MODEL || MODELO_POR_DEFECTO;
    }

    private tieneGemini(): boolean {
        return Boolean(process.env.GEMINI_API_KEY);
    }

    private async generarConGemini(prompt: string): Promise<string | null> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return null;

        const ai = new GoogleGenAI({ apiKey });
        const modelos = [this.modelo, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
        for (const mod of modelos) {
            try {
                const respuesta = await ai.models.generateContent({
                    model: mod,
                    contents: prompt,
                    config: {
                        temperature: 0.2,
                    },
                });
                if (respuesta.text?.trim()) {
                    return respuesta.text.trim();
                }
            } catch (err: any) {
                console.warn(`Modelo Gemini ${mod} falló, intentando alternativa...`, err?.message);
            }
        }
        return null;
    }

    private async contextoNegocio(): Promise<Record<string, unknown>> {
        const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [mesas, ventasAbiertas, facturas, comandasAbiertas, stockBajo] = await Promise.all([
            supabase.from("mesa").select("estado"),
            supabase.from("venta").select("id_venta, cliente, estado, fecha_apertura").eq("estado", "Abierta"),
            supabase.from("factura").select("id_factura, total_pagar, fecha_emision").gte("fecha_emision", hace30Dias),
            supabase.from("comanda").select("id_comanda, estado").neq("estado", "Cerrado"),
            this.reporteRepositorio.stock(true).catch(() => []),
        ]);

        const conteoMesas = (mesas.data || []).reduce<Record<string, number>>((acc, mesa: any) => {
            const estado = String(mesa.estado || "Desconocido");
            acc[estado] = (acc[estado] || 0) + 1;
            return acc;
        }, {});

        const totalFacturado30d = (facturas.data || []).reduce((suma: number, factura: any) => {
            return suma + Number(factura.total_pagar || 0);
        }, 0);

        return {
            mesas: {
                total: mesas.data?.length ?? 0,
                por_estado: conteoMesas,
            },
            ventas_abiertas: {
                cantidad: ventasAbiertas.data?.length ?? 0,
                clientes: (ventasAbiertas.data || []).slice(0, 10).map((venta: any) => venta.cliente),
            },
            facturacion_30d: {
                cantidad: facturas.data?.length ?? 0,
                total: totalFacturado30d,
            },
            comandas_abiertas: comandasAbiertas.data?.length ?? 0,
            stock_bajo: stockBajo.slice(0, 10).map((item) => ({
                ingrediente: item.nombre,
                unidad: item.unidad,
                stock: item.stock,
                minimo: item.stock_minimo,
                faltante: item.faltante,
            })),
        };
    }

    async listarConversaciones(idUsuario?: number | null): Promise<AiConversacion[]> {
        const id = this.normalizarIdUsuario(idUsuario);
        return this.aiConversacionRepositorio.listar(id);
    }

    async obtenerConversacion(id: number): Promise<{ conversacion: AiConversacion; mensajes: AiMensaje[] }> {
        if (!(id > 0)) throw new Error("La conversación debe ser mayor a 0");
        const conversacion = await this.aiConversacionRepositorio.obtenerPorId(id);
        if (!conversacion) throw new Error("Conversación no encontrada");
        const mensajes = await this.aiMensajeRepositorio.listarPorConversacion(id);
        return { conversacion, mensajes };
    }

    async eliminarConversacion(id: number): Promise<void> {
        if (!(id > 0)) throw new Error("La conversación debe ser mayor a 0");
        await this.aiMensajeRepositorio.eliminarPorConversacion(id);
        await this.aiConversacionRepositorio.eliminar(id);
    }

    private normalizarIdUsuario(idUsuario?: number | null): number | null {
        const id = Number(idUsuario);
        return Number.isFinite(id) && id > 0 ? id : null;
    }

    private tituloDesdeMensaje(mensaje: string): string {
        const limpio = mensaje.replace(/\s+/g, " ").trim();
        return limpio.length > 60 ? `${limpio.slice(0, 57)}...` : limpio || "Nueva conversación";
    }

    private async asegurarConversacion(idConversacion: number | null | undefined, idUsuario: number | null, mensaje: string): Promise<AiConversacion> {
        if (idConversacion && idConversacion > 0) {
            const existente = await this.aiConversacionRepositorio.obtenerPorId(idConversacion);
            if (!existente) throw new Error("Conversación no encontrada");
            return existente;
        }
        return this.aiConversacionRepositorio.crear({
            idUsuario,
            titulo: this.tituloDesdeMensaje(mensaje),
        });
    }

    async chat(
        mensaje: string,
        opciones: { idUsuario?: number | null; conversacionId?: number | null } = {}
    ): Promise<{ respuesta: string; modo: "gemini" | "local"; conversacionId: number }> {
        const texto = String(mensaje || "").trim();
        if (!texto) throw new Error("El mensaje es obligatorio");

        const idUsuario = this.normalizarIdUsuario(opciones.idUsuario);
        const conversacion = await this.asegurarConversacion(opciones.conversacionId, idUsuario, texto);

        await this.aiMensajeRepositorio.crear({
            idConversacion: conversacion.id,
            rol: "user",
            contenido: texto,
        });

        const contexto = await this.contextoNegocio();
        const prompt = [
            "Eres el asistente operativo de SaborStock, un restaurante en Colombia.",
            "Responde en español, breve y accionable. Usa únicamente los datos JSON entregados; no inventes cifras.",
            "Puedes hablar de ventas, mesas, comandas, facturación, inventario y recomendaciones.",
            "",
            `Pregunta del usuario: ${texto}`,
            "",
            "Datos del negocio:",
            JSON.stringify(contexto),
        ].join("\n");

        let respuesta: string;
        let modo: "gemini" | "local";
        if (this.tieneGemini()) {
            const generada = await this.generarConGemini(prompt);
            if (generada) {
                respuesta = generada;
                modo = "gemini";
            } else {
                respuesta = this.respuestaLocal(texto, contexto);
                modo = "local";
            }
        } else {
            respuesta = this.respuestaLocal(texto, contexto);
            modo = "local";
        }

        await this.aiMensajeRepositorio.crear({
            idConversacion: conversacion.id,
            rol: "assistant",
            contenido: respuesta,
            metadata: { modo },
        });
        await this.aiConversacionRepositorio.tocar(conversacion.id);

        return { respuesta, modo, conversacionId: conversacion.id };
    }

    private respuestaLocal(mensaje: string, contexto: Record<string, any>): string {
        const texto = normalizarTexto(mensaje);
        const ventas = contexto.ventas_abiertas?.cantidad ?? 0;
        const comandas = contexto.comandas_abiertas ?? 0;
        const facturas = contexto.facturacion_30d?.cantidad ?? 0;
        const total = contexto.facturacion_30d?.total ?? 0;
        const stockBajo = contexto.stock_bajo ?? [];

        if (texto.includes("stock") || texto.includes("inventario") || texto.includes("faltante")) {
            if (stockBajo.length === 0) return "No hay ingredientes por debajo del stock mínimo en este momento.";
            const lista = stockBajo
                .slice(0, 5)
                .map((item: any) => `${item.ingrediente} (${item.stock}/${item.minimo} ${item.unidad || ""})`)
                .join(", ");
            return `Hay ${stockBajo.length} ingredientes con stock bajo: ${lista}. Conviene revisar compras antes del pico de servicio.`;
        }

        if (texto.includes("mesa") || texto.includes("salon") || texto.includes("salón")) {
            const estados = contexto.mesas?.por_estado ?? {};
            const ocupadas = estados.Ocupada ?? estados.Ocupadas ?? 0;
            const libres = estados.Libre ?? estados.Disponible ?? 0;
            return `Estado de mesas: ${libres} libres/disponibles y ${ocupadas} ocupadas. Ventas abiertas: ${ventas}.`;
        }

        if (texto.includes("venta") || texto.includes("factura") || texto.includes("caja") || texto.includes("ingreso")) {
            return `En los últimos 30 días hay ${facturas} facturas por $${Number(total).toLocaleString("es-CO")}. Ahora mismo hay ${ventas} ventas abiertas y ${comandas} comandas sin cerrar.`;
        }

        return `Puedo ayudarte con ventas, mesas, comandas, facturación e inventario. Estado actual: ${ventas} ventas abiertas, ${comandas} comandas abiertas, ${facturas} facturas en 30 días y ${stockBajo.length} alertas de stock.`;
    }

    async procesarExcel(datos: { nombreArchivo?: string; contenido?: string }): Promise<{ preview: FilaExcelIA[]; usandoIA: boolean; resumen: string }> {
        const contenido = String(datos.contenido || "").trim();
        if (!contenido) throw new Error("El archivo está vacío o no se pudo leer");

        const { filas } = filasDesdeCsv(contenido);
        if (filas.length === 0) throw new Error("No se encontraron filas de datos en el archivo");

        const mapeadas = filas.slice(0, 500).map((fila, index) => mapearFilaExcel(fila, index + 2));
        let resultado = mapeadas;
        let usandoIA = false;

        if (this.tieneGemini() && mapeadas.length > 0) {
            const muestra = mapeadas.slice(0, 120).map((fila) => ({
                fila: fila.fila,
                nombre: fila.nombre,
                tipo: fila.tipo,
                categoria: fila.categoria,
                precio: fila.precio,
                stock: fila.stock,
                unidad: fila.unidad,
            }));

            const prompt = [
                "Eres un normalizador de datos para un restaurante en Colombia.",
                "Corrige nombres, categorías, tipos (producto|insumo), precios en COP, stock y unidad.",
                "Marca estado 'error' solo si falta el nombre; 'advertencia' si faltan precio o stock relevantes; si no, 'valido'.",
                "Devuelve únicamente un arreglo JSON con objetos: fila, nombre, tipo, categoria, precio, stock, unidad, estado, motivo.",
                "No inventes productos ni cambies cantidades.",
                "",
                JSON.stringify(muestra),
            ].join("\n");

            try {
                const texto = await this.generarConGemini(prompt);
                if (texto) {
                    const parseado = extraerJson(texto) as any[];
                    if (Array.isArray(parseado) && parseado.length > 0) {
                        const porFila = new Map(parseado.map((item: any) => [Number(item.fila), item]));
                        resultado = mapeadas.map((base) => {
                            const ia = porFila.get(base.fila);
                            if (!ia) return base;
                            return {
                                ...base,
                                nombre: String(ia.nombre || base.nombre).trim(),
                                tipo: ia.tipo === "insumo" ? "insumo" : "producto",
                                categoria: String(ia.categoria || base.categoria).trim() || "General",
                                precio: Math.max(0, numeroDesdeTexto(ia.precio ?? base.precio)),
                                stock: Math.max(0, numeroDesdeTexto(ia.stock ?? base.stock)),
                                unidad: String(ia.unidad || base.unidad || "").trim() || undefined,
                                estado: ["valido", "advertencia", "error"].includes(ia.estado) ? ia.estado : base.estado,
                                motivo: ia.motivo ? String(ia.motivo) : base.motivo,
                            } as FilaExcelIA;
                        });
                        usandoIA = true;
                    }
                }
            } catch (error) {
                console.warn("Gemini no pudo normalizar el Excel, se usa validación local:", error);
            }
        }

        const validos = resultado.filter((fila) => fila.estado !== "error").length;
        const errores = resultado.length - validos;
        return {
            preview: resultado,
            usandoIA,
            resumen: `${resultado.length} filas procesadas: ${validos} listas y ${errores} con error.`,
        };
    }

    async confirmarExcel(filas: FilaExcelIA[]): Promise<{ insertados: number; actualizados: number; errores: Array<{ fila: number; nombre: string; error: string }> }> {
        const candidatas = (filas || []).filter((fila) => fila.estado !== "error" && fila.nombre?.trim());
        const [productos, ingredientes, categorias] = await Promise.all([
            this.productoRepositorio.listar(),
            this.ingredienteRepositorio.listar(),
            this.categoriaRepositorio.listar(),
        ]);

        const mapaCategorias = new Map(categorias.map((categoria) => [normalizarTexto(categoria.nombre), categoria]));
        const mapaProductos = new Map(productos.map((producto) => [normalizarTexto(producto.nombre), producto]));
        const mapaIngredientes = new Map(ingredientes.map((ingrediente) => [normalizarTexto(ingrediente.nombre), ingrediente]));
        const unidades = await this.unidadesMedida();

        let insertados = 0;
        let actualizados = 0;
        const errores: Array<{ fila: number; nombre: string; error: string }> = [];

        for (const [index, fila] of candidatas.entries()) {
            try {
                if (fila.tipo === "insumo") {
                    const unidad = this.buscarUnidad(unidades, fila.unidad);
                    if (!unidad) throw new Error("No hay unidad de medida disponible para el insumo");

                    const existente = mapaIngredientes.get(normalizarTexto(fila.nombre));
                    if (existente) {
                        await this.ingredienteRepositorio.actualizar(existente.id_ingrediente, {
                            stock: fila.stock,
                            precio_referencia: fila.precio || existente.precio_referencia,
                            activo: true,
                        });
                        actualizados++;
                    } else {
                        await this.ingredienteRepositorio.crear({
                            codigo: `INS-IA-${Date.now().toString(36).toUpperCase()}-${index}`,
                            nombre: fila.nombre.trim(),
                            id_unidad: Number(unidad.id),
                            stock: fila.stock,
                            stock_minimo: 0,
                            precio_referencia: fila.precio,
                            activo: true,
                        });
                        insertados++;
                    }
                    continue;
                }

                const categoria = await this.asegurarCategoria(mapaCategorias, fila.categoria);
                const existente = mapaProductos.get(normalizarTexto(fila.nombre));
                if (existente) {
                    await this.productoRepositorio.actualizar(existente.id_producto, {
                        precio_venta: fila.precio,
                        descripcion: fila.categoria,
                        activo: true,
                    });
                    actualizados++;
                } else {
                    await this.productoRepositorio.crear({
                        codigo: `PRD-IA-${Date.now().toString(36).toUpperCase()}-${index}`,
                        nombre: fila.nombre.trim(),
                        id_categoria: Number(categoria.id_categoria ?? categoria.id),
                        precio_venta: fila.precio,
                        descripcion: fila.categoria,
                        activo: true,
                    });
                    insertados++;
                }
            } catch (error: any) {
                errores.push({
                    fila: fila.fila,
                    nombre: fila.nombre,
                    error: error?.message || "No se pudo guardar la fila",
                });
            }
        }

        return { insertados, actualizados, errores };
    }

    private async asegurarCategoria(
        mapa: Map<string, any>,
        nombre: string
    ): Promise<any> {
        const clave = normalizarTexto(nombre || "General");
        const existente = mapa.get(clave);
        if (existente) return existente;

        const categoria = await this.categoriaRepositorio.crear({
            nombre: nombre.trim() || "General",
            descripcion: "Creada por importación IA",
        });
        mapa.set(clave, categoria);
        return categoria;
    }

    private async unidadesMedida(): Promise<any[]> {
        const { data, error } = await supabase.from("unidad_medida").select("*").eq("activo", true);
        if (error) throw new Error(`No se pudieron cargar unidades de medida: ${error.message}`);
        return data || [];
    }

    private buscarUnidad(unidades: any[], unidadFila?: string): any | null {
        if (!unidades.length) return null;
        const buscada = normalizarTexto(unidadFila || "");
        if (buscada) {
            const encontrada = unidades.find((unidad) => {
                const nombre = normalizarTexto(unidad.nombre || "");
                const abreviatura = normalizarTexto(unidad.abreviatura || "");
                return nombre === buscada || abreviatura === buscada || nombre.includes(buscada) || abreviatura.includes(buscada);
            });
            if (encontrada) return encontrada;
        }
        return unidades.find((unidad) => normalizarTexto(unidad.nombre).includes("unidad")) || unidades[0];
    }
}
