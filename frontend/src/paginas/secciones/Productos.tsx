import { useMemo, useState, type FormEvent } from "react";

interface Producto {
    id: number;
    nombre: string;
    categoria: string;
    precio: number;
    disponible: boolean;
}

const CATEGORIAS = ["Entradas", "Platos fuertes", "Bebidas", "Postres"];

const cop = (n: number) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(n);

// Datos de ejemplo: luego vendrán de /api/productos y /api/categorias
const PRODUCTOS_INICIALES: Producto[] = [
    { id: 1, nombre: "Arepa con queso", categoria: "Entradas", precio: 8000, disponible: true },
    { id: 2, nombre: "Patacones con hogao", categoria: "Entradas", precio: 12000, disponible: true },
    { id: 3, nombre: "Bandeja paisa", categoria: "Platos fuertes", precio: 32000, disponible: true },
    { id: 4, nombre: "Sancocho de gallina", categoria: "Platos fuertes", precio: 28000, disponible: false },
    { id: 5, nombre: "Churrasco", categoria: "Platos fuertes", precio: 35000, disponible: true },
    { id: 6, nombre: "Jugo natural", categoria: "Bebidas", precio: 7000, disponible: true },
    { id: 7, nombre: "Limonada de coco", categoria: "Bebidas", precio: 9000, disponible: true },
    { id: 8, nombre: "Tres leches", categoria: "Postres", precio: 11000, disponible: false },
];

function Productos() {
    const [productos, setProductos] = useState<Producto[]>(PRODUCTOS_INICIALES);
    const [busqueda, setBusqueda] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("Todas");

    // Formulario de nuevo producto
    const [abierto, setAbierto] = useState(false);
    const [nombre, setNombre] = useState("");
    const [categoria, setCategoria] = useState(CATEGORIAS[0]);
    const [precio, setPrecio] = useState("");
    const [error, setError] = useState("");

    const visibles = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        return productos.filter(
            (p) =>
                p.nombre.toLowerCase().includes(texto) &&
                (filtroCategoria === "Todas" || p.categoria === filtroCategoria)
        );
    }, [productos, busqueda, filtroCategoria]);

    function guardar(e: FormEvent) {
        e.preventDefault();
        const valor = Number(precio);
        if (!nombre.trim()) {
            setError("Escribe el nombre del producto.");
            return;
        }
        if (!Number.isFinite(valor) || valor <= 0) {
            setError("El precio debe ser mayor que cero.");
            return;
        }
        if (productos.some((p) => p.nombre.toLowerCase() === nombre.trim().toLowerCase())) {
            setError("Ya existe un producto con ese nombre.");
            return;
        }
        setProductos((prev) => [
            ...prev,
            {
                id: Math.max(0, ...prev.map((p) => p.id)) + 1,
                nombre: nombre.trim(),
                categoria,
                precio: valor,
                disponible: true,
            },
        ]);
        setNombre("");
        setPrecio("");
        setError("");
        setAbierto(false);
    }

    function alternarDisponible(id: number) {
        setProductos((prev) =>
            prev.map((p) => (p.id === id ? { ...p, disponible: !p.disponible } : p))
        );
    }

    function eliminar(p: Producto) {
        if (window.confirm(`¿Eliminar "${p.nombre}" de la carta?`)) {
            setProductos((prev) => prev.filter((x) => x.id !== p.id));
        }
    }

    return (
        <>
            <div className="barra-herramientas">
                <div className="filtros">
                    <input
                        className="buscador"
                        placeholder="Buscar producto..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                    <select
                        className="buscador"
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                        aria-label="Filtrar por categoría"
                    >
                        <option>Todas</option>
                        {CATEGORIAS.map((c) => (
                            <option key={c}>{c}</option>
                        ))}
                    </select>
                </div>
                <button type="button" className="btn" onClick={() => setAbierto((a) => !a)}>
                    {abierto ? "Cerrar" : "Nuevo producto"}
                </button>
            </div>

            {abierto && (
                <form className="formulario-panel" onSubmit={guardar}>
                    <div className="formulario-grid">
                        <div className="campo">
                            <label htmlFor="prod-nombre">Nombre</label>
                            <input
                                id="prod-nombre"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                            />
                        </div>
                        <div className="campo">
                            <label htmlFor="prod-categoria">Categoría</label>
                            <select
                                id="prod-categoria"
                                value={categoria}
                                onChange={(e) => setCategoria(e.target.value)}
                            >
                                {CATEGORIAS.map((c) => (
                                    <option key={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div className="campo">
                            <label htmlFor="prod-precio">Precio (COP)</label>
                            <input
                                id="prod-precio"
                                type="number"
                                min={0}
                                step={500}
                                value={precio}
                                onChange={(e) => setPrecio(e.target.value)}
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
                            Guardar producto
                        </button>
                    </div>
                </form>
            )}

            <div className="tabla-contenedor">
                <table className="tabla">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th className="num">Precio</th>
                            <th>Estado</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {visibles.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="vacio">
                                    No se encontraron productos.
                                </td>
                            </tr>
                        ) : (
                            visibles.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.nombre}</td>
                                    <td>{p.categoria}</td>
                                    <td className="num">{cop(p.precio)}</td>
                                    <td>
                                        <button
                                            type="button"
                                            className={`estado ${p.disponible ? "estado--ok" : "estado--error"}`}
                                            onClick={() => alternarDisponible(p.id)}
                                            title="Cambiar disponibilidad"
                                        >
                                            {p.disponible ? "Disponible" : "Agotado"}
                                        </button>
                                    </td>
                                    <td>
                                        <div className="tabla__acciones">
                                            <button
                                                type="button"
                                                className="btn btn--pequeno btn--peligro"
                                                onClick={() => eliminar(p)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
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

export default Productos;