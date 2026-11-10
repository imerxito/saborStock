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

type Proveedor = {
  id: number;
  nombre: string;
  contacto: string;
  telefono: string;
  email: string;
  categoriaSuministro: string;
  activo: boolean;
};

type CompraInsumo = {
  id: number;
  id_proveedor: number;
  id_insumo: number;
  cantidad: number;
  costoTotal: number;
  fecha: string;
  factura: string;
};

type FormProveedor = {
  nombre: string;
  contacto: string;
  telefono: string;
  email: string;
  categoriaSuministro: string;
};

type FormCompra = {
  id_proveedor: string;
  id_categoria: string;
  id_insumo: string;
  cantidad: string;
  costoTotal: string;
  fecha: string;
  factura: string;
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
  { id: 10, codigo: "ING-010", nombre: "Coca-Cola 400ml Botella", id_unidad: 5, id_categoria: 4, stock: 36.0, minimo: 12.0, maximo: 80.0, precioReferencia: 2500, caducidad: "2027-03-15" }
];

const PROVEEDORES_INICIALES: Proveedor[] = [
  { id: 1, nombre: "Distribuidora Cárnica del Sinú", contacto: "Carlos Mendoza", telefono: "3014567890", email: "ventas@carnicsinu.com", categoriaSuministro: "Carnes & Proteínas", activo: true },
  { id: 2, nombre: "Abastos y Abarrotes El Mayorista", contacto: "Ana Lucía Paternina", telefono: "3109876543", email: "pedidos@elmayorista.co", categoriaSuministro: "Panadería & Abarrotes", activo: true },
  { id: 3, nombre: "Lácteos y Derivados del Norte", contacto: "Ernesto Baquero", telefono: "3201122334", email: "contacto@lacteosnorte.com", categoriaSuministro: "Lácteos & Quesos", activo: true },
  { id: 4, nombre: "Central de Verduras y Frutas Frescas", contacto: "Maritza Soto", telefono: "3156677889", email: "ventas@frutivercentral.com", categoriaSuministro: "Verduras & Vegetales", activo: true },
  { id: 5, nombre: "Bebidas y Licores La 14", contacto: "Jorge Iván Restrepo", telefono: "3008765432", email: "distribucion@lalicorera14.com", categoriaSuministro: "Bebidas & Embotellados", activo: true },
  { id: 6, nombre: "Salsas y Especias del Valle", contacto: "Diana Carolina Paz", telefono: "3123456789", email: "compras@salsasvalle.com", categoriaSuministro: "Salsas & Aliños", activo: true },
  { id: 7, nombre: "Panificadora Central S.A.", contacto: "Roberto Gómez", telefono: "3145678901", email: "ventas@panificadoracentral.com", categoriaSuministro: "Panadería & Abarrotes", activo: true },
  { id: 8, nombre: "Embutidos y Fiambres Premium", contacto: "Sandra Milena Ríos", telefono: "3187654321", email: "contacto@embutidospremium.co", categoriaSuministro: "Embutidos & Fiambres", activo: true },
  { id: 9, nombre: "Aseo Total Institucional", contacto: "Luis Alberto Mora", telefono: "3219876543", email: "pedidos@aseototal.com", categoriaSuministro: "Abarrotes (Aseo)", activo: true },
  { id: 10, nombre: "Postres y Dulces Caseros", contacto: "Marta Lucía Sánchez", telefono: "3176543210", email: "ventas@postrescaseros.com", categoriaSuministro: "Postres & Dulces", activo: true },
  // Nuevos 5 Proveedores
  { id: 11, nombre: "Pescados y Mariscos del Pacífico", contacto: "Hernán Cortés", telefono: "3112223344", email: "ventas@mariscospacifico.com", categoriaSuministro: "Carnes & Proteínas", activo: true },
  { id: 12, nombre: "Granos y Cereales El Sol", contacto: "Inés Valencia", telefono: "3165556677", email: "pedidos@elsolgranos.com", categoriaSuministro: "Panadería & Abarrotes", activo: true },
  { id: 13, nombre: "Café de Origen y Aromáticas", contacto: "Valentina Ríos", telefono: "3023334455", email: "compras@cafedeorigen.co", categoriaSuministro: "Bebidas & Embotellados", activo: true },
  { id: 14, nombre: "Quesos Artesanales de la Sabana", contacto: "Pedro Nel Gómez", telefono: "3134445566", email: "ventas@lacteossabana.com", categoriaSuministro: "Lácteos & Quesos", activo: true },
  { id: 15, nombre: "Distribuidora de Frutas Tropicales", contacto: "Gloria Patricia Paz", telefono: "3101112233", email: "contacto@frutastropicales.com", categoriaSuministro: "Frutas Frescas", activo: true }
];

