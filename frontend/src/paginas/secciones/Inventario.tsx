import { useMemo, useState } from "react";

type Insumo = {
    id: number;
    nombre: string;
    unidad: string;
    stock: number;
    minimo: number;
    maximo: number;
};

type FormInsumo = {
    nombre: string;
    unidad: string;
    stock: string;
    minimo: string;
    maximo: string;
};

const UNIDADES = ["kg", "g", "l", "ml", "unidades"];

const FORM_VACIO: FormInsumo = {
    nombre: "",
    unidad: "kg",
    stock: "",
    minimo: "",
    maximo: "",
};

const INICIAL: Insumo[] = [
    { id: 1, nombre: "Arroz", unidad: "kg", stock: 12, minimo: 10, maximo: 40 },
    { id: 2, nombre: "Aceite", unidad: "l", stock: 25, minimo: 8, maximo: 40 },
    { id: 3, nombre: "Pollo", unidad: "kg", stock: 0, minimo: 5, maximo: 30 },
];

function calcular(i: Insumo) {
    const porcentaje = i.maximo > 0 ? Math.min(100, Math.round((i.stock / i.maximo) * 100)) : 0;

    if (i.stock <= 0) {
        return { porcentaje, texto: "Agotado", estado: "estado--error", progreso: "progreso--peligro" };
    }
    if (i.stock <= i.minimo) {
        return { porcentaje, texto: "Stock bajo", estado: "estado--alerta", progreso: "progreso--alerta" };
    }
    return { porcentaje, texto: "Disponible", estado: "estado--ok", progreso: "progreso--ok" };
}

