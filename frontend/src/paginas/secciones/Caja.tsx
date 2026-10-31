import { useState, type FormEvent } from "react";

type Metodo = "Efectivo" | "Tarjeta" | "Transferencia";

interface Movimiento {
    id: number;
    hora: string;
    concepto: string;
    metodo: Metodo;
    monto: number;
}

const METODOS: Metodo[] = ["Efectivo", "Tarjeta", "Transferencia"];
const CLASE_METODO: Record<Metodo, string> = {
    Efectivo: "estado estado--ok",
    Tarjeta: "estado estado--info",
    Transferencia: "estado",
};

// Meta de ventas del día (luego puede venir de configuración)
const META_DIA = 1_500_000;

const cop = (n: number) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(n);

const horaActual = () =>
    new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

// Datos de ejemplo: luego vendrán de /api/turnos-caja y /api/facturas
const MOVIMIENTOS_INICIALES: Movimiento[] = [
    { id: 4, hora: "12:40", concepto: "Mesa 5 · Sancocho x3", metodo: "Tarjeta", monto: 96000 },
    { id: 3, hora: "12:15", concepto: "Mesa 2 · Bandeja paisa x2", metodo: "Efectivo", monto: 64000 },
    { id: 2, hora: "11:50", concepto: "Mesa 7 · Almuerzos x4", metodo: "Transferencia", monto: 112000 },
    { id: 1, hora: "11:20", concepto: "Mesa 1 · Jugos x2", metodo: "Efectivo", monto: 18000 },
];

function Caja() {
    const [movimientos, setMovimientos] = useState<Movimiento[]>(MOVIMIENTOS_INICIALES);
    const [turnoAbierto, setTurnoAbierto] = useState(true);

    const [concepto, setConcepto] = useState("");
    const [metodo, setMetodo] = useState<Metodo>("Efectivo");
    const [monto, setMonto] = useState("");
    const [error, setError] = useState("");

    const total = movimientos.reduce((suma, m) => suma + m.monto, 0);
    const porMetodo = (met: Metodo) =>
        movimientos.filter((m) => m.metodo === met).reduce((suma, m) => suma + m.monto, 0);

    const avance = Math.min(100, Math.round((total / META_DIA) * 100));
    const claseAvance =
        avance >= 70 ? "progreso--ok" : avance >= 40 ? "progreso--alerta" : "progreso--peligro";

    function registrar(e: FormEvent) {
        e.preventDefault();
        const valor = Number(monto);
        if (!concepto.trim()) {
            setError("Escribe el concepto del cobro.");
            return;
        }
        if (!Number.isFinite(valor) || valor <= 0) {
            setError("El monto debe ser mayor que cero.");
            return;
        }
        setMovimientos((prev) => [
            {
                id: Math.max(0, ...prev.map((m) => m.id)) + 1,
                hora: horaActual(),
                concepto: concepto.trim(),
                metodo,
                monto: valor,
            },
            ...prev,
        ]);
        setConcepto("");
        setMonto("");
        setError("");
    }

    function abrirTurnoNuevo() {
        setMovimientos([]);
        setTurnoAbierto(true);
    }

    return (
        <>
            <div className="barra-herramientas">
                <span className={`estado ${turnoAbierto ? "estado--ok" : ""}`}>
                    {turnoAbierto ? "Turno abierto" : "Turno cerrado"}
                </span>
                {turnoAbierto ? (
                    <button
                        type="button"
                        className="btn btn--secundario"
                        onClick={() => setTurnoAbierto(false)}
                    >
                        Cerrar turno
                    </button>
                ) : (
                    <button type="button" className="btn" onClick={abrirTurnoNuevo}>
                        Abrir turno nuevo
                    </button>
                )}
            </div>

            <div className="grid-tarjetas seccion">
                <div className="tarjeta tarjeta--ok">
                    <p className="tarjeta__titulo">Ventas del día</p>
                    <p className="tarjeta__valor">{cop(total)}</p>
                    <p className="tarjeta__detalle">{movimientos.length} cobros</p>
                </div>
                {METODOS.map((met) => (
                    <div key={met} className="tarjeta">
                        <p className="tarjeta__titulo">{met}</p>
                        <p className="tarjeta__valor">{cop(porMetodo(met))}</p>
                    </div>
                ))}
            </div>

            <div className={`progreso seccion ${claseAvance}`}>
                <div className="progreso__etiqueta">
                    <span>Meta del día: {cop(META_DIA)}</span>
                    <span>{avance}%</span>
                </div>
                <div className="progreso__pista">
                    <div className="progreso__barra" style={{ width: `${avance}%` }} />
                </div>
            </div>

            {turnoAbierto ? (
                <form className="formulario-panel" onSubmit={registrar}>
                    <div className="formulario-grid">
                        <div className="campo">
                            <label htmlFor="caja-concepto">Concepto</label>
                            <input
                                id="caja-concepto"
                                placeholder="Ej: Mesa 3 · Almuerzos x2"
                                value={concepto}
                                onChange={(e) => setConcepto(e.target.value)}
                            />
                        </div>
                        <div className="campo">
                            <label htmlFor="caja-metodo">Método de pago</label>
                            <select
                                id="caja-metodo"
                                value={metodo}
                                onChange={(e) => setMetodo(e.target.value as Metodo)}
                            >
                                {METODOS.map((m) => (
                                    <option key={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="campo">
                            <label htmlFor="caja-monto">Monto (COP)</label>
                            <input
                                id="caja-monto"
                                type="number"
                                min={0}
                                step={500}
                                value={monto}
                                onChange={(e) => setMonto(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="aviso" role="alert">
                            {error}
                        </p>
                    )}

                    <div className="formulario-acciones">
                        <button type="submit" className="btn">
                            Registrar cobro
                        </button>
                    </div>
                </form>
            ) : (
                <p className="aviso">
                    El turno está cerrado. Abre uno nuevo para registrar cobros (se reinicia el conteo del día).
                </p>
            )}

            <div className="tabla-contenedor">
                <table className="tabla">
                    <thead>
                        <tr>
                            <th>Hora</th>
                            <th>Concepto</th>
                            <th>Método</th>
                            <th className="num">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movimientos.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="vacio">
                                    Todavía no hay cobros en este turno.
                                </td>
                            </tr>
                        ) : (
                            movimientos.map((m) => (
                                <tr key={m.id}>
                                    <td>{m.hora}</td>
                                    <td>{m.concepto}</td>
                                    <td>
                                        <span className={CLASE_METODO[m.metodo]}>{m.metodo}</span>
                                    </td>
                                    <td className="num">{cop(m.monto)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default Caja;