const COMPRAS_INICIALES: CompraInsumo[] = [
  { id: 1, id_proveedor: 1, id_insumo: 4, cantidad: 20, costoTotal: 560000, fecha: "2026-05-01", factura: "FAC-9012" },
  { id: 2, id_proveedor: 2, id_insumo: 1, cantidad: 50, costoTotal: 125000, fecha: "2026-05-03", factura: "FAC-3456" },
  { id: 3, id_proveedor: 3, id_insumo: 7, cantidad: 30, costoTotal: 36000, fecha: "2026-05-04", factura: "FAC-7881" },
  { id: 4, id_proveedor: 4, id_insumo: 8, cantidad: 15, costoTotal: 67500, fecha: "2026-05-05", factura: "FAC-1102" },
  { id: 5, id_proveedor: 5, id_insumo: 9, cantidad: 100, costoTotal: 380000, fecha: "2026-05-06", factura: "FAC-4432" },
  { id: 6, id_proveedor: 6, id_insumo: 2, cantidad: 10, costoTotal: 85000, fecha: "2026-05-07", factura: "FAC-8899" }
];

const FORM_PROVEEDOR_VACIO: FormProveedor = {
  nombre: "",
  contacto: "",
  telefono: "",
  email: "",
  categoriaSuministro: "Carnes & Proteínas",
};

const FORM_COMPRA_VACIO: FormCompra = {
  id_proveedor: "1",
  id_categoria: "1",
  id_insumo: "1",
  cantidad: "",
  costoTotal: "",
  fecha: new Date().toISOString().split("T")[0],
  factura: "",
};

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

