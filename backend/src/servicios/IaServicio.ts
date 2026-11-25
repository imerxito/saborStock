import { GoogleGenAI, Type } from "@google/genai";
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

const MODELO_POR_DEFECTO = "gemini-2.5-flash";

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

    // ─── Esquema de tablas permitidas para consultas dinámicas ───────────────────
    private readonly ESQUEMA_TABLAS = `
Tablas principales (esquema public, Supabase/PostgreSQL):

usuario(id_usuario, nombre, cedula, telefono, correo, rol[Dueno|Administrador|Cocinero|Mesero|Caja], fecha_registro, activo)
  JOIN: usuario:id_usuario(nombre, rol)

mesa(id_mesa, numero, estado[Libre|Disponible|Ocupada|Reservada|Pagando], id_seccion, id_usuario, capacidad)
seccion(id_seccion, nombre, orden, limite_mesas)

venta(id_venta, id_mesa, cliente, personas, id_usuario[=mesero asignado], estado[Abierta|Pagada|Anulada], fecha_apertura, fecha_cierre, observacion)
  JOIN: venta:id_venta(id_venta, cliente, id_usuario, usuario:id_usuario(nombre))

comanda(id_comanda, id_venta, id_usuario, estado[Pendiente|En preparación|Lista|Entregada|Cerrado], observacion, fecha_creacion, fecha_despachada)
detalle_comanda(id_detalle_comanda, id_comanda, id_producto, cantidad, nota)

factura(id_factura, id_venta, id_mesa, id_usuario[=quien cobró], cliente, fecha_emision, subtotal, descuento, propina, total_pagar, metodo_pago[efectivo|tarjeta|transferencia|mixto], monto_efectivo, monto_tarjeta, monto_transferencia, estado[Pagada|Pendiente|Anulada])
  NOTA: id_usuario en factura apunta al mesero de la venta (no al cajero)
  JOIN: usuario:id_usuario(nombre,rol), venta:id_venta(id_venta,cliente,id_usuario)

detalle_factura(id_detalle_factura, id_factura, id_producto, cantidad, precio_unitario, subtotal)
  JOIN: producto:id_producto(nombre, precio_venta), factura:id_factura(fecha_emision, estado)

producto(id_producto, codigo, nombre, id_categoria, precio_venta, descripcion, activo, tipo[cocina|directo|paquete])
  JOIN: categoria:id_categoria(nombre)

categoria(id_categoria, nombre, descripcion, activo)
ingrediente(id_ingrediente, codigo, nombre, id_unidad, id_categoria_ingrediente, stock, stock_minimo, stock_maximo, precio_referencia, caducidad, activo)
  JOIN: unidad_medida:id_unidad(nombre, abreviatura)

unidad_medida(id_unidad, nombre, abreviatura, descripcion, activo)
receta(id_producto, id_ingrediente, cantidad)
compra(id_compra, id_proveedor, fecha, estado[REGISTRADA|RECIBIDA|ANULADA], total, factura)
detalle_compra(id_compra, id_ingrediente, cantidad, precio_aplicado)
proveedor(id_proveedor, documento, nombre, contacto, telefono, correo, direccion, activo)
movimiento_inventario(id_movimiento, id_ingrediente, tipo[ENTRADA|SALIDA|AJUSTE], cantidad, fecha, motivo)
caja(id_caja, nombre, activo)
turno_caja(id_turno_caja, id_caja, id_usuario_apertura, id_usuario_cierre, fecha_apertura, fecha_cierre, monto_inicial, monto_final, estado[Abierto|Cerrado], ventas_efectivo, ventas_tarjeta, ventas_transferencia, total_generado, egresos_totales, diferencia)
historial_caja(id_historial_caja, id_turno_caja, id_usuario, id_factura, metodo_pago, tipo_pago[ingreso|egreso], monto, descripcion, fecha_movimiento)
pago_nomina(id_pago_nomina, id_usuario, id_turno_caja, monto_base, bono, monto_total, metodo_pago, fecha)
  JOIN: usuario:id_usuario(nombre, rol)

historial_mesa(id_historial_mesa, id_mesa, id_venta, id_usuario, estado, monto, motivo, fecha_accion)
configuracion_negocio(id, nombre, nit, direccion, telefono, email, moneda, logo_url)

Vistas precalculadas disponibles (usar como tabla en query_database):
v_propinas_por_mesero → columnas: id_usuario, mesero, rol, total_facturas, total_propinas, total_subtotal, total_vendido, porcentaje_propina, promedio_propina_por_factura, ultima_factura
v_rendimiento_empleados → columnas: id_usuario, nombre, rol, activo, comandas_atendidas, facturas_atendidas, total_vendido_bruto, propinas_acumuladas, porcentaje_propina, ultima_actividad
`.trim();

    // ─── Ejecutor de distribución de propinas (cálculo nativo en TypeScript) ──
    private async ejecutarDistribucionPropinas(params: {
        inicio?: string;
        fin?: string;
        pct_apoyo?: number;
    }): Promise<unknown> {
        // Resolver fechas
        const ahora = new Date();
        let desde: string;
        let hasta: string;

        if (!params.inicio || params.inicio === "HOY") {
            const hoy = new Date(ahora); hoy.setHours(0, 0, 0, 0);
            desde = hoy.toISOString();
        } else if (params.inicio === "MES") {
            const mes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
            desde = mes.toISOString();
        } else {
            desde = params.inicio;
        }

        if (!params.fin || params.fin === "HOY") {
            const hoy = new Date(ahora); hoy.setHours(23, 59, 59, 999);
            hasta = hoy.toISOString();
        } else if (params.fin === "MES") {
            hasta = ahora.toISOString();
        } else {
            hasta = params.fin.includes("T") ? params.fin : `${params.fin}T23:59:59`;
        }

        const pctApoyo = Math.max(0, Math.min(100, Number(params.pct_apoyo ?? 20)));

        // 1. Propinas del período agrupadas por usuario
        const { data: facturas, error: errF } = await supabase
            .from("factura")
            .select("propina, subtotal, id_usuario, usuario:id_usuario(nombre, rol)")
            .eq("estado", "Pagada")
            .gt("propina", 0)
            .gte("fecha_emision", desde)
            .lte("fecha_emision", hasta)
            .limit(500);
        if (errF) throw new Error(`Error al consultar facturas: ${errF.message}`);

        // 2. Todos los empleados activos
        const { data: empleados, error: errU } = await supabase
            .from("usuario")
            .select("id_usuario, nombre, rol")
            .eq("activo", true);
        if (errU) throw new Error(`Error al consultar empleados: ${errU.message}`);

        // 3. Agrupar propinas por mesero
        const mapaProps = new Map<number, { nombre: string; rol: string; total: number; facturas: number }>();
        for (const f of (facturas || [])) {
            const uid = Number(f.id_usuario);
            const u = f.usuario as any;
            const prev = mapaProps.get(uid) ?? { nombre: u?.nombre ?? `ID${uid}`, rol: u?.rol ?? "—", total: 0, facturas: 0 };
            mapaProps.set(uid, { ...prev, total: prev.total + Number(f.propina ?? 0), facturas: prev.facturas + 1 });
        }

        const totalPropinas = [...mapaProps.values()].reduce((s, v) => s + v.total, 0);
        const poolMeseros = Math.round(totalPropinas * (1 - pctApoyo / 100));
        const poolApoyo = totalPropinas - poolMeseros;

        // 4. Empleados sin propinas
        const idsConPropinas = new Set(mapaProps.keys());
        const sinPropinas = (empleados || []).filter(e => !idsConPropinas.has(Number(e.id_usuario)));
        const cantApoyo = sinPropinas.length;

        // 5. Construir resultado
        const totalGenerado = [...mapaProps.values()].reduce((s, v) => s + v.total, 0);
        const resultado: any[] = [];

        // Meseros con propinas → distribución proporcional del pool de meseros
        for (const [uid, datos] of mapaProps.entries()) {
            const peso = totalGenerado > 0 ? datos.total / totalGenerado : 0;
            const monto = Math.round(poolMeseros * peso);
            resultado.push({
                id_usuario: uid,
                empleado: datos.nombre,
                rol: datos.rol,
                facturas_con_propina: datos.facturas,
                propinas_generadas: datos.total,
                peso_porcentaje: parseFloat((peso * 100).toFixed(2)),
                monto_a_recibir: monto,
                tipo_distribucion: "proporcional",
            });
        }

        // Empleados sin propinas → distribución igualitaria del pool de apoyo
        for (const emp of sinPropinas) {
            const monto = pctApoyo > 0 && cantApoyo > 0 ? Math.round(poolApoyo / cantApoyo) : 0;
            resultado.push({
                id_usuario: Number(emp.id_usuario),
                empleado: (emp as any).nombre,
                rol: (emp as any).rol,
                facturas_con_propina: 0,
                propinas_generadas: 0,
                peso_porcentaje: pctApoyo > 0 && cantApoyo > 0 ? parseFloat((100 / cantApoyo).toFixed(2)) : 0,
                monto_a_recibir: monto,
                tipo_distribucion: pctApoyo > 0 ? "igualitario" : "sin_propinas",
            });
        }

        // Ordenar: proporcional primero, luego igualitario, dentro de cada grupo por monto desc
        resultado.sort((a, b) => {
            if (a.tipo_distribucion !== b.tipo_distribucion) {
                return a.tipo_distribucion === "proporcional" ? -1 : 1;
            }
            return b.monto_a_recibir - a.monto_a_recibir;
        });

        return {
            periodo: { desde, hasta },
            resumen: {
                total_propinas: totalPropinas,
                pct_apoyo: pctApoyo,
                pool_proporcional_meseros: poolMeseros,
                pool_igualitario_apoyo: poolApoyo,
                empleados_con_propinas: mapaProps.size,
                empleados_sin_propinas: cantApoyo,
                monto_por_apoyo: cantApoyo > 0 && pctApoyo > 0 ? Math.round(poolApoyo / cantApoyo) : 0,
            },
            distribucion: resultado,
        };
    }

    // ─── Ejecutor seguro de consultas (solo SELECT) ────────────────────────────
    private async ejecutarConsulta(params: {
        tabla: string;
        columnas?: string;
        filtros?: Record<string, string | number | boolean>;
        rango_fechas?: { columna: string; desde?: string; hasta?: string };
        order_by?: string;
        order_asc?: boolean;
        limit?: number;
    }): Promise<unknown[]> {
        const TABLAS_PERMITIDAS = new Set([
            "usuario", "mesa", "seccion", "venta", "comanda", "detalle_comanda",
            "factura", "detalle_factura", "producto", "categoria", "ingrediente",
            "unidad_medida", "receta", "compra", "detalle_compra", "proveedor",
            "movimiento_inventario", "caja", "turno_caja", "historial_caja",
            "pago_nomina", "historial_mesa", "configuracion_negocio",
            "categoria_ingrediente", "metodo_pago_config",
            // Vistas precalculadas (solo lectura)
            "v_propinas_por_mesero", "v_rendimiento_empleados",
        ]);

        const tabla = String(params.tabla || "").trim();
        if (!TABLAS_PERMITIDAS.has(tabla)) {
            throw new Error(`Tabla no permitida: ${tabla}`);
        }

        const columnas = params.columnas?.trim() || "*";
        // Bloquear columnas peligrosas (api_key, certificado, etc.)
        const colsBloqueadas = ["api_key", "clave_tecnica", "software_id", "auth_id", "password", "token"];
        for (const col of colsBloqueadas) {
            if (columnas.toLowerCase().includes(col)) {
                throw new Error(`Columna bloqueada por seguridad: ${col}`);
            }
        }

        let query = supabase.from(tabla).select(columnas);

        // Filtros de igualdad
        if (params.filtros) {
            for (const [col, val] of Object.entries(params.filtros)) {
                query = query.eq(col, val) as any;
            }
        }

        // Rango de fechas
        if (params.rango_fechas) {
            const { columna, desde, hasta } = params.rango_fechas;
            if (desde) query = query.gte(columna, desde) as any;
            if (hasta) query = query.lte(columna, hasta) as any;
        }

        // Orden
        if (params.order_by) {
            query = query.order(params.order_by, { ascending: params.order_asc ?? false }) as any;
        }

        // Límite (máximo 200 filas para seguridad)
        const limite = Math.min(Number(params.limit ?? 50), 200);
        query = query.limit(limite) as any;

        const { data, error } = await query;
        if (error) throw new Error(`Error en consulta a ${tabla}: ${error.message}`);
        return data || [];
    }

    // ─── System prompt (instrucción permanente al modelo) ─────────────────────
    private construirSystemPrompt(fechaActual: string): string {
        return `Eres **SaborStock IA**, el asistente operativo inteligente del sistema POS para restaurantes de SaborStock (Colombia).
Fecha y hora actual: ${fechaActual}

## Tu rol
Ayudas al equipo del restaurante con:
- Consultas de datos en tiempo real (propinas, ventas, stock, nómina, empleados, mesas).
- Cálculos financieros (propina por %, descuentos, comparativas entre meseros, proyecciones).
- Guía paso a paso de cualquier módulo de la aplicación.
- Análisis de desempeño del personal y del negocio.

## Módulos de SaborStock
- **Mesas**: Mapa del salón con estados (Libre/Ocupada/Pagando/Reservada). Asignar mesero, abrir/cerrar venta.
- **Comandas / Cocina**: Estados: Pendiente → En preparación → Lista → Entregada → Cerrado.
- **Caja**: Apertura y cierre de turno, historial de movimientos, egresos, ingresos en efectivo/tarjeta/transferencia.
- **Facturación**: Genera factura desde la venta. Incluye subtotal, descuento, propina y método de pago (efectivo/tarjeta/transferencia/mixto).
- **Propinas**: Registradas por factura. La propina va al mesero de la venta (campo id_usuario de la tabla venta). Cálculo: propina = subtotal × (% / 100).
- **Inventario**: Ingredientes con stock actual, mínimo y máximo. Movimientos: ENTRADA, SALIDA, AJUSTE. Alertas de stock bajo.
- **Productos**: Con categoría, precio de venta, tipo (cocina/directo/paquete) y receta de ingredientes.
- **Nómina**: Pagos de salario base + bonos a empleados, vinculados a turnos de caja.
- **Proveedores y Compras**: Registro de compras de ingredientes a proveedores con estados REGISTRADA/RECIBIDA/ANULADA.
- **Personal/Usuarios**: Roles: Dueño, Administrador, Cocinero, Mesero, Caja.
- **Reportes**: Pestaña "Empleados" muestra ventas, propinas y % propina por persona.

## Acceso a datos — REGLA CRÍTICA
Tienes la herramienta **query_database** para consultar la base de datos en tiempo real.
**ÚSALA SIEMPRE** cuando el usuario pida datos específicos del negocio. NUNCA inventes cifras.
Si necesitas datos de múltiples ángulos, haz VARIAS llamadas a query_database en la misma respuesta.

Tienes también la herramienta **calcular_distribucion_propinas** para calcular cómo repartir las propinas entre TODO el equipo (meseros proporcional + resto igualitario). Úsala SIEMPRE cuando el usuario pregunte por:
- "propinas para todo el equipo"
- "propinas incluyendo los que no generaron"
- "cómo se reparten / distribuyen las propinas"
- "cuánto le toca a cada uno"
- Cualquier variación de distribución o reparto de propinas entre empleados

### Esquema completo de la base de datos
${this.ESQUEMA_TABLAS}

### Ejemplos de consultas útiles
\`\`\`
// DISTRIBUCIÓN de propinas para todo el equipo (MES actual, 20% para apoyo):
calcular_distribucion_propinas(inicio="2026-11-01", fin="2026-11-30", pct_apoyo=20)

// DISTRIBUCIÓN de propinas hoy (todo proporcional a meseros, 0% para apoyo):
calcular_distribucion_propinas(inicio="HOY", fin="HOY", pct_apoyo=0)

// Propinas por mesero con rango de fechas:
query_database(tabla="factura", columnas="propina, subtotal, id_usuario, usuario:id_usuario(nombre,rol)", filtros={estado:"Pagada"}, rango_fechas={columna:"fecha_emision", desde:"2026-11-01T00:00:00", hasta:"2026-11-30T23:59:59"}, limit=200)

// Todos los empleados activos del equipo:
query_database(tabla="usuario", columnas="id_usuario, nombre, rol", filtros={activo:true})

// Rendimiento completo del equipo:
query_database(tabla="v_rendimiento_empleados", columnas="*", limit=20)

// Stock bajo:
query_database(tabla="ingrediente", columnas="nombre, stock, stock_minimo, stock_maximo, unidad_medida:id_unidad(abreviatura)", filtros={activo:true}, order_by="stock", order_asc=true, limit=50)

// Ventas del día:
query_database(tabla="factura", columnas="id_factura, total_pagar, subtotal, propina, descuento, metodo_pago, cliente, usuario:id_usuario(nombre)", filtros={estado:"Pagada"}, rango_fechas={columna:"fecha_emision", desde:"HOY"}, order_by="fecha_emision")

// Nómina del mes:
query_database(tabla="pago_nomina", columnas="monto_base, bono, monto_total, metodo_pago, fecha, usuario:id_usuario(nombre,rol)", order_by="fecha", limit=50)

// Turno de caja activo:
query_database(tabla="turno_caja", columnas="*", filtros={estado:"Abierto"}, limit=1)
\`\`\`

## Reglas de respuesta
1. **Tablas Markdown** cuando el usuario pida listados, comparaciones o rankings. Formato: | Col | Col |
2. **Distribución de propinas** (todo el equipo / incluso los que no generaron): usa SIEMPRE \`calcular_distribucion_propinas\`. La tabla debe tener: Empleado | Rol | Generó | Peso | Recibe | Tipo.
3. **Propinas por %**: muestra fórmula + tabla con columnas: Mesero | Subtotal | % Elegido | Propina | Total con propina.
4. **Propinas resumen por mesero**: tabla con: Mesero | Rol | Facturas | Total propinas | Promedio/factura | % sobre ventas.
5. **Dinero en COP**: formato $1.234.567 (puntos de miles, sin centavos para COP).
6. **Guía de módulos**: si el usuario pregunta cómo hacer algo, da pasos numerados claros con el nombre exacto del módulo.
7. **Sin datos inventados**: si no hay datos, dilo y sugiere qué revisar.
8. **Comparativas**: si hay múltiples personas, siempre ordena por monto desc y destaca el top 3.
9. **Cálculo de propina por porcentaje**: obtén datos de la BD y muestra tabla con el cálculo exacto.`;
    }

    // ─── Generación con Gemini + Function Calling + System Instruction ────────
    private async generarConGemini(
        pregunta: string,
        historialPrevio: Array<{ rol: "user" | "assistant"; contenido: string }>,
        contextoResumen: string,
    ): Promise<string | null> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return null;

        const ai = new GoogleGenAI({ apiKey });
        const modelos = [this.modelo, "gemini-2.5-flash-lite"];

        const herramientas: any[] = [{
            functionDeclarations: [{
                name: "query_database",
                description: "Consulta cualquier tabla o vista de la base de datos del restaurante para obtener datos reales y actualizados. Úsala siempre que necesites información específica del negocio. Puedes llamarla múltiples veces para datos de diferentes tablas.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        tabla: {
                            type: Type.STRING,
                            description: "Nombre exacto de la tabla o vista a consultar (ej: factura, usuario, ingrediente, v_propinas_por_mesero, v_rendimiento_empleados, pago_nomina, venta, detalle_factura, etc.)",
                        },
                        columnas: {
                            type: Type.STRING,
                            description: "Columnas a seleccionar separadas por coma, o '*' para todas. Incluye joins con notación Supabase, ej: 'propina, id_usuario, usuario:id_usuario(nombre,rol)' o 'cantidad, producto:id_producto(nombre, categoria:id_categoria(nombre))'",
                        },
                        filtros: {
                            type: Type.OBJECT,
                            description: "Filtros de igualdad como objeto clave-valor. Ej: {\"activo\": true, \"rol\": \"Mesero\", \"estado\": \"Pagada\"}",
                            properties: {},
                            additionalProperties: { type: Type.STRING },
                        },
                        rango_fechas: {
                            type: Type.OBJECT,
                            description: "Filtro de rango en una columna de fecha/timestamp",
                            properties: {
                                columna: { type: Type.STRING, description: "Nombre de la columna de fecha (ej: fecha_emision, fecha_apertura, fecha)" },
                                desde: { type: Type.STRING, description: "Fecha inicio ISO 8601, ej: 2026-11-01T00:00:00. Usa 'HOY' para inicio del día actual." },
                                hasta: { type: Type.STRING, description: "Fecha fin ISO 8601, ej: 2026-11-30T23:59:59. Omitir para no filtrar el límite superior." },
                            },
                        },
                        order_by: {
                            type: Type.STRING,
                            description: "Columna para ordenar los resultados (ej: propina, fecha_emision, total_pagar)",
                        },
                        order_asc: {
                            type: Type.BOOLEAN,
                            description: "true para orden ascendente (menor a mayor), false para descendente (mayor a menor, por defecto)",
                        },
                        limit: {
                            type: Type.NUMBER,
                            description: "Número máximo de filas a retornar (máximo 200, por defecto 50). Usa 200 cuando necesites todos los registros para agregaciones.",
                        },
                    },
                    required: ["tabla"],
                },
            }, {
                name: "calcular_distribucion_propinas",
                description: "Calcula cómo distribuir las propinas del período entre TODO el equipo: meseros reciben su parte proporcional a lo que generaron, el resto del equipo (cocineros, caja, etc.) recibe una parte igualitaria del pool de apoyo. ÚSALA cuando el usuario pida propinas para todo el equipo, incluyendo los que no generaron, o pregunte cómo repartir/distribuir las propinas.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        inicio: {
                            type: Type.STRING,
                            description: "Fecha inicio del período ISO 8601 (ej: 2026-11-01) o 'HOY' para hoy o 'MES' para inicio del mes actual",
                        },
                        fin: {
                            type: Type.STRING,
                            description: "Fecha fin del período ISO 8601 (ej: 2026-11-30) o 'HOY' para hoy o 'MES' para hoy",
                        },
                        pct_apoyo: {
                            type: Type.NUMBER,
                            description: "Porcentaje del pool total que va al equipo de apoyo (cocineros, caja, etc.) en partes iguales. El resto va a meseros de forma proporcional. Valor entre 0 y 100. Por defecto 20.",
                        },
                    },
                    required: [],
                },
            }],
        }];

        // Construir historial de conversación para el modelo
        const historialConversacion: any[] = [];

        // Agregar mensajes previos de la conversación (máximo últimos 8 para no saturar)
        const mensajesPrevios = historialPrevio.slice(-8);
        for (const msg of mensajesPrevios) {
            historialConversacion.push({
                role: msg.rol === "assistant" ? "model" : "user",
                parts: [{ text: msg.contenido }],
            });
        }

        // Agregar el mensaje actual del usuario con el resumen de contexto
        const mensajeActual = contextoResumen
            ? `${pregunta}\n\n---\n*Contexto rápido del negocio ahora mismo:*\n${contextoResumen}`
            : pregunta;
        historialConversacion.push({ role: "user", parts: [{ text: mensajeActual }] });

        for (const mod of modelos) {
            try {
                const historial = [...historialConversacion];
                let iteraciones = 0;
                const MAX_ITERACIONES = 6;

                while (iteraciones < MAX_ITERACIONES) {
                    iteraciones++;
                    const respuesta = await ai.models.generateContent({
                        model: mod,
                        contents: historial,
                        config: {
                            temperature: 0.15,
                            tools: herramientas,
                            systemInstruction: this.construirSystemPrompt(new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })),
                        },
                    });

                    const candidato = respuesta.candidates?.[0];
                    if (!candidato) break;

                    // ¿Hay llamadas a herramientas?
                    const llamadas = candidato.content?.parts?.filter((p: any) => p.functionCall) ?? [];
                    if (llamadas.length === 0) {
                        const textoFinal = respuesta.text?.trim();
                        if (textoFinal) return textoFinal;
                        break;
                    }

                    // Agregar la respuesta del modelo al historial
                    historial.push({ role: "model", parts: candidato.content?.parts ?? [] });

                    // Ejecutar TODAS las llamadas a herramientas en paralelo
                    const promesasConsultas = llamadas.map(async (parte: any) => {
                        const fc = parte.functionCall;
                        if (!fc) return null;
                        let resultado: unknown;
                        try {
                            // Reemplazar "HOY" con la fecha real
                            const args = fc.args as any;
                            if (args?.rango_fechas?.desde === "HOY") {
                                const hoy = new Date();
                                hoy.setHours(0, 0, 0, 0);
                                args.rango_fechas.desde = hoy.toISOString();
                            }
                            resultado = await this.ejecutarConsulta(args);
                            console.info(`[IA-DB] tabla=${args?.tabla} filas=${Array.isArray(resultado) ? resultado.length : 0}`);
                        } catch (err: any) {
                            resultado = { error: err?.message || "Error en consulta" };
                            console.warn(`[IA-DB] Error:`, err?.message);
                        }
                        return {
                            functionResponse: {
                                name: fc.name ?? "query_database",
                                response: { resultado },
                            },
                        };
                    });

                    const resultados = (await Promise.all(promesasConsultas)).filter(Boolean);
                    historial.push({ role: "user", parts: resultados });
                }
            } catch (err: any) {
                console.warn(`Modelo Gemini ${mod} falló, intentando alternativa...`, err?.message);
            }
        }
        return null;
    }

    private async contextoNegocio(): Promise<Record<string, unknown>> {
        const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const inicioHoy = hoy.toISOString();

        const [
            mesas,
            ventasAbiertas,
            facturas30d,
            facturasHoy,
            comandasAbiertas,
            stockBajo,
            propinas30d,
            propinasPorMesero,
            ventasPorCategoria,
            usuarios,
            nominaReciente,
        ] = await Promise.all([
            supabase.from("mesa").select("estado, numero, id_seccion"),
            supabase.from("venta").select("id_venta, cliente, estado, fecha_apertura, id_usuario").eq("estado", "Abierta"),
            supabase
                .from("factura")
                .select("id_factura, total_pagar, subtotal, propina, descuento, fecha_emision, metodo_pago, id_usuario, estado")
                .gte("fecha_emision", hace30Dias)
                .eq("estado", "Pagada"),
            supabase
                .from("factura")
                .select("id_factura, total_pagar, subtotal, propina, descuento, metodo_pago, id_usuario")
                .gte("fecha_emision", inicioHoy)
                .eq("estado", "Pagada"),
            supabase.from("comanda").select("id_comanda, estado, id_usuario").neq("estado", "Cerrado"),
            this.reporteRepositorio.stock(true).catch(() => []),
            // Propinas últimos 30 días
            supabase
                .from("factura")
                .select("propina, id_usuario, fecha_emision")
                .gte("fecha_emision", hace30Dias)
                .eq("estado", "Pagada")
                .gt("propina", 0),
            // Propinas agrupadas por mesero (join usuario)
            supabase
                .from("factura")
                .select("propina, id_usuario, usuario:id_usuario(nombre, rol)")
                .gte("fecha_emision", hace30Dias)
                .eq("estado", "Pagada")
                .gt("propina", 0),
            // Ventas por categoría (últimos 30 días)
            supabase
                .from("detalle_factura")
                .select("cantidad, precio_unitario, subtotal, producto:id_producto(nombre, id_categoria, categoria:id_categoria(nombre))")
                .gte("created_at", hace30Dias)
                .limit(500),
            // Usuarios activos
            supabase.from("usuario").select("id_usuario, nombre, rol, activo").eq("activo", true),
            // Nómina reciente
            supabase
                .from("pago_nomina")
                .select("id_usuario, monto_base, bono, monto_total, metodo_pago, fecha, usuario:id_usuario(nombre)")
                .gte("fecha", hace30Dias)
                .order("fecha", { ascending: false })
                .limit(20),
        ]);

        // ─── Mesas ───────────────────────────────────────────────────────────────
        const conteoMesas = (mesas.data || []).reduce<Record<string, number>>((acc, mesa: any) => {
            const estado = String(mesa.estado || "Desconocido");
            acc[estado] = (acc[estado] || 0) + 1;
            return acc;
        }, {});

        // ─── Facturación 30 días ──────────────────────────────────────────────────
        const totalFacturado30d = (facturas30d.data || []).reduce((s: number, f: any) => s + Number(f.total_pagar || 0), 0);
        const totalSubtotal30d  = (facturas30d.data || []).reduce((s: number, f: any) => s + Number(f.subtotal || 0), 0);
        const totalDescuento30d = (facturas30d.data || []).reduce((s: number, f: any) => s + Number(f.descuento || 0), 0);
        const totalPropinas30d  = (facturas30d.data || []).reduce((s: number, f: any) => s + Number(f.propina || 0), 0);

        const pagosPorMetodo30d: Record<string, number> = {};
        for (const f of (facturas30d.data || []) as any[]) {
            const m = f.metodo_pago || "efectivo";
            pagosPorMetodo30d[m] = (pagosPorMetodo30d[m] || 0) + 1;
        }

        // ─── Facturación hoy ──────────────────────────────────────────────────────
        const totalHoy      = (facturasHoy.data || []).reduce((s: number, f: any) => s + Number(f.total_pagar || 0), 0);
        const propinaHoy    = (facturasHoy.data || []).reduce((s: number, f: any) => s + Number(f.propina || 0), 0);
        const descuentoHoy  = (facturasHoy.data || []).reduce((s: number, f: any) => s + Number(f.descuento || 0), 0);

        // ─── Propinas por mesero ──────────────────────────────────────────────────
        const mapaPropinasMesero: Record<string, { nombre: string; total_propinas: number; cantidad_facturas: number; promedio: number }> = {};
        for (const f of (propinasPorMesero.data || []) as any[]) {
            const idU = String(f.id_usuario || "desconocido");
            const nombre = f.usuario?.nombre || `Usuario ${idU}`;
            if (!mapaPropinasMesero[idU]) {
                mapaPropinasMesero[idU] = { nombre, total_propinas: 0, cantidad_facturas: 0, promedio: 0 };
            }
            mapaPropinasMesero[idU].total_propinas += Number(f.propina || 0);
            mapaPropinasMesero[idU].cantidad_facturas += 1;
        }
        for (const v of Object.values(mapaPropinasMesero)) {
            v.promedio = v.cantidad_facturas > 0 ? Math.round(v.total_propinas / v.cantidad_facturas) : 0;
        }
        const propinasOrdenadas = Object.values(mapaPropinasMesero)
            .sort((a, b) => b.total_propinas - a.total_propinas)
            .slice(0, 10);

        // ─── Porcentaje de propina sobre subtotal 30d ─────────────────────────────
        const porcentajePropinaGlobal = totalSubtotal30d > 0
            ? Math.round((totalPropinas30d / totalSubtotal30d) * 100 * 100) / 100
            : 0;

        // ─── Productos/categorías más vendidos ────────────────────────────────────
        const mapaCategorias: Record<string, { nombre: string; cantidad: number; ingresos: number }> = {};
        for (const d of (ventasPorCategoria.data || []) as any[]) {
            const catNombre = d.producto?.categoria?.nombre || "Sin categoría";
            if (!mapaCategorias[catNombre]) {
                mapaCategorias[catNombre] = { nombre: catNombre, cantidad: 0, ingresos: 0 };
            }
            mapaCategorias[catNombre].cantidad += Number(d.cantidad || 0);
            mapaCategorias[catNombre].ingresos += Number(d.subtotal || 0);
        }
        const categoriasMasVendidas = Object.values(mapaCategorias)
            .sort((a, b) => b.ingresos - a.ingresos)
            .slice(0, 8);

        // ─── Usuarios por rol ─────────────────────────────────────────────────────
        const usuariosPorRol: Record<string, number> = {};
        for (const u of (usuarios.data || []) as any[]) {
            const rol = u.rol || "Sin rol";
            usuariosPorRol[rol] = (usuariosPorRol[rol] || 0) + 1;
        }
        const meseros = (usuarios.data || []).filter((u: any) => u.rol === "Mesero").map((u: any) => ({ id: u.id_usuario, nombre: u.nombre }));

        // ─── Nómina ───────────────────────────────────────────────────────────────
        const totalNomina30d = (nominaReciente.data || []).reduce((s: number, p: any) => s + Number(p.monto_total || 0), 0);
        const resumenNomina  = (nominaReciente.data || []).slice(0, 8).map((p: any) => ({
            empleado: p.usuario?.nombre || `Usuario ${p.id_usuario}`,
            monto_base: Number(p.monto_base || 0),
            bono: Number(p.bono || 0),
            total: Number(p.monto_total || 0),
            metodo: p.metodo_pago,
            fecha: p.fecha ? new Date(p.fecha).toLocaleDateString("es-CO") : "N/D",
        }));

        return {
            fecha_actual: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }),
            mesas: {
                total: mesas.data?.length ?? 0,
                por_estado: conteoMesas,
            },
            ventas_abiertas: {
                cantidad: ventasAbiertas.data?.length ?? 0,
                clientes: (ventasAbiertas.data || []).slice(0, 10).map((v: any) => v.cliente),
            },
            facturacion_hoy: {
                cantidad: facturasHoy.data?.length ?? 0,
                total: totalHoy,
                propinas: propinaHoy,
                descuentos: descuentoHoy,
            },
            facturacion_30d: {
                cantidad: facturas30d.data?.length ?? 0,
                total: totalFacturado30d,
                subtotal_sin_propina: totalSubtotal30d,
                descuentos: totalDescuento30d,
                propinas_total: totalPropinas30d,
                porcentaje_propina_sobre_subtotal: porcentajePropinaGlobal,
                pagos_por_metodo: pagosPorMetodo30d,
            },
            propinas_por_mesero_30d: propinasOrdenadas,
            comandas_abiertas: {
                total: comandasAbiertas.data?.length ?? 0,
                por_estado: (comandasAbiertas.data || []).reduce<Record<string, number>>((acc: any, c: any) => {
                    acc[c.estado] = (acc[c.estado] || 0) + 1;
                    return acc;
                }, {}),
            },
            stock_bajo: stockBajo.slice(0, 10).map((item) => ({
                ingrediente: item.nombre,
                unidad: item.unidad,
                stock: item.stock,
                minimo: item.stock_minimo,
                faltante: item.faltante,
            })),
            ventas_por_categoria_30d: categoriasMasVendidas,
            personal: {
                total_activos: usuarios.data?.length ?? 0,
                por_rol: usuariosPorRol,
                meseros,
            },
            nomina_30d: {
                total_pagado: totalNomina30d,
                pagos: resumenNomina,
            },
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

        // Guardar el mensaje del usuario
        await this.aiMensajeRepositorio.crear({
            idConversacion: conversacion.id,
            rol: "user",
            contenido: texto,
        });

        // Cargar historial previo + contexto de negocio en paralelo
        const [mensajesPrevios, contexto] = await Promise.all([
            this.aiMensajeRepositorio.listarPorConversacion(conversacion.id).then(msgs =>
                // Excluir el mensaje actual (el último) y tomar los 10 anteriores
                msgs.slice(0, -1).slice(-10).map(m => ({
                    rol: m.rol as "user" | "assistant",
                    contenido: m.contenido,
                }))
            ),
            this.contextoNegocio(),
        ]);

        // Resumen compacto del contexto para no saturar tokens
        const resumenContexto = this.construirResumenContexto(contexto);

        let respuesta: string;
        let modo: "gemini" | "local";
        if (this.tieneGemini()) {
            const generada = await this.generarConGemini(texto, mensajesPrevios, resumenContexto);
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

    // Construye un resumen compacto del negocio para enviar como contexto inicial
    // (el modelo usará query_database para datos más detallados)
    private construirResumenContexto(contexto: Record<string, any>): string {
        const f30 = contexto.facturacion_30d ?? {};
        const fHoy = contexto.facturacion_hoy ?? {};
        const mesas = contexto.mesas ?? {};
        const ventas = contexto.ventas_abiertas ?? {};
        const personal = contexto.personal ?? {};
        const stock = contexto.stock_bajo ?? [];
        const nomina = contexto.nomina_30d ?? {};
        const propMeseros: any[] = contexto.propinas_por_mesero_30d ?? [];
        const cats: any[] = contexto.ventas_por_categoria_30d ?? [];

        const lineas = [
            `📅 Fecha: ${contexto.fecha_actual}`,
            `🍽️ Mesas: ${mesas.total ?? 0} total | por estado: ${JSON.stringify(mesas.por_estado ?? {})}`,
            `🛒 Ventas abiertas ahora: ${ventas.cantidad ?? 0}`,
            `💰 Hoy: ${fHoy.cantidad ?? 0} facturas · $${Number(fHoy.total ?? 0).toLocaleString("es-CO")} · propinas $${Number(fHoy.propinas ?? 0).toLocaleString("es-CO")}`,
            `📊 Últimos 30d: ${f30.cantidad ?? 0} facturas · $${Number(f30.total ?? 0).toLocaleString("es-CO")} · propinas $${Number(f30.propinas_total ?? 0).toLocaleString("es-CO")} (${f30.porcentaje_propina_sobre_subtotal ?? 0}%)`,
            `💳 Pagos 30d: ${JSON.stringify(f30.pagos_por_metodo ?? {})}`,
            `👥 Personal activo: ${personal.total_activos ?? 0} · meseros: ${(personal.meseros ?? []).map((m: any) => m.nombre).join(", ") || "ninguno"}`,
            `🏆 Top propinas 30d: ${propMeseros.slice(0, 5).map((m: any) => `${m.nombre}=$${Number(m.total_propinas).toLocaleString("es-CO")}`).join(" | ") || "sin datos"}`,
            `📦 Stock bajo: ${stock.length} ingredientes`,
            `🗂️ Categorías más vendidas: ${cats.slice(0, 4).map((c: any) => `${c.nombre}(${c.cantidad}u)`).join(", ") || "sin datos"}`,
            `💼 Nómina 30d: $${Number(nomina.total_pagado ?? 0).toLocaleString("es-CO")} en ${nomina.pagos?.length ?? 0} pagos`,
        ];
        return lineas.join("\n");
    }

    private construirPrompt(_pregunta: string, _contexto: Record<string, unknown>): string {
        // Obsoleto: se mantiene por compatibilidad pero ya no se usa en chat()
        return "";
    }

    private respuestaLocal(mensaje: string, contexto: Record<string, any>): string {
        const texto = normalizarTexto(mensaje);
        const ventas = contexto.ventas_abiertas?.cantidad ?? 0;
        const comandas = contexto.comandas_abiertas?.total ?? contexto.comandas_abiertas ?? 0;
        const facturas30d = contexto.facturacion_30d?.cantidad ?? 0;
        const total30d = contexto.facturacion_30d?.total ?? 0;
        const stockBajo = contexto.stock_bajo ?? [];
        const propinas30d = contexto.facturacion_30d?.propinas_total ?? 0;
        const propMeseros: any[] = contexto.propinas_por_mesero_30d ?? [];
        const meseros: any[] = contexto.personal?.meseros ?? [];

        // ─── Distribucion de propinas ───────────────────────────────────────────
        if ((texto.includes("distribu") || texto.includes("repartir") || texto.includes("dividir")) && texto.includes("propina")) {
            const totalProp = Number(propinas30d);
            if (totalProp === 0 || propMeseros.length === 0) {
                return "No hay propinas acumuladas en los ultimos 30 dias para distribuir.";
            }
            const totalGenerado = propMeseros.reduce((s: number, m: any) => s + Number(m.total_propinas), 0);
            const poolMeseros = Math.round(totalProp * 0.8);
            const poolApoyo = totalProp - poolMeseros;
            const cantApoyo = Math.max(1, (contexto.personal?.total_activos ?? 1) - propMeseros.length);
            const porApoyo = Math.round(poolApoyo / cantApoyo);
            const filasMeseros = propMeseros.map((m: any) => {
                const peso = totalGenerado > 0 ? (Number(m.total_propinas) / totalGenerado) : 0;
                const monto = Math.round(poolMeseros * peso);
                return `| ${m.nombre} | $${Number(m.total_propinas).toLocaleString("es-CO")} | ${(peso * 100).toFixed(1)}% | **$${monto.toLocaleString("es-CO")}** | Proporcional |`;
            });
            return [
                `## 💰 Distribucion de propinas — ultimos 30 dias`,
                `**Pool total:** $${totalProp.toLocaleString("es-CO")} COP`,
                ``,
                `| Segmento | % del pool | Monto |`,
                `|----------|-----------|------:|`,
                `| Meseros (proporcional) | 80% | $${poolMeseros.toLocaleString("es-CO")} |`,
                `| Equipo de apoyo (igualitario) | 20% | $${poolApoyo.toLocaleString("es-CO")} |`,
                ``,
                `### Meseros — distribucion proporcional`,
                `| Mesero | Genero | Peso | Recibe | Tipo |`,
                `|--------|-------:|-----:|-------:|------|`,
                ...filasMeseros,
                ``,
                `### Equipo de apoyo — igualitario`,
                `Cada empleado de apoyo activo recibe: **$${porApoyo.toLocaleString("es-CO")} COP** (${cantApoyo} personas)`,
                ``,
                `> Usa la funcion SQL fn_distribuir_propinas(inicio, fin, pct_apoyo) para personalizar el porcentaje.`,
            ].join("\n");
        }

        // ─── Propinas ─────────────────────────────────────────────────────────────
        if (texto.includes("propina") || texto.includes("tip")) {
            if (propMeseros.length === 0) {
                return `No se registraron propinas en los ultimos 30 dias. Total: $${Number(propinas30d).toLocaleString("es-CO")}.`;
            }
            const filas = propMeseros
                .slice(0, 8)
                .map((m: any) =>
                    `| ${m.nombre} | ${m.cantidad_facturas} | $${Number(m.total_propinas).toLocaleString("es-CO")} | $${Number(m.promedio).toLocaleString("es-CO")} | ${Number(m.pct_sobre_ventas ?? 0).toFixed(1)}% |`
                )
                .join("\n");
            return [
                `## Propinas ultimos 30 dias`,
                `Total: **$${Number(propinas30d).toLocaleString("es-CO")} COP**`,
                "",
                "| Mesero | Facturas | Total propinas | Promedio/factura | % ventas |",
                "|--------|:--------:|---------------:|-----------------:|---------:|",
                filas,
                "",
                `> Formula: propina = subtotal x (% / 100). Ej: 10% sobre $50.000 = $5.000.`,
                `> Para ver distribucion del equipo, pregunta "como se distribuyen las propinas"`,
            ].join("\n");
        }

        // ─── Meseros ─────────────────────────────────────────────────────────────
        if (texto.includes("mesero") || texto.includes("personal") || texto.includes("empleado")) {
            if (meseros.length === 0) return "No hay meseros activos registrados en el sistema.";
            const lista = meseros.map((m: any) => `- **${m.nombre}**`).join("\n");
            return `## Meseros activos\n${lista}`;
        }

        // ─── Stock ─────────────────────────────────────────────────────────────────
        if (texto.includes("stock") || texto.includes("inventario") || texto.includes("faltante")) {
            if (stockBajo.length === 0) return "No hay ingredientes por debajo del stock minimo en este momento.";
            const filas = stockBajo
                .slice(0, 8)
                .map((item: any) => `| ${item.ingrediente} | ${item.stock} | ${item.minimo} | ${item.faltante} | ${item.unidad || "-"} |`)
                .join("\n");
            return [
                `## Ingredientes con stock bajo (${stockBajo.length})`,
                "| Ingrediente | Stock actual | Minimo | Faltante | Unidad |",
                "|-------------|------------:|-------:|--------:|--------|",
                filas,
                "",
                "> Revisa Inventario > Compras para registrar pedidos a proveedores.",
            ].join("\n");
        }

        // ─── Mesas ─────────────────────────────────────────────────────────────────
        if (texto.includes("mesa") || texto.includes("salon")) {
            const estados = contexto.mesas?.por_estado ?? {};
            const filas = Object.entries(estados).map(([e, c]) => `| ${e} | ${c} |`).join("\n");
            return [
                `## Estado de mesas`,
                `Total: **${contexto.mesas?.total ?? 0}** - Ventas abiertas: **${ventas}**`,
                "",
                "| Estado | Cantidad |",
                "|--------|---------:|",
                filas,
                "",
                "> Ve a Mesas en el menu lateral para ver el mapa del salon en tiempo real.",
            ].join("\n");
        }

        // ─── Ventas / Facturacion ─────────────────────────────────────────────────
        if (texto.includes("venta") || texto.includes("factura") || texto.includes("caja") || texto.includes("ingreso")) {
            const hoy = contexto.facturacion_hoy;
            const met = contexto.facturacion_30d?.pagos_por_metodo ?? {};
            const metLineas = Object.entries(met).map(([k, v]) => `| ${k} | $${Number(v).toLocaleString("es-CO")} |`).join("\n");
            return [
                `## Resumen financiero`,
                `**Hoy:** ${(hoy as any)?.cantidad ?? 0} facturas - $${Number((hoy as any)?.total ?? 0).toLocaleString("es-CO")} - Propinas: $${Number((hoy as any)?.propinas ?? 0).toLocaleString("es-CO")}`,
                `**Ultimos 30 dias:** ${facturas30d} facturas - $${Number(total30d).toLocaleString("es-CO")} - Propinas: $${Number(propinas30d).toLocaleString("es-CO")}`,
                `Ventas abiertas: **${ventas}** - Comandas: **${comandas}**`,
                metLineas ? `\n**Pagos 30d por metodo:**\n| Metodo | Total |\n|--------|------:|\n${metLineas}` : "",
            ].join("\n");
        }

        // ─── Nomina ───────────────────────────────────────────────────────────────
        if (texto.includes("nomina") || texto.includes("salario") || texto.includes("pago")) {
            const nomina = contexto.nomina_30d as any;
            return `Nomina ultimos 30 dias: **$${Number(nomina?.total_pagado ?? 0).toLocaleString("es-CO")} COP** en ${nomina?.pagos?.length ?? 0} pagos. Ve a Personal > Nomina para el detalle.`;
        }

        // ─── Categorias / Productos mas vendidos ─────────────────────────────────
        if (texto.includes("categoria") || texto.includes("popular") || texto.includes("vendido") || texto.includes("plato")) {
            const cats: any[] = contexto.ventas_por_categoria_30d ?? [];
            if (cats.length === 0) return "No hay datos de ventas por categoria en los ultimos 30 dias.";
            const filas = cats.map((c: any) => `| ${c.nombre} | ${c.cantidad} | $${Number(c.ingresos).toLocaleString("es-CO")} |`).join("\n");
            return [
                `## Ventas por categoria (30 dias)`,
                "| Categoria | Unidades | Ingresos |",
                "|-----------|---------:|---------:|",
                filas,
            ].join("\n");
        }

        // ─── Default ─────────────────────────────────────────────────────────────
        return [
            `## SaborStock IA — Estado actual`,
            `**Fecha:** ${contexto.fecha_actual}`,
            "",
            `| Metrica | Valor |`,
            `|---------|------:|`,
            `| Ventas abiertas | ${ventas} |`,
            `| Comandas activas | ${comandas} |`,
            `| Facturas hoy | ${(contexto.facturacion_hoy as any)?.cantidad ?? 0} |`,
            `| Facturas 30d | ${facturas30d} |`,
            `| Alertas de stock | ${stockBajo.length} |`,
            `| Meseros activos | ${meseros.length} |`,
            "",
            "> Preguntame sobre propinas, distribucion de propinas, meseros, ventas, stock, mesas o nomina.",
        ].join("\n");
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
                const texto = await this.generarConGemini(prompt, [], "");
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
