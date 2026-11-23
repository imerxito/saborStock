import { useEffect, useMemo, useState } from "react";
import { InventarioServicio } from "../../../servicios/InventarioServicio";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type UnidadMedida = {
  id_unidad: number;
  nombre: string;
  abreviatura: string;
  descripcion: string;
  activo: boolean;
};

export type CategoriaIngrediente = {
  id: number;
  nombre: string;
};

export type Insumo = {
  id: number;
  codigo?: string;
  nombre: string;
  id_unidad: number;
  id_categoria: number;
  stock: number;
  minimo: number;
  maximo: number;
  precioReferencia?: number;
  caducidad?: string;
};

export type FormInsumo = {
  codigo: string;
  nombre: string;
  id_unidad: string;
  id_categoria: string;
  stock: string;
  minimo: string;
  maximo: string;
  precioReferencia: string;
  caducidad: string;
};

export type FormUnidad = {
  nombre: string;
  abreviatura: string;
  descripcion: string;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

export const CATEGORIAS_INICIALES: CategoriaIngrediente[] = [
  { id: 1, nombre: "Carnes & Proteínas" },
  { id: 2, nombre: "Lácteos & Quesos" },
  { id: 3, nombre: "Verduras & Vegetales" },
  { id: 4, nombre: "Bebidas & Embotellados" },
  { id: 5, nombre: "Salsas & Aliños" },
  { id: 6, nombre: "Panadería & Abarrotes" },
  { id: 7, nombre: "Frutas Frescas" },
  { id: 8, nombre: "Especias & Condimentos" },
  { id: 9, nombre: "Embutidos & Fiambres" },
  { id: 10, nombre: "Postres & Dulces" },
];

export const UNIDADES_INICIALES: UnidadMedida[] = [
  { id_unidad: 1, nombre: "Kilogramo", abreviatura: "kg", descripcion: "Medida de peso en kilos", activo: true },
  { id_unidad: 2, nombre: "Gramo", abreviatura: "g", descripcion: "Medida de peso en gramos", activo: true },
  { id_unidad: 3, nombre: "Litro", abreviatura: "l", descripcion: "Medida de volumen en litros", activo: true },
  { id_unidad: 4, nombre: "Mililitro", abreviatura: "ml", descripcion: "Medida de volumen en mililitros", activo: true },
  { id_unidad: 5, nombre: "Unidades", abreviatura: "und", descripcion: "Conteo por piezas u unidades", activo: true },
];

export const FORM_VACIO: FormInsumo = {
  codigo: "",
  nombre: "",
  id_unidad: "1",
  id_categoria: "1",
  stock: "",
  minimo: "",
  maximo: "",
  precioReferencia: "",
  caducidad: "",
};

export const INICIAL: Insumo[] = [
  { id: 1, codigo: "ING-001", nombre: "Arroz", id_unidad: 1, id_categoria: 6, stock: 12, minimo: 10, maximo: 40, precioReferencia: 2500, caducidad: "2027-06-15" },
  { id: 2, codigo: "ING-002", nombre: "Aceite", id_unidad: 3, id_categoria: 5, stock: 25, minimo: 8, maximo: 40, precioReferencia: 8500, caducidad: "2027-12-01" },
  { id: 3, codigo: "ING-003", nombre: "Pollo", id_unidad: 1, id_categoria: 1, stock: 0, minimo: 5, maximo: 30, precioReferencia: 12000, caducidad: "2026-05-10" },
  { id: 4, codigo: "ING-004", nombre: "Carne Molida Premium", id_unidad: 1, id_categoria: 1, stock: 15.5, minimo: 5.0, maximo: 35.0, precioReferencia: 28000, caducidad: "2026-06-20" },
  { id: 5, codigo: "ING-005", nombre: "Pechuga de Pollo Fileteada", id_unidad: 1, id_categoria: 1, stock: 22.0, minimo: 8.0, maximo: 40.0, precioReferencia: 22000, caducidad: "2026-06-18" },
  { id: 6, codigo: "ING-006", nombre: "Pan Brioche Hamburguesa", id_unidad: 5, id_categoria: 6, stock: 48.0, minimo: 20.0, maximo: 100.0, precioReferencia: 2000, caducidad: "2026-05-25" },
  { id: 7, codigo: "ING-007", nombre: "Queso Cheddar Laminado", id_unidad: 5, id_categoria: 2, stock: 12.0, minimo: 15.0, maximo: 50.0, precioReferencia: 1200, caducidad: "2026-07-10" },
  { id: 8, codigo: "ING-008", nombre: "Tomate Orgánico", id_unidad: 1, id_categoria: 3, stock: 3.2, minimo: 4.0, maximo: 20.0, precioReferencia: 4500, caducidad: "2026-05-15" },
  { id: 9, codigo: "ING-009", nombre: "Cerveza Club Colombia 330ml", id_unidad: 5, id_categoria: 4, stock: 72.0, minimo: 24.0, maximo: 150.0, precioReferencia: 3800, caducidad: "2027-01-10" },
  { id: 10, codigo: "ING-010", nombre: "Coca-Cola 400ml Botella", id_unidad: 5, id_categoria: 4, stock: 36.0, minimo: 12.0, maximo: 80.0, precioReferencia: 2500, caducidad: "2027-03-15" },
  { id: 11, codigo: "ING-011", nombre: "Fresa Fresca Selección", id_unidad: 1, id_categoria: 7, stock: 5.0, minimo: 3.0, maximo: 15.0, precioReferencia: 9000, caducidad: "2026-05-12" },
  { id: 12, codigo: "ING-012", nombre: "Pimienta Negra Molida", id_unidad: 2, id_categoria: 8, stock: 800, minimo: 200, maximo: 2000, precioReferencia: 35000, caducidad: "2028-01-01" },
  { id: 13, codigo: "ING-013", nombre: "Jamón Ahumado de Cerdo", id_unidad: 1, id_categoria: 9, stock: 4.5, minimo: 5.0, maximo: 20.0, precioReferencia: 24000, caducidad: "2026-05-30" },
  { id: 14, codigo: "ING-014", nombre: "Helado de Vainilla Artesanal", id_unidad: 3, id_categoria: 10, stock: 8.0, minimo: 4.0, maximo: 25.0, precioReferencia: 18000, caducidad: "2026-08-15" },
];

// ─── Función auxiliar de cálculo de estado (exportada para uso en JSX) ────────

export function calcularEstadoInsumo(i: Insumo, unidades: UnidadMedida[]) {
  const unidadObj = unidades.find((u) => u.id_unidad === i.id_unidad);
  const abreviatura = unidadObj ? unidadObj.abreviatura : "ud";
  const porcentaje = i.maximo > 0 ? Math.min(100, Math.round((i.stock / i.maximo) * 100)) : 0;

  if (i.stock <= 0) {
    return {
      porcentaje,
      abreviatura,
      texto: "Agotado",
      estadoBadge: "bg-red-950/85 text-red-300 border-red-800/60",
      barraColor: "bg-red-500",
    };
  }
  if (i.stock <= i.minimo) {
    return {
      porcentaje,
      abreviatura,
      texto: "Stock bajo",
      estadoBadge: "bg-amber-950/85 text-amber-300 border-amber-800/60",
      barraColor: "bg-amber-500",
    };
  }
  return {
    porcentaje,
    abreviatura,
    texto: "Disponible",
    estadoBadge: "bg-emerald-950/85 text-emerald-300 border-emerald-800/60",
    barraColor: "bg-emerald-500",
  };
}

// ─── Hook principal ────────────────────────────────────────────────────────────

export function useInventario() {
  // — Estado de datos —
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [categorias, setCategorias] = useState<CategoriaIngrediente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  // — Filtros —
  const [busqueda, setBusqueda] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<number | "todas">("todas");

  // — Modales / formulario de insumo —
  const [mostrarForm, setMostrarForm] = useState(false);
  const [insumoEditando, setInsumoEditando] = useState<Insumo | null>(null);
  const [sembrando, setSembrando] = useState(false);
  const [mostrarModalUnidad, setMostrarModalUnidad] = useState(false);

  // — Gestión de categorías —
  const [mostrarModalCategoria, setMostrarModalCategoria] = useState(false);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [formCatNombre, setFormCatNombre] = useState("");
  const [errorCategoria, setErrorCategoria] = useState("");

  // — Formularios —
  const [form, setForm] = useState<FormInsumo>(FORM_VACIO);
  const [formUnidad, setFormUnidad] = useState<FormUnidad>({ nombre: "", abreviatura: "", descripcion: "" });

  // — Errores —
  const [error, setError] = useState("");
  const [errorUnidad, setErrorUnidad] = useState("");

  // ── Carga de datos ──────────────────────────────────────────────────────────

  const cargarDatos = async () => {
    setCargando(true);
    setErrorCarga("");
    try {
      const [insumosData, categoriasData, unidadesData] = await Promise.all([
        InventarioServicio.listarInsumos(),
        InventarioServicio.listarCategorias(),
        InventarioServicio.listarUnidades(),
      ]);

      const catsMapeadas: CategoriaIngrediente[] = (categoriasData || []).map((c: any) => ({
        id: Number(c.id ?? c.id_categoria_ingrediente),
        nombre: c.nombre,
      }));
      setCategorias(catsMapeadas.length > 0 ? catsMapeadas : CATEGORIAS_INICIALES);

      const undsMapeadas: UnidadMedida[] = (unidadesData || []).map((u: any) => ({
        id_unidad: Number(u.id ?? u.id_unidad),
        nombre: u.nombre,
        abreviatura: u.abreviatura,
        descripcion: u.descripcion ?? "",
        activo: u.activo ?? true,
      }));
      setUnidades(undsMapeadas.length > 0 ? undsMapeadas : UNIDADES_INICIALES);

      setInsumos(
        (insumosData || []).map((i) => ({
          id: i.id_ingrediente,
          codigo: i.codigo,
          nombre: i.nombre,
          id_unidad: Number(i.id_unidad),
          id_categoria: i.id_categoria_ingrediente ?? (catsMapeadas[0]?.id || 1),
          stock: Number(i.stock),
          minimo: Number(i.stock_minimo),
          maximo: Number(i.stock_maximo ?? 0),
          precioReferencia: Number(i.precio_referencia ?? 0),
          caducidad: i.caducidad ?? undefined,
        }))
      );
    } catch (e: any) {
      setErrorCarga(e?.message || "No se pudo cargar el inventario desde el backend.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, []);

  // ── Siembra de insumos iniciales ─────────────────────────────────────────────

  const sembrarInsumosIniciales = async () => {
    try {
      setSembrando(true);
      setError("");
      for (const item of INICIAL) {
        await InventarioServicio.crearInsumo({
          codigo: item.codigo,
          nombre: item.nombre,
          id_unidad: item.id_unidad,
          id_categoria_ingrediente: item.id_categoria,
          stock: item.stock,
          stock_minimo: item.minimo,
          stock_maximo: item.maximo,
          precio_referencia: item.precioReferencia,
          caducidad: item.caducidad,
        });
      }
      await cargarDatos();
    } catch (err: any) {
      setError(err?.message || "Error al cargar los insumos iniciales.");
    } finally {
      setSembrando(false);
    }
  };

  // ── Apertura de formulario de insumo ─────────────────────────────────────────

  const abrirCrearInsumo = async () => {
    setInsumoEditando(null);
    let siguienteCod = "";
    try {
      siguienteCod = await InventarioServicio.obtenerSiguienteCodigo();
    } catch {
      let max = 0;
      for (const ins of insumos) {
        const match = ins.codigo?.match(/^ING-(\d+)$/i);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > max) max = n;
        }
      }
      siguienteCod = `ING-${String(max + 1).padStart(3, "0")}`;
    }

    setForm({
      ...FORM_VACIO,
      codigo: siguienteCod,
      id_unidad: String(unidades[0]?.id_unidad || 1),
      id_categoria: String(categorias[0]?.id || 1),
      precioReferencia: "",
    });
    setError("");
    setMostrarForm(true);
  };

  const abrirEditarInsumo = (insumo: Insumo) => {
    setInsumoEditando(insumo);
    setForm({
      codigo: insumo.codigo || "",
      nombre: insumo.nombre,
      id_unidad: String(insumo.id_unidad),
      id_categoria: String(insumo.id_categoria),
      stock: String(insumo.stock),
      minimo: String(insumo.minimo),
      maximo: String(insumo.maximo),
      precioReferencia: String(insumo.precioReferencia || 0),
      caducidad: insumo.caducidad || "",
    });
    setError("");
    setMostrarForm(true);
  };

  // ── Filtrado ──────────────────────────────────────────────────────────────────

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return insumos.filter((i) => {
      const matchSearch =
        q === "" || i.nombre.toLowerCase().includes(q) || (i.codigo && i.codigo.toLowerCase().includes(q));
      const matchCat = selectedCategoria === "todas" || i.id_categoria === selectedCategoria;
      return matchSearch && matchCat;
    });
  }, [insumos, busqueda, selectedCategoria]);

  // ── Cambio de campos de formulario ───────────────────────────────────────────

  const cambiarCampo = (campo: keyof FormInsumo, valor: string) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const cambiarCampoUnidad = (campo: keyof FormUnidad, valor: string) =>
    setFormUnidad((f) => ({ ...f, [campo]: valor }));

  // ── Cerrar formulario de insumo ───────────────────────────────────────────────

  const cerrarForm = () => {
    setMostrarForm(false);
    setInsumoEditando(null);
    setForm(FORM_VACIO);
    setError("");
  };

  // ── Guardar insumo ────────────────────────────────────────────────────────────

  const guardarInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = form.nombre.trim();
    const stock = Number(form.stock);
    const minimo = Number(form.minimo);
    const maximo = Number(form.maximo);
    const id_unidad = Number(form.id_unidad);
    const id_categoria = Number(form.id_categoria);
    const precioReferencia = Number(form.precioReferencia) || 0;
    const caducidad = form.caducidad || null;

    if (!nombre) return setError("El nombre del insumo es obligatorio.");
    if ([stock, minimo, maximo].some((n) => Number.isNaN(n) || n < 0))
      return setError("Stock, mínimo y máximo deben ser números válidos (0 o mayor).");
    if (form.stock === "" || form.minimo === "" || form.maximo === "")
      return setError("Completa stock, mínimo y máximo.");
    if (maximo <= 0) return setError("El máximo debe ser mayor que 0.");
    if (minimo > maximo) return setError("El mínimo no puede ser mayor que el máximo.");
    if (!categorias.some((c) => c.id === id_categoria)) return setError("Selecciona una categoría válida.");
    if (!unidades.some((u) => u.id_unidad === id_unidad)) return setError("Selecciona una unidad válida.");

    try {
      if (insumoEditando) {
        await InventarioServicio.actualizarInsumo(insumoEditando.id, {
          codigo: form.codigo.trim() || undefined,
          nombre,
          id_unidad,
          id_categoria_ingrediente: id_categoria,
          stock,
          stock_minimo: minimo,
          stock_maximo: maximo,
          precio_referencia: precioReferencia,
          caducidad,
        });
      } else {
        await InventarioServicio.crearInsumo({
          codigo: form.codigo.trim() || undefined,
          nombre,
          id_unidad,
          id_categoria_ingrediente: id_categoria,
          stock,
          stock_minimo: minimo,
          stock_maximo: maximo,
          precio_referencia: precioReferencia,
          caducidad,
        });
      }
      await cargarDatos();
      cerrarForm();
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar el insumo en el backend.");
    }
  };

  // ── Guardar unidad ────────────────────────────────────────────────────────────

  const guardarUnidad = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = formUnidad.nombre.trim();
    const abreviatura = formUnidad.abreviatura.trim().toLowerCase();
    const descripcion = formUnidad.descripcion.trim();

    if (!nombre || !abreviatura) return setErrorUnidad("Nombre y abreviatura son obligatorios.");
    if (unidades.some((u) => u.abreviatura === abreviatura || u.nombre.toLowerCase() === nombre.toLowerCase()))
      return setErrorUnidad("Esta unidad o abreviatura ya se encuentra registrada.");

    try {
      const creada = await InventarioServicio.crearUnidad({ nombre, abreviatura, descripcion });
      const nuevoId = Number(creada.id);
      await cargarDatos();
      setForm((prev) => ({ ...prev, id_unidad: String(nuevoId) }));
      setFormUnidad({ nombre: "", abreviatura: "", descripcion: "" });
      setErrorUnidad("");
      setMostrarModalUnidad(false);
    } catch (err: any) {
      setErrorUnidad(err?.message || "No se pudo crear la unidad en el backend.");
    }
  };

  // ── Categorías ────────────────────────────────────────────────────────────────

  const handleSaveCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = formCatNombre.trim();
    if (!nombre) return setErrorCategoria("El nombre de la categoría es obligatorio.");

    const existe = categorias.some(
      (c) => c.nombre.toLowerCase() === nombre.toLowerCase() && c.id !== editingCatId
    );
    if (existe) return setErrorCategoria("Ya existe una categoría con ese nombre.");

    try {
      if (editingCatId) {
        await InventarioServicio.actualizarCategoria(editingCatId, nombre);
      } else {
        await InventarioServicio.crearCategoria(nombre);
      }
      setFormCatNombre("");
      setEditingCatId(null);
      setErrorCategoria("");
      await cargarDatos();
    } catch (err: any) {
      setErrorCategoria(err?.message || "No se pudo guardar la categoría en el backend.");
    }
  };

  const handleDeleteCategoria = async (id: number) => {
    const tieneInsumos = insumos.some((i) => i.id_categoria === id);
    if (tieneInsumos) {
      setErrorCategoria("No se puede eliminar esta categoría porque tiene insumos asignados.");
      return;
    }

    if (window.confirm("¿Deseas eliminar esta categoría?")) {
      try {
        await InventarioServicio.eliminarCategoria(id);
        if (selectedCategoria === id) setSelectedCategoria("todas");
        if (editingCatId === id) {
          setEditingCatId(null);
          setFormCatNombre("");
        }
        setErrorCategoria("");
        await cargarDatos();
      } catch (err: any) {
        setErrorCategoria(err?.message || "No se pudo eliminar la categoría.");
      }
    }
  };

  // ── Ajuste de stock ───────────────────────────────────────────────────────────

  const cambiarStock = async (id: number, valor: number) => {
    const insumo = insumos.find((i) => i.id === id);
    if (!insumo) return;
    const nuevoStock = Math.max(0, Number.isNaN(valor) ? 0 : valor);
    const diferencia = nuevoStock - insumo.stock;
    if (diferencia === 0) return;

    try {
      await InventarioServicio.registrarMovimiento({
        id_ingrediente: id,
        tipo: diferencia > 0 ? "ENTRADA" : "SALIDA",
        cantidad: Math.abs(diferencia),
        motivo: "Ajuste manual de inventario",
      });
      await cargarDatos();
    } catch (err: any) {
      setError(err?.message || "No se pudo actualizar el stock en el backend.");
    }
  };

  // ── Eliminar insumo ───────────────────────────────────────────────────────────

  const eliminar = async (id: number) => {
    if (window.confirm("¿Eliminar este insumo?")) {
      try {
        await InventarioServicio.desactivarInsumo(id);
        await cargarDatos();
      } catch (err: any) {
        alert(err?.message || "No se pudo desactivar el insumo en el backend.");
      }
    }
  };

  // ── Helpers de apertura/cierre del modal de categorías ────────────────────────

  const abrirModalCategoria = () => {
    setEditingCatId(null);
    setFormCatNombre("");
    setErrorCategoria("");
    setMostrarModalCategoria(true);
  };

  const cerrarModalCategoria = () => {
    setMostrarModalCategoria(false);
    setErrorCategoria("");
    setEditingCatId(null);
    setFormCatNombre("");
  };

  const cerrarModalUnidad = () => {
    setMostrarModalUnidad(false);
    setErrorUnidad("");
    setFormUnidad({ nombre: "", abreviatura: "", descripcion: "" });
  };

  // ── Retorno ───────────────────────────────────────────────────────────────────

  return {
    // Datos
    insumos,
    unidades,
    categorias,
    cargando,
    errorCarga,
    filtrados,

    // Filtros
    busqueda,
    setBusqueda,
    selectedCategoria,
    setSelectedCategoria,

    // Modal / form insumo
    mostrarForm,
    insumoEditando,
    sembrando,
    form,
    error,
    cambiarCampo,
    cerrarForm,
    guardarInsumo,
    abrirCrearInsumo,
    abrirEditarInsumo,
    sembrarInsumosIniciales,

    // Modal unidad
    mostrarModalUnidad,
    setMostrarModalUnidad,
    formUnidad,
    errorUnidad,
    cambiarCampoUnidad,
    guardarUnidad,
    cerrarModalUnidad,

    // Modal categoría
    mostrarModalCategoria,
    editingCatId,
    setEditingCatId,
    formCatNombre,
    setFormCatNombre,
    errorCategoria,
    handleSaveCategoria,
    handleDeleteCategoria,
    abrirModalCategoria,
    cerrarModalCategoria,

    // Acciones de stock
    cambiarStock,
    eliminar,
  };
}