export default function ProveedoresCompras() {
  const [proveedores, setProveedores] = useState<Proveedor[]>(PROVEEDORES_INICIALES);
  const [compras, setCompras] = useState<CompraInsumo[]>(COMPRAS_INICIALES);
  const [insumos] = useState<Insumo[]>(INICIAL);
  const [categorias] = useState<CategoriaIngrediente[]>(CATEGORIAS_INICIALES);
  const [unidades] = useState<UnidadMedida[]>(UNIDADES_INICIALES);

  const [busqueda, setBusqueda] = useState("");
  const [selectedCategoriaFiltro, setSelectedCategoriaFiltro] = useState<number | 'todas'>('todas');
  const categoriasScroll = useDragScroll();

  const [mostrarModalProveedor, setMostrarModalProveedor] = useState(false);
  const [mostrarModalCompra, setMostrarModalCompra] = useState(false);

  const [formProveedor, setFormProveedor] = useState<FormProveedor>(FORM_PROVEEDOR_VACIO);
  const [formCompra, setFormCompra] = useState<FormCompra>(FORM_COMPRA_VACIO);

  const [errorProveedor, setErrorProveedor] = useState("");
  const [errorCompra, setErrorCompra] = useState("");

  const insumosFormFiltrados = useMemo(() => {
    const catId = Number(formCompra.id_categoria);
    return insumos.filter((i) => i.id_categoria === catId);
  }, [insumos, formCompra.id_categoria]);

  const comprasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return compras.filter((c) => {
      const prov = proveedores.find((p) => p.id === c.id_proveedor);
      const ins = insumos.find((i) => i.id === c.id_insumo);

      const matchSearch = q === '' || 
        (prov && prov.nombre.toLowerCase().includes(q)) || 
        (ins && ins.nombre.toLowerCase().includes(q)) || 
        c.factura.toLowerCase().includes(q);

      const matchCat = selectedCategoriaFiltro === 'todas' || (ins && ins.id_categoria === selectedCategoriaFiltro);

      return matchSearch && matchCat;
    });
  }, [compras, proveedores, insumos, busqueda, selectedCategoriaFiltro]);

  const guardarProveedor = (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = formProveedor.nombre.trim();
    const contacto = formProveedor.contacto.trim();
    const telefono = formProveedor.telefono.trim();
    const email = formProveedor.email.trim();

    if (!nombre) return setErrorProveedor("El nombre del proveedor es obligatorio.");
    if (proveedores.some((p) => p.nombre.toLowerCase() === nombre.toLowerCase()))
      return setErrorProveedor("Ya existe un proveedor registrado con ese nombre.");

    const nuevoId = proveedores.length ? Math.max(...proveedores.map((p) => p.id)) + 1 : 1;

    setProveedores((prev) => [
      ...prev,
      {
        id: nuevoId,
        nombre,
        contacto,
        telefono,
        email,
        categoriaSuministro: formProveedor.categoriaSuministro,
        activo: true,
      },
    ]);
    setMostrarModalProveedor(false);
    setFormProveedor(FORM_PROVEEDOR_VACIO);
    setErrorProveedor("");
  };

  const guardarCompra = (e: React.FormEvent) => {
    e.preventDefault();
    const id_proveedor = Number(formCompra.id_proveedor);
    const id_insumo = Number(formCompra.id_insumo);
    const cantidad = Number(formCompra.cantidad);
    const costoTotal = Number(formCompra.costoTotal);
    const fecha = formCompra.fecha;
    const factura = formCompra.factura.trim();

    if (Number.isNaN(cantidad) || cantidad <= 0) return setErrorCompra("Ingresa una cantidad válida mayor a 0.");
    if (Number.isNaN(costoTotal) || costoTotal < 0) return setErrorCompra("Ingresa un costo total válido.");
    if (!factura) return setErrorCompra("El número de factura o recibo es obligatorio.");
    if (!id_insumo) return setErrorCompra("Debes seleccionar un insumo válido.");

    const nuevoId = compras.length ? Math.max(...compras.map((c) => c.id)) + 1 : 1;

    setCompras((prev) => [
      ...prev,
      {
        id: nuevoId,
        id_proveedor,
        id_insumo,
        cantidad,
        costoTotal,
        fecha,
        factura,
      },
    ]);
    setMostrarModalCompra(false);
    setFormCompra(FORM_COMPRA_VACIO);
    setErrorCompra("");
  };

  const eliminarCompra = (id: number) => {
    if (window.confirm("¿Estás seguro de eliminar este registro de compra?")) {
      setCompras((prev) => prev.filter((c) => c.id !== id));
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#F4D6B0]">Proveedores & Compras</h2>
                  <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#3A506B]/40 text-[#5BC0DE] border border-[#5BC0DE]/30 font-mono font-medium">
                    Gestión Comercial
                  </span>
                </div>
                <p className="hidden sm:block text-[11px] text-[#5BC0DE]/80">Control de gastos por proveedor, facturas y asociación directa con categorías de insumos</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto">
              <button
                type="button"
                onClick={() => setMostrarModalProveedor(true)}
                className="flex-1 md:flex-none justify-center bg-[#0B132B] hover:bg-[#3A506B]/50 text-[#5BC0DE] hover:text-[#F4D6B0] border border-[#3A506B] px-2.5 py-2 md:py-1.5 rounded-xl text-[10px] sm:text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5 text-[#5BC0DE]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Proveedor
              </button>
              <button
                type="button"
                onClick={() => setMostrarModalCompra(true)}
                className="w-full md:w-auto justify-center bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] px-3 py-2 md:py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Registrar Compra
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
                placeholder="Buscar por proveedor, insumo o factura..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="text-xs text-[#5BC0DE] font-medium shrink-0 self-end sm:self-auto">
              Registros: <span className="text-[#F4D6B0] font-bold">{comprasFiltradas.length}</span>
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
                onClick={() => setSelectedCategoriaFiltro('todas')}
                className={`px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold whitespace-nowrap transition-all border shrink-0 ${
                  selectedCategoriaFiltro === 'todas'
                    ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow'
                    : 'bg-[#0B132B] text-[#5BC0DE] border-[#3A506B] hover:border-[#5BC0DE]'
                }`}
              >
                Todas ({compras.length})
              </button>

              {categorias.map((cat) => {
                const count = compras.filter((c) => {
                  const ins = insumos.find((i) => i.id === c.id_insumo);
                  return ins && ins.id_categoria === cat.id;
                }).length;
                const isSelected = selectedCategoriaFiltro === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoriaFiltro(cat.id)}
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

      {/* Contenido Principal con Scroll */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 overflow-y-auto overflow-x-hidden pb-[calc(6rem+env(safe-area-inset-bottom))] flex flex-col">
        <section className="bg-[#1C2541] border border-[#3A506B] rounded-xl sm:rounded-2xl shadow-xl flex-1 flex flex-col">
          
          {/* VISTA ESCRITORIO: TABLA SUAVIZADA (FILAS FLOTANTES) */}
          <div className="hidden md:block overflow-x-auto w-full p-2">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead className="sticky top-0 z-30 bg-[#1C2541]">
                <tr className="text-[#5BC0DE] text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 bg-[#1C2541] first:rounded-l-xl">Fecha / Factura</th>
                  <th className="py-3 px-4 bg-[#1C2541]">Proveedor</th>
                  <th className="py-3 px-4 bg-[#1C2541]">Insumo Adquirido</th>
                  <th className="py-3 px-4 bg-[#1C2541]">Categoría</th>
                  <th className="py-3 px-4 bg-[#1C2541]">Cantidad</th>
                  <th className="py-3 px-4 bg-[#1C2541]">Costo Total</th>
                  <th className="py-3 px-4 bg-[#1C2541] text-right last:rounded-r-xl">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {comprasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#5BC0DE]/60 bg-[#0B132B] rounded-xl border border-[#3A506B]">
                      <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {busqueda || selectedCategoriaFiltro !== 'todas' ? "Ninguna compra coincide con los filtros." : "Aún no hay compras registradas."}
                    </td>
                  </tr>
                ) : (
                  comprasFiltradas.map((c) => {
                    const prov = proveedores.find((p) => p.id === c.id_proveedor);
                    const ins = insumos.find((i) => i.id === c.id_insumo);
                    const uni = ins ? unidades.find((u) => u.id_unidad === ins.id_unidad) : null;
                    const cat = ins ? categorias.find((catId) => catId.id === ins.id_categoria) : null;

                    return (
                      <tr key={c.id} className="group">
                        <td className="py-3 px-4 bg-[#0B132B] border-y border-l border-[#3A506B]/60 rounded-l-xl group-hover:bg-[#152036] transition-all">
                          <div className="font-mono text-xs text-[#F4D6B0] font-semibold">{c.fecha}</div>
                          <span className="text-[10px] font-mono text-[#5BC0DE]">{c.factura}</span>
                        </td>
                        <td className="py-3 px-4 bg-[#0B132B] border-y border-[#3A506B]/60 group-hover:bg-[#152036] transition-all">
                          <div className="font-semibold text-[#F4D6B0] text-xs">{prov ? prov.nombre : "Desconocido"}</div>
                          <span className="text-[10px] text-[#5BC0DE]">{prov ? prov.telefono : ""}</span>
                        </td>
                        <td className="py-3 px-4 bg-[#0B132B] border-y border-[#3A506B]/60 group-hover:bg-[#152036] transition-all">
                          <div className="text-xs font-semibold text-[#F4D6B0]">{ins ? ins.nombre : "Eliminado"}</div>
                          {ins?.codigo && <span className="text-[10px] font-mono text-[#5BC0DE]">{ins.codigo}</span>}
                        </td>
                        <td className="py-3 px-4 bg-[#0B132B] border-y border-[#3A506B]/60 group-hover:bg-[#152036] transition-all">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1C2541] text-[#5BC0DE] border border-[#3A506B] whitespace-nowrap">
                            {cat ? cat.nombre : "General"}
                          </span>
                        </td>
                        <td className="py-3 px-4 bg-[#0B132B] border-y border-[#3A506B]/60 group-hover:bg-[#152036] transition-all">
                          <div className="font-mono text-xs text-[#F4D6B0] font-bold">
                            {c.cantidad} <span className="lowercase text-[#5BC0DE] font-normal">{uni ? uni.abreviatura : "ud"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 bg-[#0B132B] border-y border-[#3A506B]/60 group-hover:bg-[#152036] transition-all">
                          <div className="font-mono font-bold text-emerald-400 text-xs">
                            ${c.costoTotal.toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3 px-4 bg-[#0B132B] border-y border-r border-[#3A506B]/60 rounded-r-xl group-hover:bg-[#152036] transition-all text-right">
                          <button
                            type="button"
                            className="bg-[#D97706]/10 hover:bg-[#D97706]/20 text-[#D97706] p-2 rounded-xl transition-all active:scale-90"
                            onClick={() => eliminarCompra(c.id)}
                            title="Eliminar registro"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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
            {comprasFiltradas.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#5BC0DE]/60">
                <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                No se encontraron compras.
              </div>
            ) : (
              comprasFiltradas.map((c) => {
                const prov = proveedores.find((p) => p.id === c.id_proveedor);
                const ins = insumos.find((i) => i.id === c.id_insumo);
                const uni = ins ? unidades.find((u) => u.id_unidad === ins.id_unidad) : null;
                const cat = ins ? categorias.find((catId) => catId.id === ins.id_categoria) : null;

                return (
                  <div key={c.id} className="bg-[#0B132B] border border-[#3A506B] rounded-xl p-3 flex flex-col gap-1.5 shadow-sm active:scale-[0.99] transition-transform">
                    {/* Cabecera: Factura y Fecha */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 pr-1">
                        <span className="block font-mono font-bold text-xs text-[#5BC0DE] truncate">{c.factura}</span>
                        <span className="block text-[10px] text-[#F4D6B0]/70 mt-0.5">{c.fecha}</span>
                      </div>
                      <span className="shrink-0 font-mono font-bold text-emerald-400 text-sm">${c.costoTotal.toLocaleString()}</span>
                    </div>

                    {/* Proveedor e Insumo */}
                    <div className="mt-1 border-t border-[#3A506B]/50 pt-1.5">
                      <p className="text-[10px] text-[#5BC0DE] font-semibold">Proveedor:</p>
                      <p className="text-[11px] text-[#F4D6B0] font-medium truncate">{prov ? prov.nombre : "Desconocido"}</p>
                      
                      <p className="text-[10px] text-[#5BC0DE] font-semibold mt-1">Insumo:</p>
                      <p className="text-[11px] text-[#F4D6B0] font-medium truncate">{ins ? ins.nombre : "Eliminado"} ({c.cantidad} {uni?.abreviatura || 'ud'})</p>
                    </div>

                    {/* Categoría y Acciones */}
                    <div className="flex items-center justify-between border-t border-[#3A506B]/50 pt-2 mt-1">
                      <span className="text-[9px] px-2 py-0.5 bg-[#1C2541] rounded-md text-[#5BC0DE] border border-[#3A506B]">
                        {cat ? cat.nombre : 'General'}
                      </span>
                      <button
                        type="button"
                        className="bg-[#D97706]/10 text-[#D97706] p-1.5 rounded-lg active:scale-95 transition"
                        onClick={() => eliminarCompra(c.id)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </section>
      </main>

      {/* MODAL: Nuevo Proveedor */}
      {mostrarModalProveedor && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4 pointer-events-auto">
          <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl h-[100dvh] sm:h-auto sm:max-h-[85dvh] flex flex-col overflow-hidden">
            <div className="bg-[#0B132B] px-4 sm:px-6 py-3 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-3 border-b border-[#3A506B] flex justify-between items-center shrink-0">
              <h3 className="font-bold text-[#F4D6B0] flex items-center gap-2 text-sm sm:text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5BC0DE]"></span>
                Registrar Nuevo Proveedor
              </h3>
              <button 
                type="button"
                onClick={() => { setMostrarModalProveedor(false); setErrorProveedor(""); setFormProveedor(FORM_PROVEEDOR_VACIO); }}
                className="text-[#5BC0DE] hover:text-[#F4D6B0] transition text-sm font-bold w-8 h-8 rounded-lg flex items-center justify-center bg-[#0B132B] border border-[#3A506B]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarProveedor} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B]">
                {errorProveedor && (
                  <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs p-3 rounded-xl font-medium">
                    {errorProveedor}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Nombre del Proveedor *</label>
                  <input
                    placeholder="Ej. Distribuidora de Alimentos SAS"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]"
                    value={formProveedor.nombre}
                    onChange={(e) => setFormProveedor({ ...formProveedor, nombre: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Persona de Contacto</label>
                  <input
                    placeholder="Ej. Juan Pérez"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]"
                    value={formProveedor.contacto}
                    onChange={(e) => setFormProveedor({ ...formProveedor, contacto: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Teléfono</label>
                    <input
                      placeholder="Ej. 3001234567"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono"
                      value={formProveedor.telefono}
                      onChange={(e) => setFormProveedor({ ...formProveedor, telefono: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Categoría Principal</label>
                    <select
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]"
                      value={formProveedor.categoriaSuministro}
                      onChange={(e) => setFormProveedor({ ...formProveedor, categoriaSuministro: e.target.value })}
                    >
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.nombre} className="bg-[#0B132B] text-[#F4D6B0]">
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="contacto@proveedor.com"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]"
                    value={formProveedor.email}
                    onChange={(e) => setFormProveedor({ ...formProveedor, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="shrink-0 px-4 sm:px-6 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#1C2541] border-t border-[#3A506B] flex justify-end gap-3">
                <button
                  type="button"
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#0B132B] text-[#5BC0DE] hover:text-[#F4D6B0] text-xs font-medium border border-[#3A506B]"
                  onClick={() => { setMostrarModalProveedor(false); setErrorProveedor(""); setFormProveedor(FORM_PROVEEDOR_VACIO); }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] font-semibold text-xs transition shadow-lg"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Registrar Compra */}
      {mostrarModalCompra && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4 pointer-events-auto">
          <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl h-[100dvh] sm:h-auto sm:max-h-[85dvh] flex flex-col overflow-hidden">
            <div className="bg-[#0B132B] px-4 sm:px-6 py-3 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-3 border-b border-[#3A506B] flex justify-between items-center shrink-0">
              <h3 className="font-bold text-[#F4D6B0] flex items-center gap-2 text-sm sm:text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5BC0DE]"></span>
                Registrar Compra de Insumo
              </h3>
              <button 
                type="button"
                onClick={() => { setMostrarModalCompra(false); setErrorCompra(""); setFormCompra(FORM_COMPRA_VACIO); }}
                className="text-[#5BC0DE] hover:text-[#F4D6B0] transition text-sm font-bold w-8 h-8 rounded-lg flex items-center justify-center bg-[#0B132B] border border-[#3A506B]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarCompra} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B]">
                {errorCompra && (
                  <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs p-3 rounded-xl font-medium">
                    {errorCompra}
                  </div>
                )}
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Proveedor *</label>
                  <select
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]"
                    value={formCompra.id_proveedor}
                    onChange={(e) => setFormCompra({ ...formCompra, id_proveedor: e.target.value })}
                  >
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#0B132B] text-[#F4D6B0]">
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Categoría de Insumo *</label>
                    <select
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]"
                      value={formCompra.id_categoria}
                      onChange={(e) => {
                        const newCatId = e.target.value;
                        const firstIns = insumos.find(i => i.id_categoria === Number(newCatId));
                        setFormCompra({ 
                          ...formCompra, 
                          id_categoria: newCatId, 
                          id_insumo: firstIns ? String(firstIns.id) : "" 
                        });
                      }}
                    >
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-[#0B132B] text-[#F4D6B0]">
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Insumo Adquirido *</label>
                    <select
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE]"
                      value={formCompra.id_insumo}
                      onChange={(e) => setFormCompra({ ...formCompra, id_insumo: e.target.value })}
                    >
                      {insumosFormFiltrados.length === 0 ? (
                        <option value="" disabled className="bg-[#0B132B] text-[#F4D6B0]/50">
                          No hay insumos en esta categoría
                        </option>
                      ) : (
                        insumosFormFiltrados.map((i) => (
                          <option key={i.id} value={i.id} className="bg-[#0B132B] text-[#F4D6B0]">
                            {i.nombre} {i.codigo ? `(${i.codigo})` : ""}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Cantidad *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Ej. 15"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono"
                      value={formCompra.cantidad}
                      onChange={(e) => setFormCompra({ ...formCompra, cantidad: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Costo Total ($) *</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ej. 120000"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono"
                      value={formCompra.costoTotal}
                      onChange={(e) => setFormCompra({ ...formCompra, costoTotal: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Fecha de Compra *</label>
                    <input
                      type="date"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono"
                      value={formCompra.fecha}
                      onChange={(e) => setFormCompra({ ...formCompra, fecha: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-[#5BC0DE]">Factura / Recibo *</label>
                    <input
                      placeholder="Ej. FAC-5542"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono"
                      value={formCompra.factura}
                      onChange={(e) => setFormCompra({ ...formCompra, factura: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="shrink-0 px-4 sm:px-6 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#1C2541] border-t border-[#3A506B] flex justify-end gap-3">
                <button
                  type="button"
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#0B132B] text-[#5BC0DE] hover:text-[#F4D6B0] text-xs font-medium border border-[#3A506B]"
                  onClick={() => { setMostrarModalCompra(false); setErrorCompra(""); setFormCompra(FORM_COMPRA_VACIO); }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] font-semibold text-xs transition shadow-lg"
                >
                  Guardar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}