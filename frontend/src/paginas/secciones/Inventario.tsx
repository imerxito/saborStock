import { useEffect, useMemo, useState, useRef } from "react";
import { InventarioServicio } from "../../servicios/InventarioServicio";

type UnidadMedida = {
  id_unidad: number;
  nombre: string;
  abreviatura: string;
  descripcion: string;
  activo: boolean;
};

type CategoriaIngrediente = {
  id: number;
  nombre: string;
};

type Insumo = {
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

type FormInsumo = {
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

type FormUnidad = {
  nombre: string;
  abreviatura: string;
  descripcion: string;
};

const CATEGORIAS_INICIALES: CategoriaIngrediente[] = [
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

const UNIDADES_INICIALES: UnidadMedida[] = [
  { id_unidad: 1, nombre: "Kilogramo", abreviatura: "kg", descripcion: "Medida de peso en kilos", activo: true },
  { id_unidad: 2, nombre: "Gramo", abreviatura: "g", descripcion: "Medida de peso en gramos", activo: true },
  { id_unidad: 3, nombre: "Litro", abreviatura: "l", descripcion: "Medida de volumen en litros", activo: true },
  { id_unidad: 4, nombre: "Mililitro", abreviatura: "ml", descripcion: "Medida de volumen en mililitros", activo: true },
  { id_unidad: 5, nombre: "Unidades", abreviatura: "und", descripcion: "Conteo por piezas u unidades", activo: true },
];

const FORM_VACIO: FormInsumo = {
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

const INICIAL: Insumo[] = [
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
  { id: 14, codigo: "ING-014", nombre: "Helado de Vainilla Artesanal", id_unidad: 3, id_categoria: 10, stock: 8.0, minimo: 4.0, maximo: 25.0, precioReferencia: 18000, caducidad: "2026-08-15" }
];

function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!ref.current) return;
    isDown.current = true;
    startX.current = e.pageX - ref.current.offsetLeft;
    scrollLeft.current = ref.current.scrollLeft;
  };

  const onMouseLeave = () => { isDown.current = false; };
  const onMouseUp = () => { isDown.current = false; };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    ref.current.scrollLeft = scrollLeft.current - walk;
  };

  return { ref, props: { onMouseDown, onMouseLeave, onMouseUp, onMouseMove } };
}

