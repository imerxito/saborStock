import { useMemo, useState } from "react";

type Periodo = "Hoy" | "Semana" | "Mes";

interface Linea {
    nombre: string;
    valor: number;
}

interface DatosPeriodo {
    ventas: number;
    comandas: number;
    platos: number;
    topProductos: Linea[]; // valor = unidades vendidas
    pagos: Linea[]; // valor = dinero cobrado
    meseros: { nombre: string; comandas: number; ventas: number }[];
    serie: Linea[]; // ventas por día u hora
}

const PERIODOS: Periodo[] = ["Hoy", "Semana", "Mes"];

// Datos de ejemplo: luego vendrán de /api/reportes?periodo=...
const DATOS: Record<Periodo, DatosPeriodo> = {
    Hoy: {
        ventas: 1_284_000,
        comandas: 38,
        platos: 96,
        topProductos: [
            { nombre: "Bandeja paisa", valor: 24 },
            { nombre: "Sancocho de gallina", valor: 18 },
            { nombre: "Churrasco", valor: 15 },
            { nombre: "Jugo natural", valor: 22 },
            { nombre: "Limonada de coco", valor: 17 },
        ],
        pagos: [
            { nombre: "Efectivo", valor: 684_000 },
            { nombre: "Tarjeta", valor: 421_000 },
            { nombre: "Transferencia", valor: 179_000 },
        ],
        meseros: [
            { nombre: "Carlos", comandas: 14, ventas: 512_000 },
            { nombre: "Laura", comandas: 12, ventas: 436_000 },
            { nombre: "Andrés", comandas: 12, ventas: 336_000 },
        ],
        serie: [
            { nombre: "11 am", valor: 120_000 },
            { nombre: "12 pm", valor: 390_000 },
            { nombre: "1 pm", valor: 450_000 },
            { nombre: "2 pm", valor: 210_000 },
            { nombre: "3 pm", valor: 114_000 },
        ],
    },
    Semana: {
        ventas: 8_760_000,
        comandas: 264,
        platos: 702,
        topProductos: [
            { nombre: "Bandeja paisa", valor: 171 },
            { nombre: "Sancocho de gallina", valor: 132 },
            { nombre: "Churrasco", valor: 104 },
            { nombre: "Jugo natural", valor: 148 },
            { nombre: "Limonada de coco", valor: 121 },
        ],
        pagos: [
            { nombre: "Efectivo", valor: 4_380_000 },
            { nombre: "Tarjeta", valor: 3_011_000 },
            { nombre: "Transferencia", valor: 1_369_000 },
        ],
        meseros: [
            { nombre: "Carlos", comandas: 98, ventas: 3_320_000 },
            { nombre: "Laura", comandas: 91, ventas: 3_050_000 },
            { nombre: "Andrés", comandas: 75, ventas: 2_390_000 },
        ],
        serie: [
            { nombre: "Lun", valor: 980_000 },
            { nombre: "Mar", valor: 1_050_000 },
            { nombre: "Mié", valor: 1_120_000 },
            { nombre: "Jue", valor: 1_240_000 },
            { nombre: "Vie", valor: 1_610_000 },
            { nombre: "Sáb", valor: 1_760_000 },
            { nombre: "Dom", valor: 1_000_000 },
        ],
    },
    Mes: {
        ventas: 36_450_000,
        comandas: 1_102,
        platos: 2_930,
        topProductos: [
            { nombre: "Bandeja paisa", valor: 712 },
            { nombre: "Sancocho de gallina", valor: 548 },
            { nombre: "Churrasco", valor: 431 },
            { nombre: "Jugo natural", valor: 615 },
            { nombre: "Limonada de coco", valor: 502 },
        ],
        pagos: [
            { nombre: "Efectivo", valor: 17_800_000 },
            { nombre: "Tarjeta", valor: 12_900_000 },
            { nombre: "Transferencia", valor: 5_750_000 },
        ],
        meseros: [
            { nombre: "Carlos", comandas: 410, ventas: 13_900_000 },
            { nombre: "Laura", comandas: 372, ventas: 12_650_000 },
            { nombre: "Andrés", comandas: 320, ventas: 9_900_000 },
        ],
        serie: [
            { nombre: "Sem 1", valor: 8_200_000 },
            { nombre: "Sem 2", valor: 9_100_000 },
            { nombre: "Sem 3", valor: 9_450_000 },
            { nombre: "Sem 4", valor: 9_700_000 },
        ],
    },
};

const moneda = (n: number) =>
    n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const GRID_SECCIONES = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "1rem",
} as const;

const porcentaje = (valor: number, max: number) =>
    max > 0 ? Math.round((valor / max) * 100) : 0;

