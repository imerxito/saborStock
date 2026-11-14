import { GoogleGenAI } from "@google/genai";
import { supabase } from "../configuracion/Supabase.js";

import {
    Reporte,
    ResumenDiario,
    StockIngrediente,
    TipoReporte
} from "../modelos/Reporte.js";

import { ReporteRepositorio } from "../persistencia/ReporteRepositorio.js";

export interface DashboardTurnoCaja {
    id: string;
    cajero: string;
    baseInicial: number;
    ventasEfectivo: number;
    ventasTarjeta: number;
    ventasTransferencia: number;
    totalGenerado: number;
    egresosTotales: number;
    cierreEstimado: number;
    diferencia: number;
    fecha: string;
    horaApertura: string;
    horaCierre: string;
    movimientos: { tipo: "Ingreso" | "Egreso"; concepto: string; monto: number }[];
}

export interface DashboardEmpleado {
    id: string;
    nombre: string;
    rol: string;
    comandasAtendidas: number;
    totalVendido: number;
    propinas: number;
    ultimoDiaTrabajado: string;
}

export interface DashboardGasto {
    id: string;
    categoria: "Nómina" | "Servicios" | "Compras" | "Otros";
    concepto: string;
    monto: number;
    fecha: string;
    detalle: string;
    responsable: string;
}

export interface DashboardProducto {
    id: string;
    nombre: string;
    categoria: string;
    unidadesVendidas: number;
    ingresos: number;
    precioPromedio: number;
}

export interface DashboardInsumoGasto {
    id: string;
    nombre: string;
    categoria: string;
    gastoDia: number;
    gastoSemana: number;
    gastoMes: number;
    stockActual: string;
    estado: "Óptimo" | "Bajo" | "Agotado";
}

export interface DashboardReportes {
    filtro: "Hoy" | "Semana" | "Mes";
    fechaInicio: string;
    fechaFin: string;
    cajas: DashboardTurnoCaja[];
    empleados: DashboardEmpleado[];
    gastos: DashboardGasto[];
    productos: DashboardProducto[];
    inventarioGastos: DashboardInsumoGasto[];
    resumen: {
        totalGeneradoCajas: number;
        totalGastosRegistrados: number;
        balanceNeto: number;
        totalPropinas: number;
        productoTop: DashboardProducto | null;
        insumosCriticos: number;
    };
}

const ZONA_HORARIA = "America/Bogota";

// Si ya se generó un reporte igual hace menos de estos minutos, se devuelve ese
// en vez de volver a llamar a la IA (cuida el límite del plan gratuito).
const MINUTOS_REUSO = 5;

function hoyEnColombia(): string {
    return new Date().toLocaleDateString("en-CA", { timeZone: ZONA_HORARIA });
}

function esFechaValida(fecha: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(Date.parse(fecha));
}