function calcular(i: Insumo, unidades: UnidadMedida[]) {
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

export default function Inventario() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [categorias, setCategorias] = useState<CategoriaIngrediente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  
  const [busqueda, setBusqueda] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<number | 'todas'>('todas');
  const categoriasScroll = useDragScroll();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [insumoEditando, setInsumoEditando] = useState<Insumo | null>(null);
  const [sembrando, setSembrando] = useState(false);
  const [mostrarModalUnidad, setMostrarModalUnidad] = useState(false);

  // Gestión completa de Categorías (Editar, Crear, Eliminar)
  const [mostrarModalCategoria, setMostrarModalCategoria] = useState(false);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [formCatNombre, setFormCatNombre] = useState("");
  const [errorCategoria, setErrorCategoria] = useState("");

  const [form, setForm] = useState<FormInsumo>(FORM_VACIO);
  const [formUnidad, setFormUnidad] = useState<FormUnidad>({ nombre: "", abreviatura: "", descripcion: "" });

  const [error, setError] = useState("");
  const [errorUnidad, setErrorUnidad] = useState("");

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

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return insumos.filter((i) => {
      const matchSearch = q === '' || i.nombre.toLowerCase().includes(q) || (i.codigo && i.codigo.toLowerCase().includes(q));
      const matchCat = selectedCategoria === 'todas' || i.id_categoria === selectedCategoria;
      return matchSearch && matchCat;
    });
  }, [insumos, busqueda, selectedCategoria]);

  const cambiarCampo = (campo: keyof FormInsumo, valor: string) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const cambiarCampoUnidad = (campo: keyof FormUnidad, valor: string) =>
    setFormUnidad((f) => ({ ...f, [campo]: valor }));

  const cerrarForm = () => {
    setMostrarForm(false);
    setInsumoEditando(null);
    setForm(FORM_VACIO);
    setError("");
  };

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

  // Manejo de Categorías: Guardar (Crear o Editar)
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

  // Manejo de Categorías: Eliminar
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

  return (
    <div className="h-[100dvh] sm:h-full w-full bg-[#0B132B] text-[#F4D6B0] font-sans antialiased flex flex-col overflow-hidden">
      {/* Header Fijo */}
      <div className="shrink-0 w-full flex flex-col z-50 bg-[#0B132B] pt-[max(0.5rem,env(safe-area-inset-top))]">
        <header className="bg-[#1C2541] border-b border-[#3A506B] px-3 sm:px-4 lg:px-6 py-2">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#3A506B]/40 border border-[#5BC0DE]/30 text-[#5BC0DE]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#F4D6B0]">Gestión de Inventario</h2>
                  <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#3A506B]/40 text-[#5BC0DE] border border-[#5BC0DE]/30 font-mono font-medium">
                    Insumos & Stock
                  </span>
                </div>
                <p className="hidden sm:block text-[11px] text-[#5BC0DE]/80">Control de existencias, precios de referencia, categorías y unidades de medida</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto">
              <button
                type="button"
                onClick={() => {
                  setEditingCatId(null);
                  setFormCatNombre("");
                  setErrorCategoria("");
                  setMostrarModalCategoria(true);
                }}
                className="flex-1 md:flex-none justify-center bg-[#0B132B] hover:bg-[#3A506B]/50 text-[#5BC0DE] hover:text-[#F4D6B0] border border-[#3A506B] px-2.5 py-2 md:py-1.5 rounded-xl text-[10px] sm:text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5 text-[#5BC0DE]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Categorías
              </button>
              <button
                type="button"
                onClick={() => setMostrarModalUnidad(true)}
                className="flex-1 md:flex-none justify-center bg-[#0B132B] hover:bg-[#3A506B]/50 text-[#5BC0DE] hover:text-[#F4D6B0] border border-[#3A506B] px-2.5 py-2 md:py-1.5 rounded-xl text-[10px] sm:text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5 text-[#5BC0DE]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Unidad
              </button>
              <button
                type="button"
                onClick={abrirCrearInsumo}
                className="w-full md:w-auto justify-center bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] px-3 py-2 md:py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Insumo
              </button>
            </div>
          </div>
        </header>

        {/* Barra de Búsqueda y Filtros */}
        <div className="bg-[#1C2541] px-3 sm:px-4 lg:px-6 py-2.5 border-b border-[#3A506B] space-y-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="relative flex-1 w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#5BC0DE]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                className="w-full bg-[#0B132B] border border-[#3A506B] rounded-xl pl-9 pr-3 py-2 text-base sm:text-xs text-[#F4D6B0] placeholder-[#5BC0DE]/50 focus:outline-none focus:border-[#5BC0DE]"
                placeholder="Buscar ingrediente por nombre o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="text-xs text-[#5BC0DE] font-medium shrink-0 self-end sm:self-auto flex items-center gap-2">
              <span>Insumos:</span>
              <span className="text-[#F4D6B0] font-bold bg-[#0B132B] px-2 py-0.5 rounded-lg border border-[#3A506B]">
                {filtrados.length}
              </span>
            </div>
          </div>

          {/* Filtro horizontal de Categorías */}
          <div className="max-w-7xl mx-auto relative group">
            <div 
              ref={categoriasScroll.ref}
              {...categoriasScroll.props}
              className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-0.5 cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:[scrollbar-width:thin] md:[&::-webkit-scrollbar]:block md:[&::-webkit-scrollbar]:h-1.5 md:[&::-webkit-scrollbar-thumb]:rounded-full md:[&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]"
            >
              <span className="text-[10px] sm:text-[11px] font-bold text-[#5BC0DE] uppercase shrink-0 flex items-center gap-1 mr-1">
                Categorías:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategoria('todas')}
                className={`px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold whitespace-nowrap transition-all border shrink-0 ${
                  selectedCategoria === 'todas'
                    ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow'
                    : 'bg-[#0B132B] text-[#5BC0DE] border-[#3A506B] hover:border-[#5BC0DE]'
                }`}
              >
                Todas ({insumos.length})
              </button>

              {categorias.map((cat) => {
                const count = insumos.filter((i) => i.id_categoria === cat.id).length;
                const isSelected = selectedCategoria === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoria(cat.id)}
                    className={`px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow'
                        : 'bg-[#0B132B] text-[#5BC0DE] border-[#3A506B] hover:border-[#5BC0DE]'
                    }`}
                  >
                    <span>{cat.nombre}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-[#1C2541] text-[#5BC0DE]' : 'bg-[#1C2541] text-[#5BC0DE]/70'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 overflow-y-auto overflow-x-hidden pb-[calc(6rem+env(safe-area-inset-bottom))] flex flex-col min-h-0">
        <section className="bg-[#1C2541] border border-[#3A506B] rounded-xl sm:rounded-2xl shadow-xl flex-1 flex flex-col min-h-0">
          
          {/* VISTA ESCRITORIO: TABLA */}
          <div className="hidden md:block overflow-auto relative flex-1 [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B]">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-30 bg-[#1C2541] shadow-md border-b-2 border-[#5BC0DE]">
                <tr className="text-[#5BC0DE] text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 bg-[#1C2541]">Ingrediente / Código</th>
                  <th className="py-3 px-4 bg-[#1C2541]">Categoría</th>
                  <th className="py-3 px-4 bg-[#1C2541]">Precio Ref.</th>
                  <th className="py-3 px-4 bg-[#1C2541]">Caducidad</th>
                  <th className="py-3 px-4 bg-[#1C2541]">Stock Actual</th>
                  <th className="py-3 px-4 bg-[#1C2541]">Estado</th>
                  <th className="py-3 px-4 text-right bg-[#1C2541]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3A506B]/50 text-sm">
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#5BC0DE]/60">
                      <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
                      </svg>
                      {busqueda || selectedCategoria !== 'todas' ? (
                        "Ningún insumo coincide con los filtros."
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <p className="text-sm text-[#F4D6B0]">Aún no hay insumos registrados en el inventario.</p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={abrirCrearInsumo}
                              className="bg-[#5BC0DE] text-[#0B132B] font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-[#5BC0DE]/90 transition"
                            >
                              + Crear Primer Insumo
                            </button>
                            <button
                              type="button"
                              onClick={() => void sembrarInsumosIniciales()}
                              disabled={sembrando}
                              className="bg-[#3A506B]/50 hover:bg-[#3A506B] text-[#F4D6B0] font-semibold px-3 py-1.5 rounded-xl text-xs transition border border-[#3A506B]"
                            >
                              {sembrando ? "Cargando insumos..." : "Cargar Insumos Sugeridos"}
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtrados.map((i) => {
                    const { porcentaje, abreviatura, texto, estadoBadge, barraColor } = calcular(i, unidades);
                    const catObj = categorias.find((c) => c.id === i.id_categoria);
                    return (
                      <tr key={i.id} className="hover:bg-[#3A506B]/20 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#F4D6B0]">{i.nombre}</div>
                          {i.codigo && <span className="text-xs text-[#5BC0DE] font-mono">{i.codigo}</span>}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#5BC0DE]">{catObj ? catObj.nombre : "General"}</td>
                        <td className="py-3 px-4 text-xs font-mono font-semibold text-emerald-400">
                          {i.precioReferencia ? `$${i.precioReferencia.toLocaleString()}` : <span className="text-[#5BC0DE]/40">--</span>}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-[#F4D6B0]">
                          {i.caducidad ? i.caducidad : <span className="text-[#5BC0DE]/50 italic">No especificada</span>}
                        </td>
                        <td className="py-3 px-4 w-60">
                          <div className="flex justify-between text-xs mb-1 font-medium">
                            <span className="text-[#F4D6B0]">{i.stock} <span className="text-[#5BC0DE] lowercase">{abreviatura}</span></span>
                            <span className="text-[#5BC0DE] font-mono">{porcentaje}%</span>
                          </div>
                          <div className="w-full bg-[#0B132B] rounded-full h-2 overflow-hidden border border-[#3A506B]">
                            <div className={`h-full transition-all duration-300 rounded-full ${barraColor}`} style={{ width: `${porcentaje}%` }} />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${estadoBadge}`}>
                            {texto}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <div className="flex items-center bg-[#0B132B] border border-[#3A506B] rounded-lg p-0.5 mr-2">
                              <button
                                type="button"
                                className="w-6 h-6 text-[#5BC0DE] hover:bg-[#3A506B] rounded flex items-center justify-center font-bold text-sm disabled:opacity-30"
                                onClick={() => cambiarStock(i.id, i.stock - 1)}
                                disabled={i.stock <= 0}
                              >−</button>
                              <span className="px-2 font-mono text-xs text-[#F4D6B0] font-semibold">{i.stock}</span>
                              <button
                                type="button"
                                className="w-6 h-6 text-[#5BC0DE] hover:bg-[#3A506B] rounded flex items-center justify-center font-bold text-sm"
                                onClick={() => cambiarStock(i.id, i.stock + 1)}
                              >+</button>
                            </div>
                            <button
                              type="button"
                              className="ml-1 bg-[#5BC0DE]/10 hover:bg-[#5BC0DE]/20 text-[#5BC0DE] p-1.5 rounded-lg transition"
                              onClick={() => abrirEditarInsumo(i)}
                              title="Editar insumo"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="ml-1 bg-[#D97706]/10 hover:bg-[#D97706]/20 text-[#D97706] p-1.5 rounded-lg transition"
                              onClick={() => eliminar(i.id)}
                              title="Eliminar insumo"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
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

          {/* VISTA MÓVIL: TARJETAS */}
          <div className="md:hidden p-2 space-y-2">
            {filtrados.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#5BC0DE]/60">
                <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
                </svg>
                {busqueda || selectedCategoria !== 'todas' ? (
                  "Ningún insumo coincide con los filtros."
                ) : (
                  <div className="flex flex-col items-center gap-2.5 px-4">
                    <p className="text-xs text-[#F4D6B0]">Aún no hay insumos registrados.</p>
                    <button
                      type="button"
                      onClick={abrirCrearInsumo}
                      className="w-full bg-[#5BC0DE] text-[#0B132B] font-bold px-3 py-2 rounded-xl text-xs hover:bg-[#5BC0DE]/90 transition"
                    >
                      + Crear Primer Insumo
                    </button>
                    <button
                      type="button"
                      onClick={() => void sembrarInsumosIniciales()}
                      disabled={sembrando}
                      className="w-full bg-[#3A506B]/50 hover:bg-[#3A506B] text-[#F4D6B0] font-semibold px-3 py-2 rounded-xl text-xs transition border border-[#3A506B]"
                    >
                      {sembrando ? "Cargando..." : "Cargar Insumos Sugeridos"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              filtrados.map((i) => {
                const { porcentaje, abreviatura, texto, estadoBadge, barraColor } = calcular(i, unidades);
                const catObj = categorias.find((c) => c.id === i.id_categoria);
                return (
                  <div key={i.id} className="bg-[#0B132B] border border-[#3A506B] rounded-xl p-3 flex flex-col gap-2">
                    {/* Cabecera Tarjeta */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <span className="block font-semibold text-sm text-[#F4D6B0] break-words leading-tight">{i.nombre}</span>
                        <span className="block text-[10px] text-[#5BC0DE] font-mono mt-0.5">{i.codigo || 'Sin código'}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-[#5BC0DE]">{catObj ? catObj.nombre : "General"}</span>
                          {i.precioReferencia ? (
                            <span className="text-[10px] font-mono font-bold text-emerald-400">
                              Ref: ${i.precioReferencia.toLocaleString()}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-bold ${estadoBadge}`}>
                        {texto}
                      </span>
                    </div>

                    {/* Caducidad y Barra */}
                    <div className="mt-1">
                      <div className="flex justify-between items-center text-[10px] mb-1">
                        <span className="text-[#5BC0DE]">Caduca: <span className="text-[#F4D6B0] font-mono">{i.caducidad || 'N/A'}</span></span>
                        <span className="text-[#F4D6B0] font-mono">{i.stock} {abreviatura} ({porcentaje}%)</span>
                      </div>
                      <div className="w-full bg-[#1C2541] rounded-full h-1.5 overflow-hidden border border-[#3A506B]">
                        <div className={`h-full transition-all duration-300 rounded-full ${barraColor}`} style={{ width: `${porcentaje}%` }} />
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center justify-between border-t border-[#3A506B] pt-2 mt-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="bg-[#1C2541] text-[#5BC0DE] border border-[#3A506B] w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base transition disabled:opacity-30 active:scale-95"
                          onClick={() => cambiarStock(i.id, i.stock - 1)}
                          disabled={i.stock <= 0}
                        >−</button>
                        <input
                          type="number"
                          min={0}
                          className="w-14 h-8 bg-[#1C2541] border border-[#3A506B] text-[#F4D6B0] text-center rounded-lg text-xs focus:outline-none focus:border-[#5BC0DE] font-mono"
                          value={i.stock}
                          onChange={(e) => cambiarStock(i.id, Number(e.target.value))}
                        />
                        <button
                          type="button"
                          className="bg-[#1C2541] text-[#5BC0DE] border border-[#3A506B] w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base transition active:scale-95"
                          onClick={() => cambiarStock(i.id, i.stock + 1)}
                        >+</button>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="bg-[#5BC0DE]/10 hover:bg-[#5BC0DE]/20 text-[#5BC0DE] p-2 rounded-lg transition"
                          onClick={() => abrirEditarInsumo(i)}
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="bg-[#D97706]/10 hover:bg-[#D97706]/20 text-[#D97706] p-2 rounded-lg transition"
                          onClick={() => eliminar(i.id)}
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </section>
      </main>

      {/* MODAL: Registrar / Editar Insumo (con Precio de Referencia) */}
      {mostrarForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pointer-events-auto">
          <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden">
            
            <div className="bg-[#0B132B] px-4 sm:px-6 py-3 border-b border-[#3A506B] flex justify-between items-center shrink-0">
              <h3 className="font-bold text-[#F4D6B0] flex items-center gap-2 text-sm sm:text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5BC0DE]"></span>
                {insumoEditando ? "Editar Insumo" : "Registrar Nuevo Insumo"}
              </h3>
              <button 
                type="button"
                onClick={cerrarForm}
                className="text-[#5BC0DE] hover:text-[#F4D6B0] transition text-sm font-bold w-8 h-8 rounded-lg flex items-center justify-center bg-[#0B132B] border border-[#3A506B]"
              >✕</button>
            </div>

            <form onSubmit={guardarInsumo} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B]">
                {error && (
                  <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs p-3 rounded-xl font-medium">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="ins-codigo" className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Código del Insumo</label>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-medium bg-[#5BC0DE]/15 text-[#5BC0DE] border border-[#5BC0DE]/30">
                        {insumoEditando ? "Identificador" : "Automático"}
                      </span>
                    </div>
                    <input
                      id="ins-codigo"
                      placeholder="Ej. ING-015"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm font-mono focus:outline-none focus:border-[#5BC0DE]"
                      value={form.codigo}
                      onChange={(e) => cambiarCampo("codigo", e.target.value.toUpperCase())}
                    />
                    <span className="text-[10px] text-[#5BC0DE]/70">
                      Código correlativo automático. Puedes personalizarlo si lo requieres.
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ins-nombre" className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Nombre del Insumo *</label>
                    <input
                      id="ins-nombre"
                      placeholder="Ej. Tomate triturado"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]"
                      value={form.nombre}
                      onChange={(e) => cambiarCampo("nombre", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ins-categoria" className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE] flex justify-between items-center">
                      <span>Categoría de Insumo</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setEditingCatId(null);
                          setFormCatNombre("");
                          setErrorCategoria("");
                          setMostrarModalCategoria(true);
                        }} 
                        className="text-[10px] text-[#5BC0DE] hover:underline"
                      >
                        + Gestionar
                      </button>
                    </label>
                    <select
                      id="ins-categoria"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]"
                      value={form.id_categoria}
                      onChange={(e) => cambiarCampo("id_categoria", e.target.value)}
                    >
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-[#0B132B] text-[#F4D6B0]">{cat.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ins-unidad" className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE] flex justify-between items-center">
                      <span>Unidad de Medida</span>
                      <button type="button" onClick={() => setMostrarModalUnidad(true)} className="text-[10px] text-[#5BC0DE] hover:underline">+ Agregar</button>
                    </label>
                    <select
                      id="ins-unidad"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]"
                      value={form.id_unidad}
                      onChange={(e) => cambiarCampo("id_unidad", e.target.value)}
                    >
                      {unidades.map((u) => (
                        <option key={u.id_unidad} value={u.id_unidad} className="bg-[#0B132B] text-[#F4D6B0]">{u.nombre} ({u.abreviatura})</option>
                      ))}
                    </select>
                  </div>

                  {/* PRECIO DE REFERENCIA */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ins-precio" className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">
                      Precio / Costo de Referencia ($) *
                    </label>
                    <input
                      id="ins-precio"
                      type="number"
                      min={0}
                      placeholder="Ej. 12000"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono text-emerald-400 font-semibold"
                      value={form.precioReferencia}
                      onChange={(e) => cambiarCampo("precioReferencia", e.target.value)}
                    />
                    <span className="text-[10px] text-[#5BC0DE]/70">
                      Costo estimado por unidad para costeo y recetas.
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ins-caducidad" className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Fecha de Caducidad</label>
                    <input
                      id="ins-caducidad"
                      type="date"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono"
                      value={form.caducidad}
                      onChange={(e) => cambiarCampo("caducidad", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ins-stock" className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Stock Actual *</label>
                    <input
                      id="ins-stock"
                      type="number"
                      min={0}
                      placeholder="0"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono"
                      value={form.stock}
                      onChange={(e) => cambiarCampo("stock", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ins-min" className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Stock Mínimo *</label>
                    <input
                      id="ins-min"
                      type="number"
                      min={0}
                      placeholder="5"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono"
                      value={form.minimo}
                      onChange={(e) => cambiarCampo("minimo", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor="ins-max" className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Stock Máximo *</label>
                    <input
                      id="ins-max"
                      type="number"
                      min={1}
                      placeholder="50"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono"
                      value={form.maximo}
                      onChange={(e) => cambiarCampo("maximo", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="shrink-0 px-4 sm:px-6 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#1C2541] border-t border-[#3A506B] flex justify-end gap-3 z-10">
                <button
                  type="button"
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#0B132B] text-[#5BC0DE] hover:text-[#F4D6B0] text-xs font-medium border border-[#3A506B]"
                  onClick={cerrarForm}
                >Cancelar</button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] font-semibold text-xs shadow-lg transition-colors"
                >{insumoEditando ? "Guardar Cambios" : "Guardar Insumo"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Gestionar Categorías de Insumos (Crear, Editar, Eliminar - Idéntico a Productos) */}
      {mostrarModalCategoria && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pointer-events-auto">
          <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85dvh]">
            <div className="bg-[#0B132B] px-4 sm:px-6 py-3 border-b border-[#3A506B] flex justify-between items-center shrink-0">
              <h3 className="font-bold text-[#F4D6B0] flex items-center gap-2 text-sm sm:text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5BC0DE]"></span>
                Gestionar Categorías de Insumos
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setMostrarModalCategoria(false);
                  setErrorCategoria("");
                  setEditingCatId(null);
                  setFormCatNombre("");
                }}
                className="text-[#5BC0DE] hover:text-[#F4D6B0] transition text-sm font-bold w-8 h-8 rounded-lg flex items-center justify-center bg-[#0B132B] border border-[#3A506B]"
              >✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B]">
              {errorCategoria && (
                <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs p-3 rounded-xl font-medium">
                  {errorCategoria}
                </div>
              )}

              {/* Formulario de Crear / Editar Categoría */}
              <form onSubmit={handleSaveCategoria} className="bg-[#0B132B] p-3 sm:p-4 rounded-xl border border-[#3A506B] space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] sm:text-xs font-semibold uppercase text-[#5BC0DE]">
                    {editingCatId ? "Editar Categoría" : "Nueva Categoría"}
                  </h4>
                  {editingCatId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCatId(null);
                        setFormCatNombre("");
                        setErrorCategoria("");
                      }}
                      className="text-[10px] text-[#5BC0DE] hover:underline"
                    >
                      Cancelar edición
                    </button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nombre de la categoría..."
                    className="flex-1 min-w-0 bg-[#1C2541] border border-[#3A506B] rounded-lg px-3 py-2.5 text-base sm:text-sm text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE]"
                    value={formCatNombre}
                    onChange={(e) => setFormCatNombre(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] text-xs font-semibold rounded-lg transition-all shadow shrink-0"
                  >
                    {editingCatId ? "Actualizar" : "Guardar"}
                  </button>
                </div>
              </form>

              {/* Lista de Categorías Existentes */}
              <div className="space-y-2">
                <h4 className="text-[10px] sm:text-xs font-semibold uppercase text-[#5BC0DE]">
                  Categorías Registradas ({categorias.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B]">
                  {categorias.map((cat) => {
                    const cantInsumos = insumos.filter((i) => i.id_categoria === cat.id).length;
                    const isEditing = editingCatId === cat.id;

                    return (
                      <div
                        key={cat.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                          isEditing
                            ? "bg-[#3A506B]/30 border-[#5BC0DE]"
                            : "bg-[#0B132B] border-[#3A506B]"
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-[#F4D6B0] block truncate">
                            {cat.nombre}
                          </span>
                          <span className="text-[10px] text-[#5BC0DE]">
                            {cantInsumos} insumo{cantInsumos === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCatId(cat.id);
                              setFormCatNombre(cat.nombre);
                              setErrorCategoria("");
                            }}
                            className="flex items-center justify-center w-8 h-8 bg-[#1C2541] text-[#5BC0DE] hover:text-[#F4D6B0] border border-[#3A506B] rounded-lg transition"
                            title="Editar nombre"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategoria(cat.id)}
                            className="flex items-center justify-center w-8 h-8 bg-[#D97706]/10 text-[#D97706] hover:bg-[#D97706]/20 border border-[#D97706]/30 rounded-lg transition"
                            title="Eliminar categoría"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="shrink-0 px-4 sm:px-6 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#1C2541] border-t border-[#3A506B] flex justify-end">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl bg-[#0B132B] text-[#5BC0DE] hover:text-[#F4D6B0] text-xs font-medium border border-[#3A506B]"
                onClick={() => {
                  setMostrarModalCategoria(false);
                  setErrorCategoria("");
                  setEditingCatId(null);
                  setFormCatNombre("");
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Unidad */}
      {mostrarModalUnidad && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pointer-events-auto">
          <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85dvh]">
            <div className="bg-[#0B132B] px-4 sm:px-6 py-3 border-b border-[#3A506B] flex justify-between items-center shrink-0">
              <h3 className="font-bold text-[#F4D6B0] flex items-center gap-2 text-sm sm:text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5BC0DE]"></span>
                Nueva Unidad de Medida
              </h3>
              <button 
                type="button"
                onClick={() => { setMostrarModalUnidad(false); setErrorUnidad(""); setFormUnidad({ nombre: "", abreviatura: "", descripcion: "" }); }}
                className="text-[#5BC0DE] hover:text-[#F4D6B0] transition text-sm font-bold w-8 h-8 rounded-lg flex items-center justify-center bg-[#0B132B] border border-[#3A506B]"
              >✕</button>
            </div>

            <form onSubmit={guardarUnidad} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {errorUnidad && (
                  <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs p-3 rounded-xl font-medium">
                    {errorUnidad}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="und-nombre" className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Nombre de la Unidad *</label>
                  <input
                    id="und-nombre"
                    placeholder="Ej. Botella"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]"
                    value={formUnidad.nombre}
                    onChange={(e) => cambiarCampoUnidad("nombre", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="und-abrev" className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Abreviatura *</label>
                  <input
                    id="und-abrev"
                    placeholder="Ej. bot"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono lowercase"
                    value={formUnidad.abreviatura}
                    onChange={(e) => cambiarCampoUnidad("abreviatura", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="und-desc" className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Descripción (Opcional)</label>
                  <input
                    id="und-desc"
                    placeholder="Ej. Envase de vidrio de 750ml"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]"
                    value={formUnidad.descripcion}
                    onChange={(e) => cambiarCampoUnidad("descripcion", e.target.value)}
                  />
                </div>
              </div>

              <div className="shrink-0 px-4 sm:px-6 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#1C2541] border-t border-[#3A506B] flex justify-end gap-3">
                <button
                  type="button"
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#0B132B] text-[#5BC0DE] hover:text-[#F4D6B0] text-xs font-medium border border-[#3A506B]"
                  onClick={() => { setMostrarModalUnidad(false); setErrorUnidad(""); setFormUnidad({ nombre: "", abreviatura: "", descripcion: "" }); }}
                >Cancelar</button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] font-semibold text-xs transition shadow-lg"
                >Guardar Unidad</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
