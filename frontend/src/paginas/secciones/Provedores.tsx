import { useEffect, useMemo, useState, useRef } from "react";
import { ProveedoresServicio } from "../../servicios/ProveedoresServicio";
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

type Proveedor = {
  id: number;
  nombre: string;
  contacto: string;
  telefono: string;
  email: string;
  categoriaSuministro: string;
  activo: boolean;
};

type TipoGasto = "Insumo" | "Mantenimiento" | "Servicios" | "Otros";

type CompraInsumo = {
  id: string | number;
  id_compra: number;
  id_proveedor: number;
  id_insumo?: number;
  tipoGasto: TipoGasto;
  concepto?: string;
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
  tipoGasto: TipoGasto;
  id_proveedor: string;
  concepto: string;
  id_categoria: string;
  id_insumo: string;
  cantidad: string;
  costoTotal: string;
  fecha: string;
  factura: string;
};

const CATEGORIAS_PROVEEDOR_PRESET = [
  "Carnes & Proteínas",
  "Panadería & Abarrotes",
  "Lácteos & Quesos",
  "Verduras & Vegetales",
  "Bebidas & Embotellados",
  "Salsas & Aliños",
  "Frutas Frescas",
  "Embutidos & Fiambres",
  "Mantenimiento & Reparaciones",
  "Servicios Públicos & Operativos",
  "Otros Gastos Operativos",
];

const FORM_PROVEEDOR_VACIO: FormProveedor = {
  nombre: "",
  contacto: "",
  telefono: "",
  email: "",
  categoriaSuministro: "Carnes & Proteínas",
};