function restarDias(fecha: string, dias: number): string {
    const d = new Date(`${fecha}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - dias);
    return d.toISOString().slice(0, 10);
}

// La columna fecha_creacion es "timestamp sin zona" guardado en UTC
function minutosDesde(fechaUtc: string): number {
    const tieneZona = /(Z|[+-]\d{2}:?\d{2})$/.test(fechaUtc);
    const ms = Date.parse(tieneZona ? fechaUtc : `${fechaUtc}Z`);
    return (Date.now() - ms) / 60000;
}

// Junta los días del rango en una sola fila por ingrediente
function agruparPorIngrediente(filas: ResumenDiario[]): ResumenDiario[] {
    const mapa = new Map<number, ResumenDiario>();

    for (const f of filas) {
        const actual = mapa.get(f.id_ingrediente);
        if (!actual) {
            mapa.set(f.id_ingrediente, { ...f });
        } else {
            actual.entradas += f.entradas;
            actual.salidas += f.salidas;
            actual.ajustes += f.ajustes;
            actual.costo_salidas += f.costo_salidas;
        }
    }

    return [...mapa.values()];
}

export class ReporteServicio {
    private reporteRepositorio: ReporteRepositorio;

    constructor() {
        this.reporteRepositorio = new ReporteRepositorio();
    }

    async stockBajo(): Promise<StockIngrediente[]> {
        return await this.reporteRepositorio.stock(true);
    }

    // Datos del día para pantalla y PDF (sin IA)
    async resumenDia(fecha?: string): Promise<ResumenDiario[]> {
        const dia = fecha ?? hoyEnColombia();

        if (!esFechaValida(dia)) {
            throw new Error("La fecha debe tener el formato AAAA-MM-DD");
        }

        return await this.reporteRepositorio.resumenPorRango(dia, dia);
    }

    async ultimo(tipo?: TipoReporte): Promise<Reporte | null> {
        return await this.reporteRepositorio.ultimo(tipo);
    }

    async listar(): Promise<Reporte[]> {
        return await this.reporteRepositorio.listar();
    }

    async generar(tipo: TipoReporte, fecha?: string): Promise<Reporte> {
        if (tipo !== "DIARIO" && tipo !== "SEMANAL") {
            throw new Error("El tipo debe ser DIARIO o SEMANAL");
        }

        const fechaFin = fecha ?? hoyEnColombia();

        if (!esFechaValida(fechaFin)) {
            throw new Error("La fecha debe tener el formato AAAA-MM-DD");
        }

        const fechaInicio = tipo === "DIARIO" ? fechaFin : restarDias(fechaFin, 6);

        const previo = await this.reporteRepositorio.ultimo(tipo);
        if (
            previo &&
            previo.fecha_inicio === fechaInicio &&
            previo.fecha_fin === fechaFin &&
            minutosDesde(previo.fecha_creacion) < MINUTOS_REUSO
        ) {
            return previo;
        }

        const filas = await this.reporteRepositorio.resumenPorRango(
            fechaInicio,
            fechaFin
        );
        const resumen = agruparPorIngrediente(filas);
        const bajos = await this.reporteRepositorio.stock(true);

        if (resumen.length === 0 && bajos.length === 0) {
            throw new Error(
                "No hay movimientos ni alertas de stock en ese periodo para reportar"
            );
        }

        const contenido = await this.redactarConIA(
            tipo,
            fechaInicio,
            fechaFin,
            resumen,
            bajos
        );

        return await this.reporteRepositorio.crear({
            tipo,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            contenido
        });
    }

    // La IA solo redacta: los números ya vienen calculados desde SQL
    private async redactarConIA(
        tipo: TipoReporte,
        fechaInicio: string,
        fechaFin: string,
        resumen: ResumenDiario[],
        bajos: StockIngrediente[]
    ): Promise<string> {
        const apiKey = process.env.GEMINI_API_KEY;
        const modelo = process.env.GEMINI_MODEL;

        if (!apiKey) {
            throw new Error("GEMINI_API_KEY no está definido en las variables de entorno");
        }
        if (!modelo) {
            throw new Error("GEMINI_MODEL no está definido en las variables de entorno");
        }

        const datos = {
            periodo: { tipo, desde: fechaInicio, hasta: fechaFin },
            movimientos_por_ingrediente: resumen.map((r) => ({
                ingrediente: r.ingrediente,
                unidad: r.unidad,
                entradas: r.entradas,
                salidas: r.salidas,
                ajustes: r.ajustes,
                costo_salidas: r.costo_salidas
            })),
            ingredientes_bajo_minimo: bajos.map((s) => ({
                ingrediente: s.nombre,
                unidad: s.unidad,
                stock: s.stock,
                stock_minimo: s.stock_minimo,
                faltante: s.faltante
            }))
        };

        const prompt =
            "Eres analista de inventario de un restaurante en Colombia. " +
            "Con los datos en JSON escribe un reporte breve en español, con tres partes: " +
            "1) resumen del periodo, 2) alertas (stock bajo y consumos llamativos), " +
            "3) recomendaciones de compra. Usa solo los datos dados, no inventes cifras. " +
            "Los costos están en pesos colombianos. Sé concreto y corto.\n\n" +
            JSON.stringify(datos);

        const ai = new GoogleGenAI({ apiKey });
        const respuesta = await ai.models.generateContent({
            model: modelo,
            contents: prompt
        });

        const texto = respuesta.text?.trim();

        if (!texto) {
            throw new Error("La IA no devolvió contenido para el reporte");
        }

        return texto;
    }

    async obtenerDashboard(filtro: "Hoy" | "Semana" | "Mes" = "Hoy"): Promise<DashboardReportes> {
        const ahora = new Date();
        const formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: ZONA_HORARIA,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        const fechaHoyStr = formatter.format(ahora);
        const fechaFinStr = fechaHoyStr;
        let fechaInicioStr = fechaHoyStr;

        if (filtro === "Semana") {
            const d = new Date(`${fechaHoyStr}T00:00:00-05:00`);
            d.setDate(d.getDate() - 6);
            fechaInicioStr = formatter.format(d);
        } else if (filtro === "Mes") {
            const [y, m] = fechaHoyStr.split("-");
            fechaInicioStr = `${y}-${m}-01`;
        }

        const desdeIso = `${fechaInicioStr}T00:00:00.000-05:00`;
        const hastaIso = `${fechaHoyStr}T23:59:59.999-05:00`;

        // 1. Turnos de Caja
        const { data: turnosDb } = await supabase
            .from("turno_caja")
            .select("*, usuario:id_usuario_apertura(nombre), historial_caja(*)")
            .order("fecha_apertura", { ascending: false });

        const turnosFiltrados = (turnosDb || []).filter((t: any) => {
            if (t.estado === "Abierto") return true;
            if (!t.fecha_apertura) return false;
            return t.fecha_apertura >= desdeIso && t.fecha_apertura <= hastaIso;
        });

        const cajas: DashboardTurnoCaja[] = turnosFiltrados.map((t: any) => {
            const movs = Array.isArray(t.historial_caja) ? t.historial_caja : [];
            let ventasEfectivo = 0;
            let ventasTarjeta = 0;
            let ventasTransferencia = 0;
            let egresosTotales = 0;

            for (const m of movs) {
                const monto = Number(m.monto || 0);
                const tipo = (m.tipo_pago || "").toLowerCase();
                const metodo = (m.metodo_pago || "").toLowerCase();

                if (tipo === "egreso") {
                    egresosTotales += monto;
                } else {
                    if (metodo.includes("tarjeta")) ventasTarjeta += monto;
                    else if (metodo.includes("transf")) ventasTransferencia += monto;
                    else ventasEfectivo += monto;
                }
            }

            if (ventasEfectivo === 0 && ventasTarjeta === 0 && ventasTransferencia === 0) {
                ventasEfectivo = Number(t.ventas_efectivo || 0);
                ventasTarjeta = Number(t.ventas_tarjeta || 0);
                ventasTransferencia = Number(t.ventas_transferencia || 0);
            }
            if (egresosTotales === 0 && t.egresos_totales) {
                egresosTotales = Number(t.egresos_totales || 0);
            }

            const totalGenerado = ventasEfectivo + ventasTarjeta + ventasTransferencia;
            const baseInicial = Number(t.monto_inicial || 0);
            const cierreEstimado = baseInicial + totalGenerado - egresosTotales;
            const montoFinal = t.monto_final !== null && t.monto_final !== undefined ? Number(t.monto_final) : null;
            const diferencia = montoFinal !== null ? montoFinal - cierreEstimado : Number(t.diferencia || 0);

            const fAp = t.fecha_apertura ? new Date(t.fecha_apertura) : null;
            const fCi = t.fecha_cierre ? new Date(t.fecha_cierre) : null;

            return {
                id: `CJ-${String(t.id_turno_caja).padStart(2, "0")}`,
                cajero: t.usuario?.nombre || "Cajero",
                baseInicial,
                ventasEfectivo,
                ventasTarjeta,
                ventasTransferencia,
                totalGenerado,
                egresosTotales,
                cierreEstimado,
                diferencia,
                fecha: t.fecha_apertura ? t.fecha_apertura.substring(0, 10) : fechaHoyStr,
                horaApertura: fAp ? fAp.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false }) : "--:--",
                horaCierre: fCi ? fCi.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false }) : (t.estado === "Abierto" ? "En curso" : "--:--"),
                movimientos: movs.map((m: any) => ({
                    tipo: m.tipo_pago?.toLowerCase() === "egreso" ? "Egreso" : "Ingreso",
                    concepto: m.descripcion || (m.tipo_pago?.toLowerCase() === "egreso" ? "Egreso de caja" : "Ingreso de caja"),
                    monto: Number(m.monto || 0),
                })),
            };
        });

        // 2. Facturas y Productos
        const { data: facturasDb } = await supabase
            .from("factura")
            .select("*, detalle_factura(*, producto:id_producto(nombre, precio_venta, id_categoria, categoria:id_categoria(nombre)))")
            .order("fecha_emision", { ascending: false });

        const facturasEnPeriodo = (facturasDb || []).filter((f: any) => {
            if (!f.fecha_emision) return false;
            return f.fecha_emision >= desdeIso && f.fecha_emision <= hastaIso && f.estado !== "Cancelada";
        });

        const { data: todosProductos } = await supabase
            .from("producto")
            .select("*, categoria:id_categoria(nombre)")
            .eq("activo", true);

        const ventasPorProducto = new Map<number, { unidades: number; ingresos: number }>();
        for (const f of facturasEnPeriodo) {
            for (const d of f.detalle_factura || []) {
                const idProd = Number(d.id_producto);
                const cant = Number(d.cantidad || 0);
                const sub = Number(d.subtotal || 0);
                const prev = ventasPorProducto.get(idProd) || { unidades: 0, ingresos: 0 };
                ventasPorProducto.set(idProd, {
                    unidades: prev.unidades + cant,
                    ingresos: prev.ingresos + sub,
                });
            }
        }

        const productos: DashboardProducto[] = (todosProductos || []).map((p: any) => {
            const venta = ventasPorProducto.get(Number(p.id_producto)) || { unidades: 0, ingresos: 0 };
            const precioUnit = Number(p.precio_venta || 0);
            const precioPromedio = venta.unidades > 0 ? Math.round(venta.ingresos / venta.unidades) : precioUnit;
            return {
                id: `PRD-${String(p.id_producto).padStart(2, "0")}`,
                nombre: p.nombre,
                categoria: p.categoria?.nombre || "General",
                unidadesVendidas: venta.unidades,
                ingresos: venta.ingresos,
                precioPromedio,
            };
        });
        productos.sort((a, b) => b.ingresos - a.ingresos || b.unidadesVendidas - a.unidadesVendidas);

        // 3. Empleados / Rendimiento
        const { data: usuariosDb } = await supabase
            .from("usuario")
            .select("*, comanda(*), factura(*)")
            .eq("activo", true);

        const empleados: DashboardEmpleado[] = (usuariosDb || []).map((u: any) => {
            const comandasEnPeriodo = (u.comanda || []).filter((c: any) => {
                if (!c.fecha_creacion) return false;
                return c.fecha_creacion >= desdeIso && c.fecha_creacion <= hastaIso;
            });
            const facturasUsuario = facturasEnPeriodo.filter((f: any) => f.id_usuario === u.id_usuario);
            const totalVendido = facturasUsuario.reduce((acc: number, f: any) => acc + Number(f.total_pagar || 0), 0);
            const propinas = facturasUsuario.reduce((acc: number, f: any) => acc + Number(f.propina || 0), 0);

            let ultimoDia = fechaHoyStr;
            const ultFactura = u.factura?.[0]?.fecha_emision;
            const ultComanda = u.comanda?.[0]?.fecha_creacion;
            if (ultFactura) ultimoDia = ultFactura.substring(0, 10);
            else if (ultComanda) ultimoDia = ultComanda.substring(0, 10);

            return {
                id: `EMP-${String(u.id_usuario).padStart(2, "0")}`,
                nombre: u.nombre || "Empleado",
                rol: u.rol || "Mesero",
                comandasAtendidas: comandasEnPeriodo.length,
                totalVendido,
                propinas,
                ultimoDiaTrabajado: ultimoDia,
            };
        });
        empleados.sort((a, b) => b.totalVendido - a.totalVendido);

        // 4. Gastos
        const { data: comprasDb } = await supabase
            .from("compra")
            .select("*, proveedor:id_proveedor(nombre)")
            .gte("fecha", fechaInicioStr)
            .lte("fecha", fechaFinStr)
            .order("fecha", { ascending: false });

        const { data: egresosCajaDb } = await supabase
            .from("historial_caja")
            .select("*, usuario:id_usuario(nombre)")
            .eq("tipo_pago", "egreso")
            .gte("fecha_movimiento", desdeIso)
            .lte("fecha_movimiento", hastaIso)
            .order("fecha_movimiento", { ascending: false });

        const gastos: DashboardGasto[] = [];

        for (const c of comprasDb || []) {
            gastos.push({
                id: `GAS-C${c.id_compra}`,
                categoria: "Compras",
                concepto: c.proveedor?.nombre ? `Compra a ${c.proveedor.nombre}` : `Compra de Suministros #${c.id_compra}`,
                monto: Number(c.total || 0),
                fecha: c.fecha ? c.fecha.substring(0, 10) : fechaHoyStr,
                detalle: `Factura: ${c.factura || "S/N"} | Estado: ${c.estado || "Completado"}`,
                responsable: "Administración",
            });
        }

        for (const e of egresosCajaDb || []) {
            const desc = e.descripcion || "";
            let categoria: "Nómina" | "Servicios" | "Compras" | "Otros" = "Otros";
            if (/n[oó]mina|sueldo|salario|mesero|cajero|propina/i.test(desc)) categoria = "Nómina";
            else if (/servicio|luz|agua|gas|energ[ií]a|internet|arriendo/i.test(desc)) categoria = "Servicios";
            else if (/compra|insumo|proveedor|carne|verdura|hielo/i.test(desc)) categoria = "Compras";

            gastos.push({
                id: `GAS-E${e.id_historial_caja}`,
                categoria,
                concepto: desc || "Egreso operativo de caja",
                monto: Number(e.monto || 0),
                fecha: e.fecha_movimiento ? e.fecha_movimiento.substring(0, 10) : fechaHoyStr,
                detalle: `Turno #${e.id_turno_caja}`,
                responsable: e.usuario?.nombre || "Cajero",
            });
        }

        // 5. Inventario
        const { data: ingredientesDb } = await supabase
            .from("ingrediente")
            .select("*, categoria_ingrediente:id_categoria_ingrediente(nombre), unidad_medida:id_unidad(abreviatura, nombre)")
            .eq("activo", true)
            .order("nombre", { ascending: true });

        let inventarioGastos: DashboardInsumoGasto[] = [];

        if (ingredientesDb && ingredientesDb.length > 0) {
            inventarioGastos = ingredientesDb.map((i: any) => {
                const stock = Number(i.stock || 0);
                const stockMin = Number(i.stock_minimo || 0);
                let estado: "Óptimo" | "Bajo" | "Agotado" = "Óptimo";
                if (stock <= 0) estado = "Agotado";
                else if (stock <= stockMin) estado = "Bajo";

                const unidad = i.unidad_medida?.abreviatura || "ud";
                const precioRef = Number(i.precio_referencia || 0);

                return {
                    id: `INV-${String(i.id_ingrediente).padStart(2, "0")}`,
                    nombre: i.nombre,
                    categoria: i.categoria_ingrediente?.nombre || "Insumos",
                    gastoDia: Math.round(precioRef * (stockMin > 0 ? stockMin * 0.2 : 1)),
                    gastoSemana: Math.round(precioRef * (stockMin > 0 ? stockMin * 1.5 : 5)),
                    gastoMes: Math.round(precioRef * (stockMin > 0 ? stockMin * 6 : 20)),
                    stockActual: `${stock} ${unidad}`,
                    estado,
                };
            });
        } else {
            // Insumos base mientras el usuario registra sus primeros ingredientes
            inventarioGastos = [
                { id: "INV-01", nombre: "Carne de Res", categoria: "Proteínas", gastoDia: 340000, gastoSemana: 1200000, gastoMes: 4800000, stockActual: "15 kg", estado: "Óptimo" },
                { id: "INV-02", nombre: "Pechuga de Pollo", categoria: "Proteínas", gastoDia: 0, gastoSemana: 650000, gastoMes: 2400000, stockActual: "0 kg", estado: "Agotado" },
                { id: "INV-03", nombre: "Queso Mozzarella", categoria: "Lácteos", gastoDia: 85000, gastoSemana: 320000, gastoMes: 1100000, stockActual: "8 kg", estado: "Bajo" },
                { id: "INV-04", nombre: "Tomate Chonto", categoria: "Verduras", gastoDia: 40000, gastoSemana: 180000, gastoMes: 720000, stockActual: "20 kg", estado: "Óptimo" },
                { id: "INV-05", nombre: "Papa R-12", categoria: "Tubérculos", gastoDia: 90000, gastoSemana: 420000, gastoMes: 1500000, stockActual: "45 kg", estado: "Óptimo" },
            ];
        }

        // Resumen
        const totalGeneradoCajas = cajas.reduce((acc, c) => acc + c.totalGenerado, 0);
        const totalGastosRegistrados = gastos.reduce((acc, g) => acc + g.monto, 0);
        const balanceNeto = totalGeneradoCajas - totalGastosRegistrados;
        const totalPropinas = empleados.reduce((acc, e) => acc + e.propinas, 0);
        const insumosCriticos = inventarioGastos.filter((i) => i.estado !== "Óptimo").length;
        const productoTop = productos.length > 0 ? productos[0] : null;

        return {
            filtro,
            fechaInicio: fechaInicioStr,
            fechaFin: fechaHoyStr,
            cajas,
            empleados,
            gastos,
            productos,
            inventarioGastos,
            resumen: {
                totalGeneradoCajas,
                totalGastosRegistrados,
                balanceNeto,
                totalPropinas,
                productoTop,
                insumosCriticos,
            },
        };
    }
}
