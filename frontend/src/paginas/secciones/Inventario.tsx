import { useRef } from "react";
import {
  useInventario,
  calcularEstadoInsumo,
  type Insumo,
  type UnidadMedida,
} from "./hooks/useInventario";

// ─── Helper visual puro: drag-scroll para la barra de categorías ──────────────

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

// ─── Helper visual puro: formateo de precio para display ─────────────────────

function formatPrecio(precio?: number) {
  if (!precio) return null;
  return `$${precio.toLocaleString()}`;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Inventario() {
  const {
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
  } = useInventario();

  const categoriasScroll = useDragScroll();

  // ── Pantalla de carga / error ───────────────────────────────────────────────

  if (cargando) {
    return (
      <div className="h-[100dvh] sm:h-full w-full bg-[#0B132B] text-[#F4D6B0] flex items-center justify-center">
        <span className="text-[#5BC0DE] text-sm animate-pulse font-bold">Cargando inventario...</span>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="h-[100dvh] sm:h-full w-full bg-[#0B132B] text-[#F4D6B0] flex items-center justify-center p-6">
        <div className="bg-red-950/80 border border-red-800 text-red-300 text-sm p-4 rounded-2xl max-w-md text-center shadow-lg">
          {errorCarga}
        </div>
      </div>
    );
  }

  // ── Render principal ────────────────────────────────────────────────────────

  return (
    <div className="h-[100dvh] sm:h-full w-full bg-[#0B132B] text-[#F4D6B0] font-sans antialiased flex flex-col overflow-hidden">

      {/* ── Header Fijo ── */}
      <div className="shrink-0 w-full flex flex-col z-50 bg-[#0B132B] pt-[max(0.5rem,env(safe-area-inset-top))]">
        <header className="bg-[#1C2541] border-b border-[#3A506B] px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-[#3A506B]/40 border border-[#5BC0DE]/30 text-[#5BC0DE] shrink-0 shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[#F4D6B0] truncate">Gestión de Inventario</h2>
                  <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#3A506B]/40 text-[#5BC0DE] border border-[#5BC0DE]/30 font-mono font-semibold">
                    Insumos &amp; Stock
                  </span>
                </div>
                <p className="hidden sm:block text-[11px] text-[#5BC0DE] mt-0.5">Control de existencias, precios de referencia, categorías y unidades de medida</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto">
              <button
                type="button"
                onClick={abrirModalCategoria}
                className="flex-1 md:flex-none justify-center bg-[#0B132B] hover:bg-[#3A506B]/50 text-[#5BC0DE] hover:text-[#F4D6B0] border border-[#3A506B] px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap h-[42px]"
              >
                <svg className="w-4 h-4 text-[#5BC0DE]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Categorías
              </button>
              <button
                type="button"
                onClick={() => setMostrarModalUnidad(true)}
                className="flex-1 md:flex-none justify-center bg-[#0B132B] hover:bg-[#3A506B]/50 text-[#5BC0DE] hover:text-[#F4D6B0] border border-[#3A506B] px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap h-[42px]"
              >
                <svg className="w-4 h-4 text-[#5BC0DE]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Unidad
              </button>
              <button
                type="button"
                onClick={abrirCrearInsumo}
                className="w-full md:w-auto justify-center bg-[#5BC0DE] hover:bg-[#4CA8C4] text-[#0B132B] px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap h-[42px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Insumo
              </button>
            </div>
          </div>
        </header>

        {/* ── Barra de Búsqueda y Filtros ── */}
        <div className="bg-[#1C2541] px-3 sm:px-4 lg:px-6 py-3 border-b border-[#3A506B] space-y-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#5BC0DE]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                className="w-full bg-[#0B132B] border border-[#3A506B] rounded-xl pl-9 pr-3 py-2.5 text-base sm:text-xs text-[#F4D6B0] placeholder-[#5BC0DE]/50 focus:outline-none focus:border-[#5BC0DE] transition-colors"
                placeholder="Buscar ingrediente por nombre o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="text-xs text-[#5BC0DE] font-bold shrink-0 self-end sm:self-auto flex items-center gap-2">
              <span>Insumos:</span>
              <span className="text-[#F4D6B0] bg-[#0B132B] px-2.5 py-1 rounded-lg border border-[#3A506B]">
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
                className={`px-3.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition-all border shrink-0 ${
                  selectedCategoria === 'todas'
                    ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow-sm'
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
                    className={`px-3.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-[#5BC0DE] text-[#0B132B] border-[#5BC0DE] shadow-sm'
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

      {/* ── Contenido Principal ── */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 overflow-y-auto overflow-x-hidden pb-[calc(6rem+env(safe-area-inset-bottom))] flex flex-col min-h-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50 [&::-webkit-scrollbar-thumb]:rounded-full">
        <section className="bg-[#1C2541] border border-[#3A506B] rounded-2xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* VISTA ESCRITORIO: TABLA */}
          <div className="hidden md:block overflow-auto relative flex-1 [scrollbar-width:thin] [scrollbar-color:#5BC0DE_#0B132B]">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-30 bg-[#1C2541] shadow-sm border-b border-[#3A506B]">
                <tr className="text-[#5BC0DE] text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 bg-[#1C2541]">Ingrediente / Código</th>
                  <th className="py-3.5 px-4 bg-[#1C2541]">Categoría</th>
                  <th className="py-3.5 px-4 bg-[#1C2541]">Precio Ref.</th>
                  <th className="py-3.5 px-4 bg-[#1C2541]">Caducidad</th>
                  <th className="py-3.5 px-4 bg-[#1C2541]">Stock Actual</th>
                  <th className="py-3.5 px-4 bg-[#1C2541]">Estado</th>
                  <th className="py-3.5 px-4 text-right bg-[#1C2541]">Acciones</th>
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
                              className="bg-[#5BC0DE] text-[#0B132B] font-bold px-4 py-2 rounded-xl text-xs hover:bg-[#4CA8C4] transition shadow-sm"
                            >
                              + Crear Primer Insumo
                            </button>
                            <button
                              type="button"
                              onClick={() => void sembrarInsumosIniciales()}
                              disabled={sembrando}
                              className="bg-[#3A506B]/50 hover:bg-[#3A506B] text-[#F4D6B0] font-bold px-4 py-2 rounded-xl text-xs transition border border-[#3A506B]"
                            >
                              {sembrando ? "Cargando insumos..." : "Cargar Insumos Sugeridos"}
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtrados.map((i: Insumo) => {
                    const { porcentaje, abreviatura, texto, estadoBadge, barraColor } = calcularEstadoInsumo(i, unidades as UnidadMedida[]);
                    const catObj = categorias.find((c) => c.id === i.id_categoria);
                    return (
                      <tr key={i.id} className="hover:bg-[#3A506B]/20 transition-colors group">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#F4D6B0]">{i.nombre}</div>
                          {i.codigo && <span className="text-[11px] text-[#5BC0DE] font-mono">{i.codigo}</span>}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#5BC0DE] font-semibold">{catObj ? catObj.nombre : "General"}</td>
                        <td className="py-3 px-4 text-xs font-mono font-bold text-emerald-400">
                          {formatPrecio(i.precioReferencia) ?? <span className="text-[#5BC0DE]/40">--</span>}
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
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${estadoBadge}`}>
                            {texto}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="flex items-center bg-[#0B132B] border border-[#3A506B] rounded-lg p-0.5 mr-1">
                              <button
                                type="button"
                                className="w-7 h-7 text-[#5BC0DE] hover:bg-[#3A506B] rounded-md flex items-center justify-center font-bold text-sm disabled:opacity-30 transition-colors"
                                onClick={() => cambiarStock(i.id, i.stock - 1)}
                                disabled={i.stock <= 0}
                              >−</button>
                              <span className="px-2 font-mono text-xs text-[#F4D6B0] font-bold">{i.stock}</span>
                              <button
                                type="button"
                                className="w-7 h-7 text-[#5BC0DE] hover:bg-[#3A506B] rounded-md flex items-center justify-center font-bold text-sm transition-colors"
                                onClick={() => cambiarStock(i.id, i.stock + 1)}
                              >+</button>
                            </div>
                            <button
                              type="button"
                              className="bg-[#5BC0DE]/10 hover:bg-[#5BC0DE]/20 text-[#5BC0DE] p-2 rounded-lg transition-colors"
                              onClick={() => abrirEditarInsumo(i)}
                              title="Editar insumo"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="bg-[#D97706]/10 hover:bg-[#D97706]/20 text-[#D97706] p-2 rounded-lg transition-colors"
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
          <div className="md:hidden p-3 space-y-3">
            {filtrados.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#5BC0DE]/60">
                <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
                </svg>
                {busqueda || selectedCategoria !== 'todas' ? (
                  "Ningún insumo coincide con los filtros."
                ) : (
                  <div className="flex flex-col items-center gap-3 px-4">
                    <p className="text-xs text-[#F4D6B0]">Aún no hay insumos registrados.</p>
                    <button
                      type="button"
                      onClick={abrirCrearInsumo}
                      className="w-full bg-[#5BC0DE] text-[#0B132B] font-bold px-3 py-2.5 rounded-xl text-xs hover:bg-[#4CA8C4] transition shadow-sm h-[42px]"
                    >
                      + Crear Primer Insumo
                    </button>
                    <button
                      type="button"
                      onClick={() => void sembrarInsumosIniciales()}
                      disabled={sembrando}
                      className="w-full bg-[#3A506B]/50 hover:bg-[#3A506B] text-[#F4D6B0] font-bold px-3 py-2.5 rounded-xl text-xs transition border border-[#3A506B] h-[42px]"
                    >
                      {sembrando ? "Cargando..." : "Cargar Insumos Sugeridos"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              filtrados.map((i: Insumo) => {
                const { porcentaje, abreviatura, texto, estadoBadge, barraColor } = calcularEstadoInsumo(i, unidades as UnidadMedida[]);
                const catObj = categorias.find((c) => c.id === i.id_categoria);
                return (
                  <div key={i.id} className="bg-[#0B132B] border border-[#3A506B] rounded-2xl p-3.5 flex flex-col gap-3 shadow-sm">
                    {/* Cabecera Tarjeta */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="block font-bold text-sm text-[#F4D6B0] break-words leading-tight">{i.nombre}</span>
                        <span className="block text-[10px] text-[#5BC0DE] font-mono mt-0.5">{i.codigo || 'Sin código'}</span>
                        
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="text-[10px] text-[#5BC0DE] bg-[#1C2541] px-1.5 py-0.5 rounded-md border border-[#3A506B]">
                            {catObj ? catObj.nombre : "General"}
                          </span>
                          {i.precioReferencia ? (
                            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                              Ref: ${i.precioReferencia.toLocaleString()}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <span className={`shrink-0 px-2 py-1 rounded-lg border text-[10px] font-bold ${estadoBadge}`}>
                        {texto}
                      </span>
                    </div>

                    {/* Caducidad y Barra */}
                    <div>
                      <div className="flex justify-between items-center text-[10px] mb-1.5">
                        <span className="text-[#5BC0DE]">Caduca: <span className="text-[#F4D6B0] font-mono">{i.caducidad || 'N/A'}</span></span>
                        <span className="text-[#F4D6B0] font-mono">{i.stock} {abreviatura} ({porcentaje}%)</span>
                      </div>
                      <div className="w-full bg-[#1C2541] rounded-full h-2 overflow-hidden border border-[#3A506B]">
                        <div className={`h-full transition-all duration-300 rounded-full ${barraColor}`} style={{ width: `${porcentaje}%` }} />
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center justify-between border-t border-[#3A506B]/60 pt-3 mt-1">
                      <div className="flex items-center gap-1 bg-[#1C2541] p-0.5 rounded-xl border border-[#3A506B]">
                        <button
                          type="button"
                          className="w-8 h-8 text-[#5BC0DE] hover:bg-[#3A506B] rounded-lg flex items-center justify-center font-bold text-lg transition disabled:opacity-30 active:scale-95"
                          onClick={() => cambiarStock(i.id, i.stock - 1)}
                          disabled={i.stock <= 0}
                        >−</button>
                        <input
                          type="number"
                          min={0}
                          className="w-12 h-8 bg-[#0B132B] text-[#F4D6B0] text-center rounded-lg text-xs font-bold font-mono focus:outline-none focus:border-[#5BC0DE] border border-transparent focus:border"
                          value={i.stock}
                          onChange={(e) => cambiarStock(i.id, Number(e.target.value))}
                        />
                        <button
                          type="button"
                          className="w-8 h-8 text-[#5BC0DE] hover:bg-[#3A506B] rounded-lg flex items-center justify-center font-bold text-lg transition active:scale-95"
                          onClick={() => cambiarStock(i.id, i.stock + 1)}
                        >+</button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="bg-[#5BC0DE]/10 hover:bg-[#5BC0DE]/20 text-[#5BC0DE] p-2 rounded-xl transition-colors"
                          onClick={() => abrirEditarInsumo(i)}
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="bg-[#D97706]/10 hover:bg-[#D97706]/20 text-[#D97706] p-2 rounded-xl transition-colors"
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

      {/* ── MODAL: Registrar / Editar Insumo ── */}
      {mostrarForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-full overflow-hidden">

            <div className="bg-[#0B132B] p-3 sm:p-5 border-b border-[#3A506B] flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-[#F4D6B0] flex items-center gap-2 text-sm sm:text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5BC0DE]"></span>
                {insumoEditando ? "Editar Insumo" : "Registrar Nuevo Insumo"}
              </h3>
              <button
                type="button"
                onClick={cerrarForm}
                className="p-2 shrink-0 rounded-xl text-[#5BC0DE] hover:text-[#F4D6B0] hover:bg-[#3A506B] transition-colors"
              >✕</button>
            </div>

            <form onSubmit={guardarInsumo} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50">
                {error && (
                  <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs p-3 rounded-xl font-semibold">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="ins-codigo" className="text-[11px] font-bold text-[#5BC0DE]">Código del Insumo</label>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-mono font-bold bg-[#5BC0DE]/15 text-[#5BC0DE] border border-[#5BC0DE]/30">
                        {insumoEditando ? "Identificador" : "Automático"}
                      </span>
                    </div>
                    <input
                      id="ins-codigo"
                      placeholder="Ej. ING-015"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm font-mono focus:outline-none focus:border-[#5BC0DE] transition-colors"
                      value={form.codigo}
                      onChange={(e) => cambiarCampo("codigo", e.target.value.toUpperCase())}
                    />
                    <span className="text-[10px] text-[#5BC0DE]/70">
                      Código correlativo automático. Puedes personalizarlo si lo requieres.
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ins-nombre" className="text-[11px] font-bold text-[#5BC0DE]">Nombre del Insumo *</label>
                    <input
                      id="ins-nombre"
                      placeholder="Ej. Tomate triturado"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors"
                      value={form.nombre}
                      onChange={(e) => cambiarCampo("nombre", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ins-categoria" className="text-[11px] font-bold text-[#5BC0DE] flex justify-between items-center">
                      <span>Categoría de Insumo</span>
                      <button type="button" onClick={abrirModalCategoria} className="text-[10px] text-[#5BC0DE] hover:underline font-semibold">
                        + Gestionar
                      </button>
                    </label>
                    <select
                      id="ins-categoria"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors"
                      value={form.id_categoria}
                      onChange={(e) => cambiarCampo("id_categoria", e.target.value)}
                    >
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-[#0B132B] text-[#F4D6B0]">{cat.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ins-unidad" className="text-[11px] font-bold text-[#5BC0DE] flex justify-between items-center">
                      <span>Unidad de Medida</span>
                      <button type="button" onClick={() => setMostrarModalUnidad(true)} className="text-[10px] text-[#5BC0DE] hover:underline font-semibold">+ Agregar</button>
                    </label>
                    <select
                      id="ins-unidad"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors"
                      value={form.id_unidad}
                      onChange={(e) => cambiarCampo("id_unidad", e.target.value)}
                    >
                      {unidades.map((u) => (
                        <option key={u.id_unidad} value={u.id_unidad} className="bg-[#0B132B] text-[#F4D6B0]">{u.nombre} ({u.abreviatura})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ins-precio" className="text-[11px] font-bold text-[#5BC0DE]">
                      Precio / Costo de Referencia ($) *
                    </label>
                    <input
                      id="ins-precio"
                      type="number"
                      min={0}
                      placeholder="Ej. 12000"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono text-emerald-400 font-bold transition-colors"
                      value={form.precioReferencia}
                      onChange={(e) => cambiarCampo("precioReferencia", e.target.value)}
                    />
                    <span className="text-[10px] text-[#5BC0DE]/70">
                      Costo estimado por unidad para costeo y recetas.
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ins-caducidad" className="text-[11px] font-bold text-[#5BC0DE]">Fecha de Caducidad</label>
                    <input
                      id="ins-caducidad"
                      type="date"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono transition-colors"
                      value={form.caducidad}
                      onChange={(e) => cambiarCampo("caducidad", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ins-stock" className="text-[11px] font-bold text-[#5BC0DE]">Stock Actual *</label>
                    <input
                      id="ins-stock"
                      type="number"
                      min={0}
                      placeholder="0"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono transition-colors"
                      value={form.stock}
                      onChange={(e) => cambiarCampo("stock", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ins-min" className="text-[11px] font-bold text-[#5BC0DE]">Stock Mínimo *</label>
                    <input
                      id="ins-min"
                      type="number"
                      min={0}
                      placeholder="5"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono transition-colors"
                      value={form.minimo}
                      onChange={(e) => cambiarCampo("minimo", e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor="ins-max" className="text-[11px] font-bold text-[#5BC0DE]">Stock Máximo *</label>
                    <input
                      id="ins-max"
                      type="number"
                      min={1}
                      placeholder="50"
                      className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono transition-colors"
                      value={form.maximo}
                      onChange={(e) => cambiarCampo("maximo", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="shrink-0 p-3 sm:p-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[#0B132B] border-t border-[#3A506B] flex justify-end gap-2 sm:gap-3 z-10">
                <button
                  type="button"
                  className="flex-1 sm:flex-none px-4 h-[42px] rounded-xl bg-[#3A506B] text-[#F4D6B0] hover:bg-[#3A506B]/80 text-xs font-bold transition-colors"
                  onClick={cerrarForm}
                >Cancelar</button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-5 h-[42px] rounded-xl bg-[#5BC0DE] hover:bg-[#4CA8C4] text-[#0B132B] font-bold text-xs shadow-md transition-colors"
                >{insumoEditando ? "Guardar Cambios" : "Guardar Insumo"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Gestionar Categorías ── */}
      {mostrarModalCategoria && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-full">
            <div className="bg-[#0B132B] p-3 sm:p-5 border-b border-[#3A506B] flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-[#F4D6B0] flex items-center gap-2 text-sm sm:text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5BC0DE]"></span>
                Gestionar Categorías
              </h3>
              <button
                type="button"
                onClick={cerrarModalCategoria}
                className="p-2 shrink-0 rounded-xl text-[#5BC0DE] hover:text-[#F4D6B0] hover:bg-[#3A506B] transition-colors"
              >✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50">
              {errorCategoria && (
                <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs p-3 rounded-xl font-semibold">
                  {errorCategoria}
                </div>
              )}

              {/* Formulario de Crear / Editar Categoría */}
              <form onSubmit={handleSaveCategoria} className="bg-[#0B132B] p-3 sm:p-4 rounded-xl border border-[#3A506B] space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-bold uppercase text-[#5BC0DE]">
                    {editingCatId ? "Editar Categoría" : "Nueva Categoría"}
                  </h4>
                  {editingCatId && (
                    <button
                      type="button"
                      onClick={() => { setEditingCatId(null); setFormCatNombre(""); }}
                      className="text-[10px] text-[#5BC0DE] hover:underline font-semibold"
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
                    className="flex-1 min-w-0 bg-[#1C2541] border border-[#3A506B] rounded-xl px-3 h-[42px] text-base sm:text-sm text-[#F4D6B0] focus:outline-none focus:border-[#5BC0DE] transition-colors"
                    value={formCatNombre}
                    onChange={(e) => setFormCatNombre(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="px-4 h-[42px] bg-[#5BC0DE] hover:bg-[#4CA8C4] text-[#0B132B] text-xs font-bold rounded-xl transition-all shadow-md shrink-0"
                  >
                    {editingCatId ? "Actualizar" : "Guardar"}
                  </button>
                </div>
              </form>

              {/* Lista de Categorías Existentes */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase text-[#5BC0DE]">
                  Categorías Registradas ({categorias.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50">
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
                          <span className="text-[10px] text-[#5BC0DE] font-semibold">
                            {cantInsumos} insumo{cantInsumos === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => { setEditingCatId(cat.id); setFormCatNombre(cat.nombre); }}
                            className="flex items-center justify-center w-8 h-8 bg-[#1C2541] text-[#5BC0DE] hover:text-[#F4D6B0] border border-[#3A506B] rounded-lg transition-colors"
                            title="Editar nombre"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategoria(cat.id)}
                            className="flex items-center justify-center w-8 h-8 bg-[#D97706]/10 text-[#D97706] hover:bg-[#D97706]/20 border border-[#D97706]/30 rounded-lg transition-colors"
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

            <div className="shrink-0 p-3 sm:p-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[#0B132B] border-t border-[#3A506B] flex justify-end">
              <button
                type="button"
                className="px-5 h-[42px] rounded-xl bg-[#3A506B] text-[#F4D6B0] hover:bg-[#3A506B]/80 text-xs font-bold transition-colors"
                onClick={cerrarModalCategoria}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Nueva Unidad ── */}
      {mostrarModalUnidad && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-[#1C2541] border border-[#3A506B] w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-full">
            <div className="bg-[#0B132B] p-3 sm:p-5 border-b border-[#3A506B] flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-[#F4D6B0] flex items-center gap-2 text-sm sm:text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5BC0DE]"></span>
                Nueva Unidad de Medida
              </h3>
              <button
                type="button"
                onClick={cerrarModalUnidad}
                className="p-2 shrink-0 rounded-xl text-[#5BC0DE] hover:text-[#F4D6B0] hover:bg-[#3A506B] transition-colors"
              >✕</button>
            </div>

            <form onSubmit={guardarUnidad} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/50">
                {errorUnidad && (
                  <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs p-3 rounded-xl font-semibold">
                    {errorUnidad}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="und-nombre" className="text-[11px] font-bold text-[#5BC0DE]">Nombre de la Unidad *</label>
                  <input
                    id="und-nombre"
                    placeholder="Ej. Botella"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors"
                    value={formUnidad.nombre}
                    onChange={(e) => cambiarCampoUnidad("nombre", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="und-abrev" className="text-[11px] font-bold text-[#5BC0DE]">Abreviatura *</label>
                  <input
                    id="und-abrev"
                    placeholder="Ej. bot"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] font-mono lowercase transition-colors"
                    value={formUnidad.abreviatura}
                    onChange={(e) => cambiarCampoUnidad("abreviatura", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="und-desc" className="text-[11px] font-bold text-[#5BC0DE]">Descripción (Opcional)</label>
                  <input
                    id="und-desc"
                    placeholder="Ej. Envase de vidrio de 750ml"
                    className="bg-[#0B132B] border border-[#3A506B] text-[#F4D6B0] rounded-xl px-3 h-[42px] text-base sm:text-sm focus:outline-none focus:border-[#5BC0DE] transition-colors"
                    value={formUnidad.descripcion}
                    onChange={(e) => cambiarCampoUnidad("descripcion", e.target.value)}
                  />
                </div>
              </div>

              <div className="shrink-0 p-3 sm:p-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[#0B132B] border-t border-[#3A506B] flex justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  className="flex-1 sm:flex-none px-4 h-[42px] rounded-xl bg-[#3A506B] text-[#F4D6B0] hover:bg-[#3A506B]/80 text-xs font-bold transition-colors"
                  onClick={cerrarModalUnidad}
                >Cancelar</button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-4 h-[42px] rounded-xl bg-[#5BC0DE] hover:bg-[#4CA8C4] text-[#0B132B] font-bold text-xs shadow-md transition-colors"
                >Guardar Unidad</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}