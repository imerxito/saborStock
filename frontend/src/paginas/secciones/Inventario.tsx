import { useMemo, useState, useRef } from "react";

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

type FormCategoria = {
  nombre: string;
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
  const [insumos, setInsumos] = useState<Insumo[]>(INICIAL);
  const [unidades, setUnidades] = useState<UnidadMedida[]>(UNIDADES_INICIALES);
  const [categorias, setCategorias] = useState<CategoriaIngrediente[]>(CATEGORIAS_INICIALES);
  
  const [busqueda, setBusqueda] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<number | 'todas'>('todas');
  const categoriasScroll = useDragScroll();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarModalUnidad, setMostrarModalUnidad] = useState(false);
  const [mostrarModalCategoria, setMostrarModalCategoria] = useState(false);

  const [form, setForm] = useState<FormInsumo>(FORM_VACIO);
  const [formUnidad, setFormUnidad] = useState<FormUnidad>({ nombre: "", abreviatura: "", descripcion: "" });
  const [formCategoria, setFormCategoria] = useState<FormCategoria>({ nombre: "" });

  const [error, setError] = useState("");
  const [errorUnidad, setErrorUnidad] = useState("");
  const [errorCategoria, setErrorCategoria] = useState("");

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

  const cambiarCampoCategoria = (campo: keyof FormCategoria, valor: string) =>
    setFormCategoria((f) => ({ ...f, [campo]: valor }));

  const cerrarForm = () => {
    setMostrarForm(false);
    setForm(FORM_VACIO);
    setError("");
  };

  const guardarInsumo = (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = form.nombre.trim();
    const stock = Number(form.stock);
    const minimo = Number(form.minimo);
    const maximo = Number(form.maximo);
    const id_unidad = Number(form.id_unidad);
    const id_categoria = Number(form.id_categoria);
    const precioReferencia = Number(form.precioReferencia) || 0;
    const caducidad = form.caducidad;

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
        codigo: form.codigo.trim() || `ING-00${prev.length + 1}`,
        nombre,
        id_unidad,
        id_categoria,
        stock,
        minimo,
        maximo,
        precioReferencia,
        caducidad,
      },
    ]);
    cerrarForm();
  };

  const guardarUnidad = (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = formUnidad.nombre.trim();
    const abreviatura = formUnidad.abreviatura.trim().toLowerCase();
    const descripcion = formUnidad.descripcion.trim();

    if (!nombre || !abreviatura) return setErrorUnidad("Nombre y abreviatura son obligatorios.");
    if (unidades.some((u) => u.abreviatura === abreviatura || u.nombre.toLowerCase() === nombre.toLowerCase()))
      return setErrorUnidad("Esta unidad o abreviatura ya se encuentra registrada.");

    const nuevoId = unidades.length ? Math.max(...unidades.map((u) => u.id_unidad)) + 1 : 1;

    setUnidades((prev) => [
      ...prev,
      { id_unidad: nuevoId, nombre, abreviatura, descripcion, activo: true },
    ]);
    setForm((prev) => ({ ...prev, id_unidad: String(nuevoId) }));
    setFormUnidad({ nombre: "", abreviatura: "", descripcion: "" });
    setErrorUnidad("");
    setMostrarModalUnidad(false);
  };

  const guardarCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = formCategoria.nombre.trim();

    if (!nombre) return setErrorCategoria("El nombre de la categoría es obligatorio.");
    if (categorias.some((c) => c.nombre.toLowerCase() === nombre.toLowerCase()))
      return setErrorCategoria("Esta categoría ya se encuentra registrada.");

    const nuevoId = categorias.length ? Math.max(...categorias.map((c) => c.id)) + 1 : 1;

    setCategorias((prev) => [
      ...prev,
      { id: nuevoId, nombre },
    ]);
    setForm((prev) => ({ ...prev, id_categoria: String(nuevoId) }));
    setFormCategoria({ nombre: "" });
    setErrorCategoria("");
    setMostrarModalCategoria(false);
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
    <div className="h-full w-full bg-[#0B132B] text-[#F4D6B0] font-sans antialiased flex flex-col overflow-hidden">
      {/* Header Fijo */}
      <div className="shrink-0 w-full flex flex-col z-50 bg-[#0B132B]">
        <header className="bg-[#1C2541] border-b border-[#3A506B] px-4 lg:px-6 py-2">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#3A506B]/40 border border-[#5BC0DE]/30 text-[#5BC0DE]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-[#F4D6B0]">Gestión de Inventario</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3A506B]/40 text-[#5BC0DE] border border-[#5BC0DE]/30 font-mono font-medium">
                    Insumos & Stock
                  </span>
                </div>
                <p className="text-[11px] text-[#5BC0DE]/80">Control de existencias, categorías, fechas de caducidad y unidades de medida</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => setMostrarModalCategoria(true)}
                className="bg-[#0B132B] hover:bg-[#3A506B]/50 text-[#5BC0DE] hover:text-[#F4D6B0] border border-[#3A506B] px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-[#5BC0DE]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Categoría
              </button>
              <button
                onClick={() => setMostrarModalUnidad(true)}
                className="bg-[#0B132B] hover:bg-[#3A506B]/50 text-[#5BC0DE] hover:text-[#F4D6B0] border border-[#3A506B] px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-[#5BC0DE]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Unidad de Medida
              </button>
              <button
                onClick={() => setMostrarForm(true)}
                className="bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Insumo
              </button>
            </div>
          </div>
        </header>

        {/* Barra de Búsqueda y Filtros con Desplazamiento Horizontal (Drag & Scroll y barra visible) */}
        <div className="bg-[#1C2541] px-4 lg:px-6 py-2.5 border-b border-[#3A506B] space-y-2.5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-2.5 items-center justify-between">
            <div className="relative flex-1 w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#5BC0DE]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                className="w-full bg-[#0B132B] border border-[#3A506B] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#F4D6B0] placeholder-[#5BC0DE]/50 focus:outline-none focus:border-[#5BC0DE]"
                placeholder="Buscar ingrediente por nombre o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="text-xs text-[#5BC0DE] font-medium shrink-0">
              Registros totales: <span className="text-[#F4D6B0] font-bold">{filtrados.length}</span>
            </div>
          </div>

          {/* Filtro horizontal de Categorías con desplazamiento fluido y barra scroll visible */}
          <div className="max-w-7xl mx-auto relative group">
            <div 
              ref={categoriasScroll.ref}
              {...categoriasScroll.props}
              className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-0.5 cursor-grab active:cursor-grabbing select-none [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B]"
            >
              <span className="text-[11px] font-bold text-[#5BC0DE] uppercase shrink-0 flex items-center gap-1 mr-1">
                Categorías:
              </span>
              <button
                onClick={() => setSelectedCategoria('todas')}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border shrink-0 ${
                  selectedCategoria === 'todas'
                    ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow'
                    : 'bg-[#0B132B] text-[#5BC0DE] border-[#3A506B] hover:border-[#5BC0DE]'
                }`}
              >
                Todas ({insumos.length})
              </button>

              {categorias.map((cat) => {
                const count = insumos.filter(i => i.id_categoria === cat.id).length;
                const isSelected = selectedCategoria === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoria(cat.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0 ${
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
            <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-[#1C2541] to-transparent pointer-events-none hidden sm:block"></div>
          </div>
        </div>
      </div>

      {/* Contenido Principal con Scroll Aislado y scrollbar habilitado en la tabla */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 overflow-hidden flex flex-col">
        <section className="bg-[#1C2541] border border-[#3A506B] rounded-2xl overflow-hidden shadow-xl flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B] relative">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-30 bg-[#1C2541] shadow-md border-b-2 border-[#5BC0DE]">
                <tr className="text-[#5BC0DE] text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 bg-[#1C2541]">Ingrediente / Código</th>
                  <th className="py-3 px-4 bg-[#1C2541]">Categoría</th>
                  <th className="py-3 px-4 bg-[#1C2541]">Caducidad</th>
                  <th className="py-3 px-4 bg-[#1C2541]">Stock Actual</th>
                  <th className="py-3 px-4 bg-[#1C2541]">Estado</th>
                  <th className="py-3 px-4 text-right bg-[#1C2541]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3A506B]/50 text-sm">
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#5BC0DE]/60">
                      <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
                      </svg>
                      {busqueda || selectedCategoria !== 'todas' ? "Ningún insumo coincide con los filtros seleccionados." : "Aún no hay insumos registrados."}
                    </td>
                  </tr>
                ) : (
                  filtrados.map((i) => {
                    const { porcentaje, abreviatura, texto, estadoBadge, barraColor } = calcular(i, unidades);
                    const catObj = categorias.find((c) => c.id === i.id_categoria);
                    return (
                      <tr key={i.id} className="hover:bg-[#3A506B]/20 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#F4D6B0]">
                            {i.nombre}
                          </div>
                          {i.codigo && (
                            <span className="text-xs text-[#5BC0DE] font-mono">
                              {i.codigo}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#5BC0DE]">
                          {catObj ? catObj.nombre : "General"}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-[#F4D6B0]">
                          {i.caducidad ? i.caducidad : <span className="text-[#5BC0DE]/50 italic">No especificada</span>}
                        </td>
                        <td className="py-3 px-4 w-64">
                          <div className="flex justify-between text-xs mb-1 font-medium">
                            <span className="text-[#F4D6B0]">
                              {i.stock} <span className="text-[#5BC0DE] lowercase">{abreviatura}</span>
                            </span>
                            <span className="text-[#5BC0DE] font-mono">{porcentaje}%</span>
                          </div>
                          <div className="w-full bg-[#0B132B] rounded-full h-1.5 overflow-hidden border border-[#3A506B]">
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${barraColor}`}
                              style={{ width: `${porcentaje}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${estadoBadge}`}>
                            {texto}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              className="bg-[#0B132B] hover:bg-[#3A506B] text-[#5BC0DE] border border-[#3A506B] w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm transition disabled:opacity-30"
                              onClick={() => cambiarStock(i.id, i.stock - 1)}
                              disabled={i.stock <= 0}
                              aria-label={`Restar 1 a ${i.nombre}`}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={0}
                              className="w-14 bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] text-center rounded-lg py-1 text-xs focus:outline-none focus:border-[#5BC0DE] font-mono"
                              value={i.stock}
                              onChange={(e) => cambiarStock(i.id, Number(e.target.value))}
                              aria-label={`Stock de ${i.nombre}`}
                            />
                            <button
                              className="bg-[#0B132B] hover:bg-[#3A506B] text-[#5BC0DE] border border-[#3A506B] w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm transition"
                              onClick={() => cambiarStock(i.id, i.stock + 1)}
                              aria-label={`Sumar 1 a ${i.nombre}`}
                            >
                              +
                            </button>
                            <button
                              className="ml-1.5 bg-[#D97706]/10 hover:bg-[#D97706]/20 text-[#D97706] p-1.5 rounded-lg transition"
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
        </section>
      </main>

      {/* MODAL: Nuevo Insumo con Caducidad y Categoría */}
      {mostrarForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pointer-events-auto">
          <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-[#0B132B] px-6 py-4 border-b border-[#3A506B] flex justify-between items-center shrink-0">
              <h3 className="font-bold text-[#F4D6B0] flex items-center gap-2 text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5BC0DE]"></span>
                Registrar Nuevo Ingrediente
              </h3>
              <button 
                onClick={cerrarForm}
                className="text-[#5BC0DE] hover:text-[#F4D6B0] transition text-sm font-bold w-7 h-7 rounded-lg flex items-center justify-center bg-[#0B132B] border border-[#3A506B]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarInsumo} className="p-6 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-[#5BC0DE] scrollbar-track-[#0B132B]">
              {error && (
                <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs p-3 rounded-xl font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ins-codigo" className="text-xs font-semibold text-[#5BC0DE]">Código</label>
                  <input
                    id="ins-codigo"
                    placeholder="Ej. ING-004"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#5BC0DE]"
                    value={form.codigo}
                    onChange={(e) => cambiarCampo("codigo", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ins-nombre" className="text-xs font-semibold text-[#5BC0DE]">Nombre del Insumo *</label>
                  <input
                    id="ins-nombre"
                    placeholder="Ej. Tomate triturado"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#5BC0DE]"
                    value={form.nombre}
                    onChange={(e) => cambiarCampo("nombre", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ins-categoria" className="text-xs font-semibold text-[#5BC0DE] flex justify-between items-center">
                    <span>Categoría de Insumo</span>
                    <button
                      type="button"
                      onClick={() => setMostrarModalCategoria(true)}
                      className="text-[10px] text-[#5BC0DE] hover:underline"
                    >
                      Agregar categoría
                    </button>
                  </label>
                  <select
                    id="ins-categoria"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#5BC0DE]"
                    value={form.id_categoria}
                    onChange={(e) => cambiarCampo("id_categoria", e.target.value)}
                  >
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-[#0B132B] text-[#F4D6B0]">
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ins-unidad" className="text-xs font-semibold text-[#5BC0DE] flex justify-between items-center">
                    <span>Unidad de Medida</span>
                    <button
                      type="button"
                      onClick={() => setMostrarModalUnidad(true)}
                      className="text-[10px] text-[#5BC0DE] hover:underline"
                    >
                      Agregar unidad
                    </button>
                  </label>
                  <select
                    id="ins-unidad"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#5BC0DE]"
                    value={form.id_unidad}
                    onChange={(e) => cambiarCampo("id_unidad", e.target.value)}
                  >
                    {unidades.map((u) => (
                      <option key={u.id_unidad} value={u.id_unidad} className="bg-[#0B132B] text-[#F4D6B0]">
                        {u.nombre} ({u.abreviatura})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ins-caducidad" className="text-xs font-semibold text-[#5BC0DE]">Fecha de Caducidad</label>
                  <input
                    id="ins-caducidad"
                    type="date"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#5BC0DE] font-mono"
                    value={form.caducidad}
                    onChange={(e) => cambiarCampo("caducidad", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ins-stock" className="text-xs font-semibold text-[#5BC0DE]">Stock Actual *</label>
                  <input
                    id="ins-stock"
                    type="number"
                    min={0}
                    placeholder="0"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#5BC0DE] font-mono"
                    value={form.stock}
                    onChange={(e) => cambiarCampo("stock", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ins-min" className="text-xs font-semibold text-[#5BC0DE]">Stock Mínimo *</label>
                  <input
                    id="ins-min"
                    type="number"
                    min={0}
                    placeholder="5"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#5BC0DE] font-mono"
                    value={form.minimo}
                    onChange={(e) => cambiarCampo("minimo", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ins-max" className="text-xs font-semibold text-[#5BC0DE]">Stock Máximo *</label>
                  <input
                    id="ins-max"
                    type="number"
                    min={1}
                    placeholder="50"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#5BC0DE] font-mono"
                    value={form.maximo}
                    onChange={(e) => cambiarCampo("maximo", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#3A506B]">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-[#0B132B] text-[#5BC0DE] hover:text-[#F4D6B0] text-xs font-medium"
                  onClick={cerrarForm}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] font-semibold text-xs shadow-lg transition-colors"
                >
                  Guardar Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Categoría de Insumo */}
      {mostrarModalCategoria && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pointer-events-auto">
          <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-[#0B132B] px-6 py-4 border-b border-[#3A506B] flex justify-between items-center shrink-0">
              <h3 className="font-bold text-[#F4D6B0] flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5BC0DE]"></span>
                Nueva Categoría de Insumo
              </h3>
              <button 
                onClick={() => { setMostrarModalCategoria(false); setErrorCategoria(""); setFormCategoria({ nombre: "" }); }}
                className="text-[#5BC0DE] hover:text-[#F4D6B0] transition text-sm font-bold w-7 h-7 rounded-lg flex items-center justify-center bg-[#0B132B] border border-[#3A506B]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarCategoria} className="p-6">
              {errorCategoria && (
                <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs p-3 rounded-xl mb-4 font-medium">
                  {errorCategoria}
                </div>
              )}
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cat-nombre" className="text-xs font-semibold text-[#5BC0DE]">Nombre de la Categoría *</label>
                  <input
                    id="cat-nombre"
                    placeholder="Ej. Condimentos, Frutas y Verduras"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#5BC0DE]"
                    value={formCategoria.nombre}
                    onChange={(e) => cambiarCampoCategoria("nombre", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#3A506B]">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-[#0B132B] text-[#5BC0DE] hover:text-[#F4D6B0] text-xs font-medium"
                  onClick={() => { setMostrarModalCategoria(false); setErrorCategoria(""); setFormCategoria({ nombre: "" }); }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] font-semibold text-xs transition shadow-lg"
                >
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Unidad de Medida */}
      {mostrarModalUnidad && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pointer-events-auto">
          <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-[#0B132B] px-6 py-4 border-b border-[#3A506B] flex justify-between items-center shrink-0">
              <h3 className="font-bold text-[#F4D6B0] flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5BC0DE]"></span>
                Nueva Unidad de Medida
              </h3>
              <button 
                onClick={() => { setMostrarModalUnidad(false); setErrorUnidad(""); setFormUnidad({ nombre: "", abreviatura: "", descripcion: "" }); }}
                className="text-[#5BC0DE] hover:text-[#F4D6B0] transition text-sm font-bold w-7 h-7 rounded-lg flex items-center justify-center bg-[#0B132B] border border-[#3A506B]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarUnidad} className="p-6">
              {errorUnidad && (
                <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs p-3 rounded-xl mb-4 font-medium">
                  {errorUnidad}
                </div>
              )}
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="uni-nombre" className="text-xs font-semibold text-[#5BC0DE]">Nombre *</label>
                  <input
                    id="uni-nombre"
                    placeholder="Ej. Kilogramo, Litro, Caja"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#5BC0DE]"
                    value={formUnidad.nombre}
                    onChange={(e) => cambiarCampoUnidad("nombre", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="uni-abrev" className="text-xs font-semibold text-[#5BC0DE]">Abreviatura *</label>
                  <input
                    id="uni-abrev"
                    placeholder="Ej. kg, l, cja"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#5BC0DE] font-mono"
                    value={formUnidad.abreviatura}
                    onChange={(e) => cambiarCampoUnidad("abreviatura", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="uni-desc" className="text-xs font-semibold text-[#5BC0DE]">Descripción</label>
                  <input
                    id="uni-desc"
                    placeholder="Descripción opcional"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#5BC0DE]"
                    value={formUnidad.descripcion}
                    onChange={(e) => cambiarCampoUnidad("descripcion", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#3A506B]">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-[#0B132B] text-[#5BC0DE] hover:text-[#F4D6B0] text-xs font-medium"
                  onClick={() => { setMostrarModalUnidad(false); setErrorUnidad(""); setFormUnidad({ nombre: "", abreviatura: "", descripcion: "" }); }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] font-semibold text-xs transition shadow-lg"
                >
                  Guardar Unidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}