function Inventario() {
    const [insumos, setInsumos] = useState<Insumo[]>(INICIAL);
    const [busqueda, setBusqueda] = useState("");
    const [mostrarForm, setMostrarForm] = useState(false);
    const [form, setForm] = useState<FormInsumo>(FORM_VACIO);
    const [error, setError] = useState("");

    const filtrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return q ? insumos.filter((i) => i.nombre.toLowerCase().includes(q)) : insumos;
    }, [insumos, busqueda]);

    const cambiarCampo = (campo: keyof FormInsumo, valor: string) =>
        setForm((f) => ({ ...f, [campo]: valor }));

    const cerrarForm = () => {
        setMostrarForm(false);
        setForm(FORM_VACIO);
        setError("");
    };

    const guardar = () => {
        const nombre = form.nombre.trim();
        const stock = Number(form.stock);
        const minimo = Number(form.minimo);
        const maximo = Number(form.maximo);

        if (!nombre) return setError("El nombre del insumo es obligatorio.");
        if (insumos.some((i) => i.nombre.toLowerCase() === nombre.toLowerCase()))
            return setError("Ya existe un insumo con ese nombre.");
        if ([stock, minimo, maximo].some((n) => Number.isNaN(n) || n < 0))
            return setError("Stock, mínimo y máximo deben ser números válidos (0 o mayor).");
        if (form.stock === "" || form.minimo === "" || form.maximo === "")
            return setError("Completa stock, mínimo y máximo.");
        if (maximo <= 0) return setError("El máximo debe ser mayor que 0.");
        if (minimo > maximo) return setError("El mínimo no puede ser mayor que el máximo.");

        setInsumos((prev) => [
            ...prev,
            {
                id: prev.length ? Math.max(...prev.map((i) => i.id)) + 1 : 1,
                nombre,
                unidad: form.unidad,
                stock,
                minimo,
                maximo,
            },
        ]);
        cerrarForm();
    };

    const cambiarStock = (id: number, valor: number) => {
        const stock = Math.max(0, Number.isNaN(valor) ? 0 : valor);
        setInsumos((prev) => prev.map((i) => (i.id === id ? { ...i, stock } : i)));
    };

    const eliminar = (id: number) => {
        if (window.confirm("¿Eliminar este insumo?")) {
            setInsumos((prev) => prev.filter((i) => i.id !== id));
        }
    };

    return (
        <>
            <div className="barra-herramientas">
                <input
                    className="buscador"
                    placeholder="Buscar insumo..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
                <button
                    className="btn"
                    onClick={() => (mostrarForm ? cerrarForm() : setMostrarForm(true))}
                >
                    {mostrarForm ? "Cancelar" : "Nuevo insumo"}
                </button>
            </div>

            {mostrarForm && (
                <div className="formulario-panel">
                    {error && <p className="aviso">{error}</p>}

                    <div className="formulario-grid">
                        <div className="campo">
                            <label htmlFor="ins-nombre">Nombre</label>
                            <input
                                id="ins-nombre"
                                value={form.nombre}
                                onChange={(e) => cambiarCampo("nombre", e.target.value)}
                            />
                        </div>
                        <div className="campo">
                            <label htmlFor="ins-unidad">Unidad</label>
                            <select
                                id="ins-unidad"
                                value={form.unidad}
                                onChange={(e) => cambiarCampo("unidad", e.target.value)}
                            >
                                {UNIDADES.map((u) => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                        <div className="campo">
                            <label htmlFor="ins-stock">Stock actual</label>
                            <input
                                id="ins-stock"
                                type="number"
                                min={0}
                                value={form.stock}
                                onChange={(e) => cambiarCampo("stock", e.target.value)}
                            />
                        </div>
                        <div className="campo">
                            <label htmlFor="ins-min">Stock mínimo</label>
                            <input
                                id="ins-min"
                                type="number"
                                min={0}
                                value={form.minimo}
                                onChange={(e) => cambiarCampo("minimo", e.target.value)}
                            />
                        </div>
                        <div className="campo">
                            <label htmlFor="ins-max">Stock máximo</label>
                            <input
                                id="ins-max"
                                type="number"
                                min={1}
                                value={form.maximo}
                                onChange={(e) => cambiarCampo("maximo", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="formulario-acciones">
                        <button className="btn btn--secundario" onClick={cerrarForm}>
                            Cancelar
                        </button>
                        <button className="btn" onClick={guardar}>
                            Guardar
                        </button>
                    </div>
                </div>
            )}

            <div className="tabla-contenedor">
                <table className="tabla">
                    <thead>
                        <tr>
                            <th>Insumo</th>
                            <th>Stock</th>
                            <th>Estado</th>
                            <th className="num">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.length === 0 ? (
                            <tr>
                                <td className="vacio" colSpan={4}>
                                    {busqueda ? "Ningún insumo coincide con la búsqueda." : "Aún no hay insumos registrados."}
                                </td>
                            </tr>
                        ) : (
                            filtrados.map((i) => {
                                const { porcentaje, texto, estado, progreso } = calcular(i);
                                return (
                                    <tr key={i.id}>
                                        <td>{i.nombre}</td>
                                        <td>
                                            <div className={`progreso ${progreso}`}>
                                                <div className="progreso__etiqueta">
                                                    <span>{i.stock} {i.unidad}</span>
                                                    <span>{porcentaje}%</span>
                                                </div>
                                                <div className="progreso__pista">
                                                    <div
                                                        className="progreso__barra"
                                                        style={{ width: `${porcentaje}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`estado ${estado}`}>{texto}</span>
                                        </td>
                                        <td>
                                            <div className="tabla__acciones">
                                                <button
                                                    className="btn btn--secundario btn--pequeno"
                                                    onClick={() => cambiarStock(i.id, i.stock - 1)}
                                                    disabled={i.stock <= 0}
                                                    aria-label={`Restar 1 a ${i.nombre}`}
                                                >
                                                    −
                                                </button>
                                                <input
                                                    className="select-mini"
                                                    type="number"
                                                    min={0}
                                                    style={{ width: 70 }}
                                                    value={i.stock}
                                                    onChange={(e) => cambiarStock(i.id, Number(e.target.value))}
                                                    aria-label={`Stock de ${i.nombre}`}
                                                />
                                                <button
                                                    className="btn btn--secundario btn--pequeno"
                                                    onClick={() => cambiarStock(i.id, i.stock + 1)}
                                                    aria-label={`Sumar 1 a ${i.nombre}`}
                                                >
                                                    +
                                                </button>
                                                <button
                                                    className="btn btn--peligro btn--pequeno"
                                                    onClick={() => eliminar(i.id)}
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default Inventario;