const FORM_COMPRA_VACIO: FormCompra = {
  tipoGasto: "Insumo",
  id_proveedor: "1",
  concepto: "",
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
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [compras, setCompras] = useState<CompraInsumo[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [categorias, setCategorias] = useState<CategoriaIngrediente[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [selectedFiltro, setSelectedFiltro] = useState<string>("todas");
  const categoriasScroll = useDragScroll();

  const [mostrarModalProveedor, setMostrarModalProveedor] = useState(false);
  const [mostrarModalCompra, setMostrarModalCompra] = useState(false);
  const [cargandoFactura, setCargandoFactura] = useState(false);

  const [formProveedor, setFormProveedor] = useState<FormProveedor>(FORM_PROVEEDOR_VACIO);
  const [formCompra, setFormCompra] = useState<FormCompra>(FORM_COMPRA_VACIO);

  const [errorProveedor, setErrorProveedor] = useState("");
  const [errorCompra, setErrorCompra] = useState("");

  const cargarDatos = async () => {
    try {
      const [proveedoresData, comprasData, detallesData, insumosData, categoriasData, unidadesData] = await Promise.all([
        ProveedoresServicio.listar(),
        ProveedoresServicio.listarCompras(),
        ProveedoresServicio.listarDetallesCompra(),
        InventarioServicio.listarInsumos(),
        InventarioServicio.listarCategorias(),
        InventarioServicio.listarUnidades(),
      ]);

      const categoriasMap = new Map((categoriasData || []).map((c) => [c.id, c.nombre]));
      setProveedores(
        (proveedoresData || []).map((p) => ({
          id: p.id_proveedor,
          nombre: p.nombre,
          contacto: p.contacto ?? "",
          telefono: p.telefono ?? "",
          email: p.correo ?? "",
          categoriaSuministro: p.categoria_suministro ?? categoriasMap.get(p.id_categoria_ingrediente ?? -1) ?? "General",
          activo: p.activo ?? true,
        }))
      );

      const detallesPorCompra = new Map<number, Array<{ id_compra: number; id_ingrediente: number; cantidad: number; precio_aplicado: number }>>();
      for (const d of detallesData || []) {
        const arr = detallesPorCompra.get(d.id_compra) || [];
        arr.push(d);
        detallesPorCompra.set(d.id_compra, arr);
      }

      const listaCompras: CompraInsumo[] = [];
      for (const c of comprasData || []) {
        const detalles = detallesPorCompra.get(c.id_compra);
        const facturaStr = c.factura || "";
        let tipo: TipoGasto = "Insumo";
        let conceptoExtra = "";

        if (facturaStr.includes("|")) {
          const partes = facturaStr.split("|");
          conceptoExtra = partes[1]?.trim() || "";
        }

        if (/mantenimiento|reparaci[oó]n|t[eé]cnico/i.test(facturaStr) || /mantenimiento/i.test(conceptoExtra)) {
          tipo = "Mantenimiento";
        } else if (/servicio|luz|agua|gas|energ[ií]a|internet|arriendo/i.test(facturaStr) || /servicio/i.test(conceptoExtra)) {
          tipo = "Servicios";
        } else if (!detalles || detalles.length === 0) {
          tipo = conceptoExtra ? "Otros" : "Insumo";
        }

        const facturaCodigoLimpio = facturaStr.split("|")[0].trim() || `FAC-${String(c.id_compra).padStart(3, "0")}`;

        if (detalles && detalles.length > 0) {
          for (const d of detalles) {
            listaCompras.push({
              id: `${c.id_compra}-${d.id_ingrediente}`,
              id_compra: c.id_compra,
              id_proveedor: c.id_proveedor,
              id_insumo: d.id_ingrediente,
              tipoGasto: tipo,
              concepto: conceptoExtra,
              cantidad: Number(d.cantidad),
              costoTotal: Number(d.cantidad) * Number(d.precio_aplicado),
              fecha: (c.fecha || "").slice(0, 10),
              factura: facturaCodigoLimpio,
            });
          }
        } else {
          listaCompras.push({
            id: `compra-${c.id_compra}`,
            id_compra: c.id_compra,
            id_proveedor: c.id_proveedor,
            id_insumo: undefined,
            tipoGasto: tipo === "Insumo" ? "Otros" : tipo,
            concepto: conceptoExtra || "Gasto Operativo",
            cantidad: 1,
            costoTotal: Number(c.total || 0),
            fecha: (c.fecha || "").slice(0, 10),
            factura: facturaCodigoLimpio,
          });
        }
      }
      setCompras(listaCompras);

      setInsumos(
        (insumosData || []).map((i) => ({
          id: i.id_ingrediente,
          codigo: i.codigo,
          nombre: i.nombre,
          id_unidad: Number(i.id_unidad),
          id_categoria: i.id_categoria_ingrediente ?? 0,
          stock: Number(i.stock),
          minimo: Number(i.stock_minimo),
          maximo: Number(i.stock_maximo ?? 0),
          precioReferencia: Number(i.precio_referencia),
          caducidad: i.caducidad ?? undefined,
        }))
      );

      setCategorias((categoriasData || []).map((c) => ({ id: c.id, nombre: c.nombre })));
      setUnidades(
        (unidadesData || []).map((u) => ({
          id_unidad: Number(u.id),
          nombre: u.nombre,
          abreviatura: u.abreviatura,
          descripcion: u.descripcion ?? "",
          activo: u.activo ?? true,
        }))
      );
    } catch (e) {
      console.warn("No se pudieron cargar proveedores/compras desde el backend:", e);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, []);

  const categoriasProveedorOpciones = useMemo(() => {
    const set = new Set([
      ...CATEGORIAS_PROVEEDOR_PRESET,
      ...categorias.map((c) => c.nombre),
    ]);
    return Array.from(set);
  }, [categorias]);

  const insumosFormFiltrados = useMemo(() => {
    const catId = Number(formCompra.id_categoria);
    return insumos.filter((i) => i.id_categoria === catId);
  }, [insumos, formCompra.id_categoria]);

  const comprasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return compras.filter((c) => {
      const prov = proveedores.find((p) => p.id === c.id_proveedor);
      const ins = c.id_insumo ? insumos.find((i) => i.id === c.id_insumo) : null;

      const matchSearch =
        q === "" ||
        (prov && prov.nombre.toLowerCase().includes(q)) ||
        (ins && ins.nombre.toLowerCase().includes(q)) ||
        (c.concepto && c.concepto.toLowerCase().includes(q)) ||
        c.factura.toLowerCase().includes(q) ||
        c.tipoGasto.toLowerCase().includes(q);

      let matchFilter = true;
      if (selectedFiltro === "todas") {
        matchFilter = true;
      } else if (selectedFiltro.startsWith("tipo:")) {
        const tipoReq = selectedFiltro.replace("tipo:", "");
        matchFilter = c.tipoGasto === tipoReq;
      } else if (selectedFiltro.startsWith("cat:")) {
        const catIdReq = Number(selectedFiltro.replace("cat:", ""));
        matchFilter = Boolean(ins && ins.id_categoria === catIdReq);
      }

      return matchSearch && matchFilter;
    });
  }, [compras, proveedores, insumos, busqueda, selectedFiltro]);

  const abrirModalCompra = async () => {
    setErrorCompra("");
    setCargandoFactura(true);
    setMostrarModalCompra(true);

    try {
      const sigFactura = await ProveedoresServicio.obtenerSiguienteFactura();
      setFormCompra({
        ...FORM_COMPRA_VACIO,
        id_proveedor: proveedores[0]?.id ? String(proveedores[0].id) : "1",
        id_categoria: categorias[0]?.id ? String(categorias[0].id) : "1",
        id_insumo: insumos[0]?.id ? String(insumos[0].id) : "1",
        factura: sigFactura || "FAC-001",
      });
    } catch {
      setFormCompra({
        ...FORM_COMPRA_VACIO,
        id_proveedor: proveedores[0]?.id ? String(proveedores[0].id) : "1",
        id_categoria: categorias[0]?.id ? String(categorias[0].id) : "1",
        id_insumo: insumos[0]?.id ? String(insumos[0].id) : "1",
        factura: "FAC-001",
      });
    } finally {
      setCargandoFactura(false);
    }
  };

  const guardarProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = formProveedor.nombre.trim();
    const contacto = formProveedor.contacto.trim();
    const telefono = formProveedor.telefono.trim();
    const email = formProveedor.email.trim();

    if (!nombre) return setErrorProveedor("El nombre del proveedor es obligatorio.");
    if (proveedores.some((p) => p.nombre.toLowerCase() === nombre.toLowerCase()))
      return setErrorProveedor("Ya existe un proveedor registrado con ese nombre.");

    const categoria = categorias.find((c) => c.nombre === formProveedor.categoriaSuministro);

    try {
      await ProveedoresServicio.crear({
        documento: `PROV-${Date.now().toString().slice(-8)}`,
        nombre,
        contacto: contacto || null,
        telefono: telefono || null,
        correo: email || null,
        id_categoria_ingrediente: categoria?.id ?? null,
        categoria_suministro: formProveedor.categoriaSuministro,
      });
      await cargarDatos();
      setMostrarModalProveedor(false);
      setFormProveedor(FORM_PROVEEDOR_VACIO);
      setErrorProveedor("");
    } catch (err: any) {
      setErrorProveedor(err?.message || "No se pudo guardar el proveedor en el backend.");
    }
  };

  const guardarCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    const id_proveedor = Number(formCompra.id_proveedor);
    const costoTotal = Number(formCompra.costoTotal);
    const fecha = formCompra.fecha;
    const tipo = formCompra.tipoGasto;
    const factura = formCompra.factura.trim();

    if (Number.isNaN(costoTotal) || costoTotal <= 0) {
      return setErrorCompra("Ingresa un costo total válido mayor a $0.");
    }
    if (!proveedores.some((p) => p.id === id_proveedor)) {
      return setErrorCompra("Selecciona un proveedor válido.");
    }

    if (tipo === "Insumo") {
      const id_insumo = Number(formCompra.id_insumo);
      const cantidad = Number(formCompra.cantidad);

      if (Number.isNaN(cantidad) || cantidad <= 0) return setErrorCompra("Ingresa una cantidad válida mayor a 0.");
      if (!id_insumo || !insumos.some((i) => i.id === id_insumo)) return setErrorCompra("Debes seleccionar un insumo válido.");

      try {
        await ProveedoresServicio.crearCompra({
          id_proveedor,
          fecha,
          estado: "RECIBIDA",
          total: costoTotal,
          factura: factura || null,
          detalles: [
            {
              id_ingrediente: id_insumo,
              cantidad,
              precio_aplicado: cantidad > 0 ? costoTotal / cantidad : 0,
            },
          ],
        });
        await cargarDatos();
        setMostrarModalCompra(false);
        setFormCompra(FORM_COMPRA_VACIO);
        setErrorCompra("");
      } catch (err: any) {
        setErrorCompra(err?.message || "No se pudo registrar la compra en el backend.");
      }
    } else {
      const concepto = formCompra.concepto.trim();
      if (!concepto) {
        return setErrorCompra("Ingresa la descripción o concepto del gasto (ej. Mantenimiento freidora, Pago recibo energía).");
      }

      const facturaFinal = factura ? `${factura} | [${tipo}] ${concepto}` : `[${tipo}] ${concepto}`;

      try {
        await ProveedoresServicio.crearCompra({
          id_proveedor,
          fecha,
          estado: "RECIBIDA",
          total: costoTotal,
          factura: facturaFinal,
          detalles: [],
        });
        await cargarDatos();
        setMostrarModalCompra(false);
        setFormCompra(FORM_COMPRA_VACIO);
        setErrorCompra("");
      } catch (err: any) {
        setErrorCompra(err?.message || "No se pudo registrar el gasto en el backend.");
      }
    }
  };

  const eliminarCompra = async (id: number) => {
    if (window.confirm("¿Estás seguro de eliminar este registro de compra o gasto?")) {
      try {
        await ProveedoresServicio.eliminarCompra(id);
        await cargarDatos();
      } catch (err: any) {
        alert(err?.message || "No se pudo eliminar la compra en el backend.");
      }
    }
  };

  // ─── Estilos temáticos para Badges y Filtros ─────────────────────────────────

  const renderBadgeTipo = (tipo: TipoGasto) => {
    switch (tipo) {
      case "Insumo":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 font-semibold whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
            Insumo
          </span>
        );
      case "Mantenimiento":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/50 font-semibold whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
            Mantenimiento
          </span>
        );
      case "Servicios":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-800/50 font-semibold whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0"></span>
            Servicios
          </span>
        );
      case "Otros":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/50 font-semibold whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"></span>
            Otros Gastos
          </span>
        );
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
                    Gastos & Compras Operativas
                  </span>
                </div>
                <p className="hidden sm:block text-[11px] text-[#5BC0DE]/80">
                  Control de compras de insumos, gastos de mantenimiento, servicios y facturación automática
                </p>
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
                Nuevo Proveedor
              </button>
              <button
                type="button"
                onClick={abrirModalCompra}
                className="w-full md:w-auto justify-center bg-[#5BC0DE] hover:bg-[#5BC0DE]/90 text-[#0B132B] px-3 py-2 md:py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Registrar Compra / Gasto
              </button>
            </div>
          </div>
        </header>

        {/* Barra de Búsqueda y Filtros Temáticos */}
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
                placeholder="Buscar por proveedor, insumo, concepto o factura..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="text-xs text-[#5BC0DE] font-medium shrink-0 self-end sm:self-auto flex items-center gap-2">
              <span>Registros:</span>
              <span className="text-[#F4D6B0] font-bold bg-[#0B132B] px-2 py-0.5 rounded-lg border border-[#3A506B]">
                {comprasFiltradas.length}
              </span>
            </div>
          </div>

          {/* Filtro horizontal de Tipos y Categorías */}
          <div className="max-w-7xl mx-auto relative group">
            <div
              ref={categoriasScroll.ref}
              {...categoriasScroll.props}
              className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-0.5 cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:[scrollbar-width:thin] md:[&::-webkit-scrollbar]:block md:[&::-webkit-scrollbar]:h-1.5 md:[&::-webkit-scrollbar-thumb]:rounded-full md:[&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]"
            >
              <span className="text-[10px] sm:text-[11px] font-bold text-[#5BC0DE] uppercase shrink-0 flex items-center gap-1 mr-1">
                Filtros:
              </span>
              <button
                type="button"
                onClick={() => setSelectedFiltro("todas")}
                className={`px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition-all border shrink-0 ${
                  selectedFiltro === "todas"
                    ? "bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow-sm"
                    : "bg-[#0B132B] text-[#5BC0DE] border-[#3A506B] hover:border-[#5BC0DE]"
                }`}
              >
                Todos ({compras.length})
              </button>

              {/* Botones por Tipo con Temática de Colores */}
              {[
                { id: "tipo:Insumo", label: "Insumos", tipo: "Insumo", activeBg: "bg-emerald-600 border-emerald-500 text-white shadow-md", inactive: "text-emerald-400 bg-[#0B132B] border-[#3A506B] hover:border-emerald-500/50" },
                { id: "tipo:Mantenimiento", label: "Mantenimiento", tipo: "Mantenimiento", activeBg: "bg-amber-600 border-amber-500 text-white shadow-md", inactive: "text-amber-400 bg-[#0B132B] border-[#3A506B] hover:border-amber-500/50" },
                { id: "tipo:Servicios", label: "Servicios", tipo: "Servicios", activeBg: "bg-sky-600 border-sky-500 text-white shadow-md", inactive: "text-sky-400 bg-[#0B132B] border-[#3A506B] hover:border-sky-500/50" },
                { id: "tipo:Otros", label: "Otros Gastos", tipo: "Otros", activeBg: "bg-purple-600 border-purple-500 text-white shadow-md", inactive: "text-purple-400 bg-[#0B132B] border-[#3A506B] hover:border-purple-500/50" },
              ].map((f) => {
                const count = compras.filter((c) => c.tipoGasto === f.tipo).length;
                const isSelected = selectedFiltro === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFiltro(f.id)}
                    className={`px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0 ${
                      isSelected ? f.activeBg : f.inactive
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-[#1C2541] text-inherit"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}

              <span className="text-[#3A506B] mx-1 hidden sm:inline">|</span>

              {/* Categorías de Insumos */}
              {categorias.map((cat) => {
                const count = compras.filter((c) => {
                  const ins = c.id_insumo ? insumos.find((i) => i.id === c.id_insumo) : null;
                  return ins && ins.id_categoria === cat.id;
                }).length;
                const isSelected = selectedFiltro === `cat:${cat.id}`;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedFiltro(`cat:${cat.id}`)}
                    className={`px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? "bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow-sm"
                        : "bg-[#0B132B] text-[#5BC0DE] border-[#3A506B] hover:border-[#5BC0DE]"
                    }`}
                  >
                    <span>{cat.nombre}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isSelected ? "bg-[#1C2541] text-[#5BC0DE]" : "bg-[#1C2541] text-[#5BC0DE]/70"}`}>
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
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 overflow-y-auto overflow-x-hidden pb-[calc(6rem+env(safe-area-inset-bottom))] flex flex-col [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50 [&::-webkit-scrollbar-thumb]:rounded-full">
        <section className="bg-[#1C2541] border border-[#3A506B] rounded-2xl shadow-sm flex-1 flex flex-col">
          
          {/* VISTA ESCRITORIO: TABLA */}
          <div className="hidden md:block overflow-x-auto w-full p-2">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead className="sticky top-0 z-30 bg-[#1C2541]">
                <tr className="text-[#5BC0DE] text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 bg-[#1C2541] first:rounded-l-xl">Fecha / Factura</th>
                  <th className="py-3 px-4 bg-[#1C2541]">Tipo</th>
                  <th className="py-3 px-4 bg-[#1C2541]">Proveedor</th>
                  <th className="py-3 px-4 bg-[#1C2541]">Insumo o Concepto</th>
                  <th className="py-3 px-4 bg-[#1C2541]">Categoría</th>
                  <th className="py-3 px-4 bg-[#1C2541]">Cant.</th>
                  <th className="py-3 px-4 bg-[#1C2541]">Costo Total</th>
                  <th className="py-3 px-4 bg-[#1C2541] text-right last:rounded-r-xl">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {comprasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#5BC0DE]/60 bg-[#0B132B] rounded-xl border border-[#3A506B]">
                      <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {busqueda || selectedFiltro !== "todas" ? "Ningún registro coincide con los filtros." : "Aún no hay compras ni gastos registrados."}
                    </td>
                  </tr>
                ) : (
                  comprasFiltradas.map((c) => {
                    const prov = proveedores.find((p) => p.id === c.id_proveedor);
                    const ins = c.id_insumo ? insumos.find((i) => i.id === c.id_insumo) : null;
                    const uni = ins ? unidades.find((u) => u.id_unidad === ins.id_unidad) : null;
                    const cat = ins ? categorias.find((catId) => catId.id === ins.id_categoria) : null;

                    return (
                      <tr key={c.id} className="group">
                        <td className="py-3 px-4 bg-[#0B132B] border-y border-l border-[#3A506B]/60 rounded-l-xl group-hover:bg-[#152036] transition-all">
                          <div className="font-mono text-xs text-[#F4D6B0] font-semibold">{c.fecha}</div>
                          <span className="text-[10px] font-mono text-[#5BC0DE] font-medium">{c.factura}</span>
                        </td>
                        <td className="py-3 px-4 bg-[#0B132B] border-y border-[#3A506B]/60 group-hover:bg-[#152036] transition-all">
                          {renderBadgeTipo(c.tipoGasto)}
                        </td>
                        <td className="py-3 px-4 bg-[#0B132B] border-y border-[#3A506B]/60 group-hover:bg-[#152036] transition-all">
                          <div className="font-semibold text-[#F4D6B0] text-xs">{prov ? prov.nombre : "Proveedor #" + c.id_proveedor}</div>
                          <span className="text-[10px] text-[#5BC0DE]">{prov ? prov.telefono || prov.email : ""}</span>
                        </td>
                        <td className="py-3 px-4 bg-[#0B132B] border-y border-[#3A506B]/60 group-hover:bg-[#152036] transition-all">
                          {c.tipoGasto === "Insumo" ? (
                            <>
                              <div className="text-xs font-semibold text-[#F4D6B0]">{ins ? ins.nombre : "Insumo #" + c.id_insumo}</div>
                              {ins?.codigo && <span className="text-[10px] font-mono text-[#5BC0DE]">{ins.codigo}</span>}
                            </>
                          ) : (
                            <>
                              <div className="text-xs font-semibold text-[#F4D6B0]">{c.concepto || "Gasto Operativo"}</div>
                              <span className="text-[10px] text-[#5BC0DE]/80">{c.tipoGasto}</span>
                            </>
                          )}
                        </td>
                        <td className="py-3 px-4 bg-[#0B132B] border-y border-[#3A506B]/60 group-hover:bg-[#152036] transition-all">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1C2541] text-[#5BC0DE] border border-[#3A506B] whitespace-nowrap">
                            {cat ? cat.nombre : c.tipoGasto === "Mantenimiento" ? "Mantenimiento" : c.tipoGasto === "Servicios" ? "Servicios Públicos" : "General"}
                          </span>
                        </td>
                        <td className="py-3 px-4 bg-[#0B132B] border-y border-[#3A506B]/60 group-hover:bg-[#152036] transition-all">
                          <div className="font-mono text-xs text-[#F4D6B0] font-bold">
                            {c.tipoGasto === "Insumo" ? (
                              <>{c.cantidad} <span className="lowercase text-[#5BC0DE] font-normal">{uni ? uni.abreviatura : "ud"}</span></>
                            ) : (
                              <span className="text-[#5BC0DE] font-normal text-[11px]">1 servicio</span>
                            )}
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
                            onClick={() => eliminarCompra(c.id_compra)}
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

          {/* VISTA MÓVIL: TARJETAS MEJORADAS */}
          <div className="md:hidden p-3 space-y-3">
            {comprasFiltradas.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#5BC0DE]/60">
                <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                No se encontraron compras ni gastos.
              </div>
            ) : (
              comprasFiltradas.map((c) => {
                const prov = proveedores.find((p) => p.id === c.id_proveedor);
                const ins = c.id_insumo ? insumos.find((i) => i.id === c.id_insumo) : null;
                const uni = ins ? unidades.find((u) => u.id_unidad === ins.id_unidad) : null;
                const cat = ins ? categorias.find((catId) => catId.id === ins.id_categoria) : null;

                return (
                  <div key={c.id} className="bg-[#0B132B] border border-[#3A506B] rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-sm">
                    {/* Cabecera: Factura, Tipo y Monto */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 pr-1 flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#5BC0DE] truncate">{c.factura}</span>
                          {renderBadgeTipo(c.tipoGasto)}
                        </div>
                        <span className="text-[10px] text-[#F4D6B0]/70">{c.fecha}</span>
                      </div>
                      <span className="shrink-0 font-mono font-bold text-emerald-400 text-sm">
                        ${c.costoTotal.toLocaleString()}
                      </span>
                    </div>

                    {/* Proveedor e Insumo / Concepto */}
                    <div className="flex flex-col gap-1.5 text-[11px] mt-1 border-t border-[#3A506B]/50 pt-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#5BC0DE] font-semibold shrink-0">Proveedor:</span>
                        <span className="text-[#F4D6B0] font-medium text-right truncate">
                          {prov ? prov.nombre : "Prov #" + c.id_proveedor}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#5BC0DE] font-semibold shrink-0">
                          {c.tipoGasto === "Insumo" ? "Insumo:" : "Concepto:"}
                        </span>
                        <span className="text-[#F4D6B0] font-medium text-right truncate">
                          {c.tipoGasto === "Insumo"
                            ? `${ins ? ins.nombre : "Insumo #" + c.id_insumo} (${c.cantidad} ${uni?.abreviatura || "ud"})`
                            : c.concepto || "Gasto Operativo"}
                        </span>
                      </div>
                    </div>

                    {/* Categoría y Acciones */}
                    <div className="flex items-center justify-between border-t border-[#3A506B]/50 pt-2.5 mt-1">
                      <span className="text-[10px] px-2 py-0.5 bg-[#1C2541] rounded-md text-[#5BC0DE] border border-[#3A506B] font-semibold truncate max-w-[75%]">
                        {cat ? cat.nombre : c.tipoGasto === "Mantenimiento" ? "Mantenimiento" : c.tipoGasto === "Servicios" ? "Servicios" : "General"}
                      </span>
                      <button
                        type="button"
                        className="bg-[#D97706]/10 hover:bg-[#D97706]/20 text-[#D97706] p-1.5 rounded-lg active:scale-95 transition-colors shrink-0"
                        onClick={() => eliminarCompra(c.id_compra)}
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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-full overflow-hidden">
            <div className="bg-[#0B132B] p-3 sm:p-5 border-b border-[#3A506B] flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-[#F4D6B0] flex items-center gap-2 text-sm sm:text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5BC0DE]"></span>
                Nuevo Proveedor
              </h3>
              <button
                type="button"
                onClick={() => {
                  setMostrarModalProveedor(false);
                  setErrorProveedor("");
                  setFormProveedor(FORM_PROVEEDOR_VACIO);
                }}
                className="p-2 shrink-0 rounded-xl text-[#5BC0DE] hover:text-[#F4D6B0] hover:bg-[#3A506B] transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarProveedor} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50">
                {errorProveedor && (
                  <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs p-3 rounded-xl font-semibold">
                    {errorProveedor}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#5BC0DE]">Nombre del Proveedor *</label>
                  <input
                    placeholder="Ej. Distribuidora Cárnica"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors"
                    value={formProveedor.nombre}
                    onChange={(e) => setFormProveedor({ ...formProveedor, nombre: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#5BC0DE]">Persona de Contacto</label>
                  <input
                    placeholder="Ej. Juan Pérez"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors"
                    value={formProveedor.contacto}
                    onChange={(e) => setFormProveedor({ ...formProveedor, contacto: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#5BC0DE]">Teléfono</label>
                    <input
                      placeholder="3001234567"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono transition-colors"
                      value={formProveedor.telefono}
                      onChange={(e) => setFormProveedor({ ...formProveedor, telefono: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#5BC0DE]">Categoría Suministro</label>
                    <select
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors"
                      value={formProveedor.categoriaSuministro}
                      onChange={(e) => setFormProveedor({ ...formProveedor, categoriaSuministro: e.target.value })}
                    >
                      {categoriasProveedorOpciones.map((cat) => (
                        <option key={cat} value={cat} className="bg-[#0B132B] text-[#F4D6B0]">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#5BC0DE]">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="contacto@proveedor.com"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors"
                    value={formProveedor.email}
                    onChange={(e) => setFormProveedor({ ...formProveedor, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="shrink-0 p-3 sm:p-5 bg-[#0B132B] border-t border-[#3A506B] flex justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  className="flex-1 sm:flex-none px-4 h-[42px] rounded-xl bg-[#3A506B] text-[#F4D6B0] hover:bg-[#3A506B]/80 text-xs font-bold transition-colors"
                  onClick={() => {
                    setMostrarModalProveedor(false);
                    setErrorProveedor("");
                    setFormProveedor(FORM_PROVEEDOR_VACIO);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-4 h-[42px] rounded-xl bg-[#5BC0DE] hover:bg-[#4CA8C4] text-[#0B132B] font-bold text-xs shadow-md transition-colors"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Registrar Compra / Gasto */}
      {mostrarModalCompra && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-full overflow-hidden">
            <div className="bg-[#0B132B] p-3 sm:p-5 border-b border-[#3A506B] flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-[#F4D6B0] flex items-center gap-2 text-sm sm:text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5BC0DE]"></span>
                Registrar Compra o Gasto
              </h3>
              <button
                type="button"
                onClick={() => {
                  setMostrarModalCompra(false);
                  setErrorCompra("");
                  setFormCompra(FORM_COMPRA_VACIO);
                }}
                className="p-2 shrink-0 rounded-xl text-[#5BC0DE] hover:text-[#F4D6B0] hover:bg-[#3A506B] transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarCompra} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50">
                {errorCompra && (
                  <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs p-3 rounded-xl font-semibold">
                    {errorCompra}
                  </div>
                )}

                {/* Selector Tipo de Registro / Gasto con Colores */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#5BC0DE]">Tipo de Registro *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { id: "Insumo", label: "Insumo", icon: "text-emerald-400", active: "bg-emerald-600 border-emerald-500 text-white shadow-md" },
                      { id: "Mantenimiento", label: "Mantenimiento", icon: "text-amber-400", active: "bg-amber-600 border-amber-500 text-white shadow-md" },
                      { id: "Servicios", label: "Servicios", icon: "text-sky-400", active: "bg-sky-600 border-sky-500 text-white shadow-md" },
                      { id: "Otros", label: "Otros", icon: "text-purple-400", active: "bg-purple-600 border-purple-500 text-white shadow-md" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFormCompra({ ...formCompra, tipoGasto: t.id as TipoGasto })}
                        className={`py-2 px-1 text-[10px] sm:text-xs font-bold rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          formCompra.tipoGasto === t.id
                            ? t.active
                            : `bg-[#0B132B] border-[#3A506B] ${t.icon} hover:bg-[#1C2541]`
                        }`}
                      >
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#5BC0DE]">Proveedor *</label>
                    <select
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors"
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

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#5BC0DE]">Fecha *</label>
                    <input
                      type="date"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono transition-colors"
                      value={formCompra.fecha}
                      onChange={(e) => setFormCompra({ ...formCompra, fecha: e.target.value })}
                    />
                  </div>
                </div>

                {formCompra.tipoGasto === "Insumo" ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-[#5BC0DE]">Categoría</label>
                        <select
                          className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors"
                          value={formCompra.id_categoria}
                          onChange={(e) => setFormCompra({ ...formCompra, id_categoria: e.target.value })}
                        >
                          {categorias.map((c) => (
                            <option key={c.id} value={c.id} className="bg-[#0B132B] text-[#F4D6B0]">
                              {c.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-[#5BC0DE]">Insumo *</label>
                        <select
                          className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors"
                          value={formCompra.id_insumo}
                          onChange={(e) => setFormCompra({ ...formCompra, id_insumo: e.target.value })}
                        >
                          {insumosFormFiltrados.map((i) => (
                            <option key={i.id} value={i.id} className="bg-[#0B132B] text-[#F4D6B0]">
                              {i.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-[#5BC0DE]">Cantidad *</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="0"
                          className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono transition-colors"
                          value={formCompra.cantidad}
                          onChange={(e) => setFormCompra({ ...formCompra, cantidad: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-[#5BC0DE]">Costo Total ($) *</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="0"
                          className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono text-emerald-400 font-bold transition-colors"
                          value={formCompra.costoTotal}
                          onChange={(e) => setFormCompra({ ...formCompra, costoTotal: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#5BC0DE]">Concepto / Descripción del Gasto *</label>
                    <input
                      type="text"
                      placeholder="Ej. Mantenimiento freidora, Pago recibo energía..."
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors"
                      value={formCompra.concepto}
                      onChange={(e) => setFormCompra({ ...formCompra, concepto: e.target.value })}
                    />
                    <div className="flex flex-col gap-1.5 mt-2">
                      <label className="text-[11px] font-bold text-[#5BC0DE]">Costo Total ($) *</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="0"
                        className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono text-emerald-400 font-bold transition-colors"
                        value={formCompra.costoTotal}
                        onChange={(e) => setFormCompra({ ...formCompra, costoTotal: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#5BC0DE]">N° Factura / Comprobante (Opcional)</label>
                  <input
                    placeholder="FAC-001"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono transition-colors"
                    value={formCompra.factura}
                    onChange={(e) => setFormCompra({ ...formCompra, factura: e.target.value })}
                  />
                </div>
              </div>

              <div className="shrink-0 p-3 sm:p-5 bg-[#0B132B] border-t border-[#3A506B] flex justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  className="flex-1 sm:flex-none px-4 h-[42px] rounded-xl bg-[#3A506B] text-[#F4D6B0] hover:bg-[#3A506B]/80 text-xs font-bold transition-colors"
                  onClick={() => {
                    setMostrarModalCompra(false);
                    setErrorCompra("");
                    setFormCompra(FORM_COMPRA_VACIO);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargandoFactura}
                  className="flex-1 sm:flex-none px-4 h-[42px] rounded-xl bg-[#5BC0DE] hover:bg-[#4CA8C4] text-[#0B132B] font-bold text-xs shadow-md transition-colors disabled:opacity-50"
                >
                  {cargandoFactura ? "Cargando..." : "Guardar Registro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}