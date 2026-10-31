import { useMemo, useState, type FormEvent } from "react";

interface Provedor {
    id: number;
    nombre: string;
    contacto: string;
    telefono: string;
    suministra: string;
    activo: boolean;
}

// Datos de ejemplo: luego vendrán del backend (compras / proveedores)
const PROVEEDORES_INICIALES: Provedor[] = [
    { id: 1, nombre: "Carnes del Cesar", contacto: "Andrés Mejía", telefono: "300 111 2233", suministra: "Carnes y pollo", activo: true },
    { id: 2, nombre: "Frutas y Verduras del Valle", contacto: "Marta Ríos", telefono: "301 222 3344", suministra: "Frutas, verduras", activo: true },
    { id: 3, nombre: "Distribuidora La Sabana", contacto: "Luis Peña", telefono: "302 333 4455", suministra: "Abarrotes, aceites", activo: true },
    { id: 4, nombre: "Bebidas y Más", contacto: "Sofía Rangel", telefono: "304 444 5566", suministra: "Gaseosas, cerveza", activo: false },
];

const FORM_INICIAL = { nombre: "", contacto: "", telefono: "", suministra: "" };

function Proveedores() {
    const [proveedores, setProveedores] = useState<Provedor[]>(PROVEEDORES_INICIALES);
    const [busqueda, setBusqueda] = useState("");
    const [abierto, setAbierto] = useState(false);
    const [form, setForm] = useState(FORM_INICIAL);
    const [error, setError] = useState("");

    const activos = proveedores.filter((p) => p.activo).length;

    const visibles = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        return proveedores.filter(
            (p) =>
                p.nombre.toLowerCase().includes(texto) ||
                p.suministra.toLowerCase().includes(texto) ||
                p.contacto.toLowerCase().includes(texto)
        );
    }, [proveedores, busqueda]);

    function cambiar(campo: keyof typeof FORM_INICIAL, valor: string) {
        setForm((prev) => ({ ...prev, [campo]: valor }));
    }

    function guardar(e: FormEvent) {
        e.preventDefault();
        if (!form.nombre.trim() || !form.suministra.trim()) {
            setError("El nombre y lo que suministra son obligatorios.");
            return;
        }
        setProveedores((prev) => [
            ...prev,
            {
                id: Math.max(0, ...prev.map((p) => p.id)) + 1,
                nombre: form.nombre.trim(),
                contacto: form.contacto.trim(),
                telefono: form.telefono.trim(),
                suministra: form.suministra.trim(),
                activo: true,
            },
        ]);
        setForm(FORM_INICIAL);
        setError("");
        setAbierto(false);
    }

    function alternarActivo(id: number) {
        setProveedores((prev) => prev.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p)));
    }

    function eliminar(p: Provedor) {
        if (window.confirm(`¿Eliminar a "${p.nombre}"?`)) {
            setProveedores((prev) => prev.filter((x) => x.id !== p.id));
        }
    }

    return (
        <>
            <div className="grid-tarjetas seccion">
                <div className="tarjeta">
                    <p className="tarjeta__titulo">Proveedores</p>
                    <p className="tarjeta__valor">{proveedores.length}</p>
                </div>
                <div className="tarjeta tarjeta--ok">
                    <p className="tarjeta__titulo">Activos</p>
                    <p className="tarjeta__valor">{activos}</p>
                </div>
                <div className="tarjeta tarjeta--alerta">
                    <p className="tarjeta__titulo">Inactivos</p>
                    <p className="tarjeta__valor">{proveedores.length - activos}</p>
                </div>
            </div>

            <div className="barra-herramientas">
                <input
                    className="buscador"
                    placeholder="Buscar por nombre, contacto o producto..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
                <button type="button" className="btn" onClick={() => setAbierto((a) => !a)}>
                    {abierto ? "Cerrar" : "Nuevo proveedor"}
                </button>
            </div>

            {abierto && (
                <form className="formulario-panel" onSubmit={guardar}>
                    <div className="formulario-grid">
                        <div className="campo">
                            <label htmlFor="prov-nombre">Nombre</label>
                            <input
                                id="prov-nombre"
                                value={form.nombre}
                                onChange={(e) => cambiar("nombre", e.target.value)}
                            />
                        </div>
                        <div className="campo">
                            <label htmlFor="prov-contacto">Contacto</label>
                            <input
                                id="prov-contacto"
                                value={form.contacto}
                                onChange={(e) => cambiar("contacto", e.target.value)}
                            />
                        </div>
                        <div className="campo">
                            <label htmlFor="prov-telefono">Teléfono</label>
                            <input
                                id="prov-telefono"
                                type="tel"
                                value={form.telefono}
                                onChange={(e) => cambiar("telefono", e.target.value)}
                            />
                        </div>
                        <div className="campo">
                            <label htmlFor="prov-suministra">Qué suministra</label>
                            <input
                                id="prov-suministra"
                                placeholder="Ej: Carnes, lácteos"
                                value={form.suministra}
                                onChange={(e) => cambiar("suministra", e.target.value)}
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
                            Guardar proveedor
                        </button>
                    </div>
                </form>
            )}

            <div className="tabla-contenedor">
                <table className="tabla">
                    <thead>
                        <tr>
                            <th>Proveedor</th>
                            <th>Contacto</th>
                            <th>Teléfono</th>
                            <th>Suministra</th>
                            <th>Estado</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {visibles.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="vacio">
                                    No se encontraron proveedores.
                                </td>
                            </tr>
                        ) : (
                            visibles.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.nombre}</td>
                                    <td>{p.contacto || "—"}</td>
                                    <td>{p.telefono || "—"}</td>
                                    <td>{p.suministra}</td>
                                    <td>
                                        <button
                                            type="button"
                                            className={`estado ${p.activo ? "estado--ok" : ""}`}
                                            onClick={() => alternarActivo(p.id)}
                                            title="Cambiar estado"
                                        >
                                            {p.activo ? "Activo" : "Inactivo"}
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

export default Proveedores;