function Reportes() {
    const [periodo, setPeriodo] = useState<Periodo>("Hoy");
    const d = DATOS[periodo];

    const calculos = useMemo(() => {
        const maxProducto = Math.max(...d.topProductos.map((p) => p.valor));
        const maxSerie = Math.max(...d.serie.map((s) => s.valor));
        const totalPagos = d.pagos.reduce((acc, p) => acc + p.valor, 0);
        const ticket = d.comandas > 0 ? Math.round(d.ventas / d.comandas) : 0;
        const mejor = d.serie.reduce((a, b) => (b.valor > a.valor ? b : a));
        return {
            maxProducto,
            maxSerie,
            totalPagos,
            ticket,
            mejor,
            productos: [...d.topProductos].sort((a, b) => b.valor - a.valor),
            meseros: [...d.meseros].sort((a, b) => b.ventas - a.ventas),
        };
    }, [d]);

    function exportarCSV() {
        const filas: string[][] = [
            ["Reporte", periodo],
            [],
            ["Resumen"],
            ["Ventas", String(d.ventas)],
            ["Comandas", String(d.comandas)],
            ["Platos vendidos", String(d.platos)],
            ["Ticket promedio", String(calculos.ticket)],
            [],
            ["Producto", "Unidades"],
            ...calculos.productos.map((p) => [p.nombre, String(p.valor)]),
            [],
            ["Método de pago", "Total"],
            ...d.pagos.map((p) => [p.nombre, String(p.valor)]),
            [],
            ["Mesero", "Comandas", "Ventas"],
            ...calculos.meseros.map((m) => [m.nombre, String(m.comandas), String(m.ventas)]),
        ];
        const csv = filas.map((f) => f.map((c) => `"${c}"`).join(",")).join("\n");
        const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reporte-${periodo.toLowerCase()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <>
            <div className="barra-herramientas">
                <div className="filtros">
                    {PERIODOS.map((p) => (
                        <button
                            key={p}
                            type="button"
                            className={`btn btn--pequeno ${periodo === p ? "" : "btn--secundario"}`}
                            onClick={() => setPeriodo(p)}
                        >
                            {p}
                        </button>
                    ))}
                </div>
                <button type="button" className="btn" onClick={exportarCSV}>
                    Exportar CSV
                </button>
            </div>

            {/* Resumen */}
            <div className="grid-tarjetas seccion">
                <article className="tarjeta tarjeta--ok">
                    <h3 className="tarjeta__titulo">Ventas</h3>
                    <p className="tarjeta__valor">{moneda(d.ventas)}</p>
                    <p className="tarjeta__detalle">Total cobrado en el periodo</p>
                </article>
                <article className="tarjeta tarjeta--info">
                    <h3 className="tarjeta__titulo">Comandas</h3>
                    <p className="tarjeta__valor">{d.comandas}</p>
                    <p className="tarjeta__detalle">Pedidos atendidos</p>
                </article>
                <article className="tarjeta tarjeta--alerta">
                    <h3 className="tarjeta__titulo">Ticket promedio</h3>
                    <p className="tarjeta__valor">{moneda(calculos.ticket)}</p>
                    <p className="tarjeta__detalle">Ventas por comanda</p>
                </article>
                <article className="tarjeta">
                    <h3 className="tarjeta__titulo">Platos vendidos</h3>
                    <p className="tarjeta__valor">{d.platos}</p>
                    <p className="tarjeta__detalle">Unidades en total</p>
                </article>
            </div>

            {/* Ventas en el tiempo */}
            <div className="formulario-panel">
                <h3 className="tarjeta__titulo seccion">
                    Ventas por {periodo === "Hoy" ? "hora" : periodo === "Semana" ? "día" : "semana"}
                    {" · "}mejor momento: {calculos.mejor.nombre} ({moneda(calculos.mejor.valor)})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {d.serie.map((s) => (
                        <div
                            key={s.nombre}
                            className={`progreso ${s.nombre === calculos.mejor.nombre ? "progreso--ok" : ""}`}
                        >
                            <div className="progreso__etiqueta">
                                <span>{s.nombre}</span>
                                <span>{moneda(s.valor)}</span>
                            </div>
                            <div className="progreso__pista">
                                <div
                                    className="progreso__barra"
                                    style={{ width: `${porcentaje(s.valor, calculos.maxSerie)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={GRID_SECCIONES}>
                {/* Productos más vendidos */}
                <div className="formulario-panel">
                    <h3 className="tarjeta__titulo seccion">Productos más vendidos</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {calculos.productos.map((p, i) => (
                            <div key={p.nombre} className={`progreso ${i === 0 ? "progreso--ok" : ""}`}>
                                <div className="progreso__etiqueta">
                                    <span>
                                        {i + 1}. {p.nombre}
                                    </span>
                                    <span>{p.valor} und.</span>
                                </div>
                                <div className="progreso__pista">
                                    <div
                                        className="progreso__barra"
                                        style={{ width: `${porcentaje(p.valor, calculos.maxProducto)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Métodos de pago */}
                <div className="formulario-panel">
                    <h3 className="tarjeta__titulo seccion">Métodos de pago</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {d.pagos.map((p) => {
                            const pct = porcentaje(p.valor, calculos.totalPagos);
                            return (
                                <div key={p.nombre} className="progreso">
                                    <div className="progreso__etiqueta">
                                        <span>{p.nombre}</span>
                                        <span>
                                            {moneda(p.valor)} · {pct}%
                                        </span>
                                    </div>
                                    <div className="progreso__pista">
                                        <div className="progreso__barra" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Ventas por mesero */}
            <h3 className="tarjeta__titulo seccion" style={{ marginTop: "1.25rem" }}>
                Rendimiento por mesero
            </h3>
            <div className="tabla-contenedor">
                <table className="tabla">
                    <thead>
                        <tr>
                            <th>Mesero</th>
                            <th className="num">Comandas</th>
                            <th className="num">Ventas</th>
                            <th className="num">Ticket promedio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {calculos.meseros.length === 0 ? (
                            <tr>
                                <td className="vacio" colSpan={4}>
                                    No hay datos para este periodo.
                                </td>
                            </tr>
                        ) : (
                            calculos.meseros.map((m) => (
                                <tr key={m.nombre}>
                                    <td>{m.nombre}</td>
                                    <td className="num">{m.comandas}</td>
                                    <td className="num">{moneda(m.ventas)}</td>
                                    <td className="num">
                                        {moneda(m.comandas > 0 ? Math.round(m.ventas / m.comandas) : 0)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default Reportes;