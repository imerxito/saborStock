import { useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../../contexto/AuthContexto";
import { useComandas } from "../../contexto/ComandasContexto";
import { ComandaServicio } from "../../servicios/ComandaServicio";
import { ESTADOS, type EstadoComanda, type ItemComanda } from "../../tipos/Comanda";
import { formatoHora } from "../../utilidades/Fechas";

type Filtro = "Todas" | EstadoComanda;

const FILTROS: Filtro[] = ["Todas", ...ESTADOS];

// Clases de Dashboard.css según el estado
const CLASE_ESTADO: Partial<Record<EstadoComanda, string>> = {
    Pendiente: "estado--alerta",
    "En preparación": "estado--info",
    Lista: "estado--ok",
    Entregada: "",
};

const CLASE_TARJETA: Partial<Record<EstadoComanda, string>> = {
    Pendiente: "tarjeta--alerta",
    "En preparación": "tarjeta--info",
    Lista: "tarjeta--ok",
    Entregada: "",
};

// Primero lo que el mesero debe llevar a la mesa, al final lo ya entregado
const ORDEN: Partial<Record<EstadoComanda, number>> = {
    Lista: 0,
    "En preparación": 1,
    Pendiente: 2,
    Entregada: 3,
};

function Comandas() {
    const { usuario } = useAuth();
    const { comandas, crear, cambiarEstado, anular } = useComandas();

    // ---------- Permisos según rol ----------
    const rol = usuario?.rol;
    const esGerencia = rol === "Dueno" || rol === "Administrador";
    const esCocinero = rol === "Cocinero";
    const puedeCrear = esGerencia || rol === "Mesero" || rol === "Caja";
    const puedeGestionarCocina = esCocinero || esGerencia;

    const carta = useMemo(() => ComandaServicio.obtenerCarta(), []);
    const mesas = useMemo(() => ComandaServicio.obtenerMesas(), []);

    const [filtro, setFiltro] = useState<Filtro>(esCocinero ? "Pendiente" : "Todas");
    const [mostrarForm, setMostrarForm] = useState(false);

    // Formulario
    const [mesa, setMesa] = useState("");
    const [notaGeneral, setNotaGeneral] = useState("");
    const [plato, setPlato] = useState(carta[0]?.nombre ?? "");
    const [cantidad, setCantidad] = useState("1");
    const [notaPlato, setNotaPlato] = useState("");
    const [borrador, setBorrador] = useState<ItemComanda[]>([]);
    const [error, setError] = useState("");

    const visibles = useMemo(
        () =>
            comandas
                .filter((c) => filtro === "Todas" || c.estado === filtro)
                .sort(
                    (a, b) =>
                        (ORDEN[a.estado] ?? Number.MAX_SAFE_INTEGER) -
                            (ORDEN[b.estado] ?? Number.MAX_SAFE_INTEGER) ||
                        a.creada - b.creada
                ),
        [comandas, filtro]
    );

    const conteo = (f: Filtro) =>
        f === "Todas" ? comandas.length : comandas.filter((c) => c.estado === f).length;

    const cerrarForm = () => {
        setMostrarForm(false);
        setMesa("");
        setNotaGeneral("");
        setPlato(carta[0]?.nombre ?? "");
        setCantidad("1");
        setNotaPlato("");
        setBorrador([]);
        setError("");
    };

    const agregarPlato = () => {
        const cant = Number(cantidad);
        if (!Number.isInteger(cant) || cant < 1)
            return setError("La cantidad debe ser un número entero de 1 o más.");
        if (!plato) return setError("No hay platos disponibles en la carta.");

        const base = carta.find((p) => p.nombre === plato);
        if (!base) return setError("Elige un plato válido de la carta.");

        const nota = notaPlato.trim();
        setBorrador((prev) => {
            const i = prev.findIndex((x) => x.producto === plato && (x.nota ?? "") === nota);
            if (i >= 0) {
                return prev.map((x, k) => (k === i ? { ...x, cantidad: x.cantidad + cant } : x));
            }
            return [
                ...prev,
                { producto: plato, cantidad: cant, categoria: base.categoria, ...(nota ? { nota } : {}) },
            ];
        });
        setCantidad("1");
        setNotaPlato("");
        setError("");
    };

    const quitarPlato = (indice: number) =>
        setBorrador((prev) => prev.filter((_, k) => k !== indice));

    const guardar = (e: FormEvent) => {
        e.preventDefault();
        if (!mesa) return setError("Elige la mesa de la comanda.");
        if (borrador.length === 0) return setError("Agrega al menos un plato.");

        crear({
            mesa: Number(mesa),
            items: borrador,
            nota: notaGeneral.trim(),
            mesero: usuario?.nombre?.trim() || "Mesero",
        });
        cerrarForm();
    };

    const anularComanda = (id: number) => {
        if (window.confirm("¿Anular esta comanda?")) anular(id);
    };

    return (
        <>
            <div className="barra-herramientas">
                <div className="filtros">
                    {FILTROS.map((f) => (
                        <button
                            key={f}
                            type="button"
                            className={`btn btn--pequeno ${filtro === f ? "" : "btn--secundario"}`}
                            onClick={() => setFiltro(f)}
                        >
                            {f} ({conteo(f)})
                        </button>
                    ))}
                </div>

                {/* Solo mesero, caja y gerencia pueden crear comandas */}
                {puedeCrear && (
                    <button
                        type="button"
                        className="btn"
                        onClick={() => (mostrarForm ? cerrarForm() : setMostrarForm(true))}
                    >
                        {mostrarForm ? "Cancelar" : "Nueva comanda"}
                    </button>
                )}
            </div>

            {mostrarForm && (
                <form className="formulario-panel" onSubmit={guardar}>
                    {error && <p className="aviso">{error}</p>}

                    <div className="formulario-grid seccion">
                        <div className="campo">
                            <label htmlFor="cmd-mesa">Mesa</label>
                            <select id="cmd-mesa" value={mesa} onChange={(e) => setMesa(e.target.value)}>
                                <option value="">Selecciona una mesa</option>
                                {mesas.map((n) => (
                                    <option key={n} value={n}>
                                        Mesa {n}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="campo">
                            <label htmlFor="cmd-nota">Nota de la comanda</label>
                            <input
                                id="cmd-nota"
                                placeholder="Ej: mesa con niños"
                                value={notaGeneral}
                                onChange={(e) => setNotaGeneral(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="formulario-grid seccion">
                        <div className="campo">
                            <label htmlFor="cmd-plato">Plato</label>
                            <select id="cmd-plato" value={plato} onChange={(e) => setPlato(e.target.value)}>
                                {carta.map((p) => (
                                    <option key={p.nombre} value={p.nombre}>
                                        {p.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="campo">
                            <label htmlFor="cmd-cantidad">Cantidad</label>
                            <input
                                id="cmd-cantidad"
                                type="number"
                                min={1}
                                value={cantidad}
                                onChange={(e) => setCantidad(e.target.value)}
                            />
                        </div>
                        <div className="campo">
                            <label htmlFor="cmd-nota-plato">Nota del plato</label>
                            <input
                                id="cmd-nota-plato"
                                placeholder="Ej: sin cebolla"
                                value={notaPlato}
                                onChange={(e) => setNotaPlato(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="seccion">
                        <button type="button" className="btn btn--secundario" onClick={agregarPlato}>
                            Agregar plato
                        </button>
                    </div>

                    {borrador.length > 0 && (
                        <div className="seccion tabla-contenedor">
                            <table className="tabla">
                                <tbody>
                                    {borrador.map((it, k) => (
                                        <tr key={`${it.producto}-${it.nota ?? ""}`}>
                                            <td>
                                                {it.cantidad}× {it.producto}
                                                {it.nota ? ` · ${it.nota}` : ""}
                                            </td>
                                            <td className="num">
                                                <button
                                                    type="button"
                                                    className="btn btn--secundario btn--pequeno"
                                                    onClick={() => quitarPlato(k)}
                                                >
                                                    Quitar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="formulario-acciones">
                        <button type="button" className="btn btn--secundario" onClick={cerrarForm}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn">
                            Enviar a cocina
                        </button>
                    </div>
                </form>
            )}

            {visibles.length === 0 ? (
                <p className="texto-suave">
                    {filtro === "Todas"
                        ? "Aún no hay comandas. Crea la primera con «Nueva comanda»."
                        : `No hay comandas en estado «${filtro}».`}
                </p>
            ) : (
                <div className="grid-tarjetas">
                    {visibles.map((c) => (
                        <article key={c.id} className={`tarjeta ${CLASE_TARJETA[c.estado] ?? ""}`}>
                            <div className="tarjeta__encabezado">
                                <h3 className="tarjeta__valor">Mesa {c.mesa}</h3>
                                <span className={`estado ${CLASE_ESTADO[c.estado] ?? ""}`}>{c.estado}</span>
                            </div>

                            <p className="tarjeta__detalle">
                                #{c.id} · {formatoHora(c.creada)} · {c.mesero}
                            </p>

                            <ul className="lista-items">
                                {c.items.map((it) => (
                                    <li key={`${it.producto}-${it.nota ?? ""}`}>
                                        {it.cantidad}× {it.producto}
                                        {it.nota ? ` (${it.nota})` : ""}
                                    </li>
                                ))}
                            </ul>

                            {c.nota && <p className="texto-suave">Nota: {c.nota}</p>}

                            {c.estado !== "Entregada" && (
                                <div className="tarjeta__acciones">
                                    {/* Flujo de cocina: solo cocinero y gerencia */}
                                    {puedeGestionarCocina && c.estado === "Pendiente" && (
                                        <button
                                            type="button"
                                            className="btn btn--pequeno"
                                            onClick={() => cambiarEstado(c.id, "En preparación")}
                                        >
                                            Empezar a preparar
                                        </button>
                                    )}
                                    {puedeGestionarCocina &&
                                        (c.estado === "Pendiente" || c.estado === "En preparación") && (
                                        <button
                                            type="button"
                                            className="btn btn--pequeno"
                                            onClick={() => cambiarEstado(c.id, "Lista")}
                                        >
                                            Despachar
                                        </button>
                                    )}

                                    {/* Flujo de mesa/caja: entregar y anular */}
                                    {!esCocinero && c.estado === "Lista" && (
                                        <button
                                            type="button"
                                            className="btn btn--pequeno"
                                            onClick={() => cambiarEstado(c.id, "Entregada")}
                                        >
                                            Marcar entregada
                                        </button>
                                    )}
                                    {!esCocinero && c.estado === "Pendiente" && (
                                        <button
                                            type="button"
                                            className="btn btn--peligro btn--pequeno"
                                            onClick={() => anularComanda(c.id)}
                                        >
                                            Anular
                                        </button>
                                    )}
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </>
    );
}

export default Comandas;