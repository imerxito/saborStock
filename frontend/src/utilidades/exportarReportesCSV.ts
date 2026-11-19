/**
 * Utilidad para exportar datos consolidados de reportes a un archivo CSV estructurado
 * Compatible con Microsoft Excel (incluye BOM UTF-8 y formato numérico)
 */

interface DatosExportacionReporte {
  periodo: string;
  negocioNombre?: string;
  totales: {
    ingresos: number;
    gastos: number;
    balanceNeto: number;
    propinas: number;
  };
  cajas: {
    cajero: string;
    fecha: string;
    horaApertura: string;
    horaCierre: string;
    baseInicial: number;
    ventasEfectivo: number;
    ventasTarjeta: number;
    ventasTransferencia: number;
    totalGenerado: number;
    egresosTotales: number;
    diferencia: number;
  }[];
  productos: {
    nombre: string;
    categoria: string;
    unidadesVendidas: number;
    precioPromedio: number;
    ingresos: number;
  }[];
  gastos: {
    fecha: string;
    categoria: string;
    concepto: string;
    responsable: string;
    monto: number;
  }[];
  empleados: {
    nombre: string;
    rol: string;
    comandasAtendidas: number;
    totalVendido: number;
    propinas: number;
  }[];
  inventario: {
    nombre: string;
    categoria: string;
    stockActual: string;
    estado: string;
    gastoMes: number;
  }[];
  analisisIA?: string;
}

export function exportarReporteCSV(datos: DatosExportacionReporte) {
  const lineas: string[] = [];

  const escapeCSV = (val: string | number | null | undefined): string => {
    if (val == null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // Encabezado del restaurante
  lineas.push(`"SABOR & STOCK - INFORME AUDITORÍA OPERATIVA"`);
  lineas.push(`"Establecimiento:",${escapeCSV(datos.negocioNombre || "Sabor & Stock")}`);
  lineas.push(`"Período analizado:",${escapeCSV(datos.periodo)}`);
  lineas.push(`"Fecha de generación:",${escapeCSV(new Date().toLocaleString("es-CO"))}`);
  lineas.push("");

  // 1. Resumen Financiero
  lineas.push(`"=== 1. RESUMEN FINANCIERO Y BALANCES ==="`);
  lineas.push(`"Métrica","Monto (COP)"`);
  lineas.push(`"Ingresos Totales en Cajas",${datos.totales.ingresos}`);
  lineas.push(`"Gastos y Egresos Operativos",${datos.totales.gastos}`);
  lineas.push(`"Balance Neto del Período",${datos.totales.balanceNeto}`);
  lineas.push(`"Propinas Acumuladas",${datos.totales.propinas}`);
  lineas.push("");

  // 2. Cierres y Turnos de Caja
  lineas.push(`"=== 2. CUADRE DE TURNOS Y ARQUEOS DE CAJA ==="`);
  lineas.push(`"Cajero","Fecha","Apertura","Cierre","Base Inicial","Efectivo","Tarjeta","Transferencia","Total Generado","Egresos","Diferencia"`);
  datos.cajas.forEach(c => {
    lineas.push([
      escapeCSV(c.cajero),
      escapeCSV(c.fecha),
      escapeCSV(c.horaApertura),
      escapeCSV(c.horaCierre),
      c.baseInicial,
      c.ventasEfectivo,
      c.ventasTarjeta,
      c.ventasTransferencia,
      c.totalGenerado,
      c.egresosTotales,
      c.diferencia
    ].join(","));
  });
  lineas.push("");

  // 3. Ventas por Producto
  lineas.push(`"=== 3. PRODUCTOS Y PLATOS VENDIDOS ==="`);
  lineas.push(`"Producto / Plato","Categoría","Unidades Vendidas","Precio Promedio","Ingresos Totales"`);
  datos.productos.forEach(p => {
    lineas.push([
      escapeCSV(p.nombre),
      escapeCSV(p.categoria),
      p.unidadesVendidas,
      p.precioPromedio,
      p.ingresos
    ].join(","));
  });
  lineas.push("");

  // 4. Registro de Gastos
  lineas.push(`"=== 4. REGISTRO DE GASTOS Y EGRESOS ==="`);
  lineas.push(`"Fecha","Categoría","Concepto","Responsable","Monto"`);
  datos.gastos.forEach(g => {
    lineas.push([
      escapeCSV(g.fecha),
      escapeCSV(g.categoria),
      escapeCSV(g.concepto),
      escapeCSV(g.responsable),
      g.monto
    ].join(","));
  });
  lineas.push("");

  // 5. Rendimiento de Empleados
  lineas.push(`"=== 5. RENDIMIENTO DEL EQUIPO ==="`);
  lineas.push(`"Empleado","Rol","Comandas Atendidas","Total Vendido","Propinas"`);
  datos.empleados.forEach(e => {
    lineas.push([
      escapeCSV(e.nombre),
      escapeCSV(e.rol),
      e.comandasAtendidas,
      e.totalVendido,
      e.propinas
    ].join(","));
  });
  lineas.push("");

  // 6. Insumos e Inventario
  lineas.push(`"=== 6. ESTADO DE INVENTARIO E INSUMOS ==="`);
  lineas.push(`"Insumo","Categoría","Stock Actual","Estado","Consumo Mes"`);
  datos.inventario.forEach(i => {
    lineas.push([
      escapeCSV(i.nombre),
      escapeCSV(i.categoria),
      escapeCSV(i.stockActual),
      escapeCSV(i.estado),
      i.gastoMes
    ].join(","));
  });

  // 7. Análisis de la IA (si existe)
  if (datos.analisisIA) {
    lineas.push("");
    lineas.push(`"=== 7. ANÁLISIS ESTRATÉGICO IA (Sabor & Stock AI) ==="`);
    lineas.push(escapeCSV(datos.analisisIA));
  }

  // Descargar archivo con BOM UTF-8 (\uFEFF) para compatibilidad con Excel
  const contenidoFinal = "\uFEFF" + lineas.join("\r\n");
  const blob = new Blob([contenidoFinal], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  const fechaStr = new Date().toISOString().slice(0, 10);
  enlace.href = url;
  enlace.download = `Reporte_${datos.periodo.replace(/\s+/g, "_")}_${fechaStr}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
