import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Minus, Settings, Trash2, X, LayoutGrid, Layers, ArrowRightLeft } from "lucide-react";
import { MesaServicio, type SeccionBackend } from "../../servicios/MesaServicio";
import type { MesaBackend } from "../../tipos/Comanda";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onActualizado: () => void;
}

export default function ConfiguracionMesas({ abierto, onCerrar, onActualizado }: Props) {
  const [seccionesRaw, setSeccionesRaw] = useState<SeccionBackend[]>([]);
  const [mesas, setMesas] = useState<MesaBackend[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  // Pestaña activa ('secciones' o 'mesas')
  const [tabActiva, setTabActiva] = useState<"secciones" | "mesas">("secciones");

  // Estados de Secciones
  const [nombreSeccion, setNombreSeccion] = useState("");
  const [ordenSeccion, setOrdenSeccion] = useState("1");
  const [limiteSeccion, setLimiteSeccion] = useState("10");
  const [editandoId, setEditandoId] = useState<number | null>(null);

  // Estados de Mesas
  const [idSeccionMesas, setIdSeccionMesas] = useState<number | "">("");
  const [filtroSeccionMesaTab, setFiltroSeccionMesaTab] = useState<number | "Todas">("Todas");
  const [cantidadMesas, setCantidadMesas] = useState("1");
  const [numeroInicial, setNumeroInicial] = useState("");

  const cargar = async () => {
    setCargando(true);
    try {
      const [secs, mesasData] = await Promise.all([
        MesaServicio.obtenerSecciones(),
        MesaServicio.listarMesas(),
      ]);
      setSeccionesRaw(secs);
      setMesas(mesasData);
      if (secs.length > 0 && idSeccionMesas === "") {
        setIdSeccionMesas(secs[0].id);
      }
      const maxOrden = secs.reduce((m, s) => Math.max(m, s.orden ?? 0), 0);
      if (editandoId === null) setOrdenSeccion(String(maxOrden + 1));
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo cargar la configuración");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (!abierto) return;
    setAviso(null);
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  // Secciones ordenadas estrictamente por orden y FIFO por ID
  const secciones = useMemo(() => {
    return [...seccionesRaw].sort((a, b) => {
      const ordenA = a.orden ?? 0;
      const ordenB = b.orden ?? 0;
      if (ordenA !== ordenB) return ordenA - ordenB;
      return (a.id ?? 0) - (b.id ?? 0);
    });
  }, [seccionesRaw]);

  const mesasPorSeccion = useMemo(() => {
    const mapa = new Map<number, number>();
    mesas.forEach((m) => mapa.set(m.idSeccion, (mapa.get(m.idSeccion) ?? 0) + 1));
    return mapa;
  }, [mesas]);

  const seccionDestino = secciones.find((s) => s.id === idSeccionMesas);
  const ocupadasDestino = seccionDestino ? mesasPorSeccion.get(seccionDestino.id) ?? 0 : 0;
  const cuposDestino = seccionDestino ? Math.max(0, seccionDestino.limiteMesas - ocupadasDestino) : 0;

  const resetFormaSeccion = (lista = secciones) => {
    setEditandoId(null);
    setNombreSeccion("");
    setLimiteSeccion("10");
    const maxOrden = lista.reduce((m, s) => Math.max(m, s.orden ?? 0), 0);
    setOrdenSeccion(String(maxOrden + 1));
  };

  const recargarTodo = async () => {
    await cargar();
    onActualizado();
  };

  const guardarSeccion = async () => {
    const nombre = nombreSeccion.trim();
    if (!nombre) {
      setAviso("Escribe el nombre de la sección.");
      return;
    }
    setGuardando(true);
    setAviso(null);
    try {
      const ordenNum = parseInt(ordenSeccion, 10);
      const limiteNum = parseInt(limiteSeccion, 10);

      if (editandoId !== null) {
        await MesaServicio.actualizarSeccion(editandoId, {
          nombre,
          orden: isNaN(ordenNum) ? 1 : ordenNum,
          limiteMesas: isNaN(limiteNum) ? 10 : limiteNum,
        });
      } else {
        await MesaServicio.crearSeccion({
          nombre,
          orden: isNaN(ordenNum) ? 1 : ordenNum,
          limiteMesas: isNaN(limiteNum) ? 10 : limiteNum,
        });
      }
      resetFormaSeccion();
      await recargarTodo();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo guardar la sección");
    } finally {
      setGuardando(false);
    }
  };

  const editarSeccion = (s: SeccionBackend) => {
    setEditandoId(s.id);
    setNombreSeccion(s.nombre);
    setOrdenSeccion(String(s.orden));
    setLimiteSeccion(String(s.limiteMesas));
  };

  const cambiarOrden = async (s: SeccionBackend, direccion: -1 | 1) => {
    const idx = secciones.findIndex((x) => x.id === s.id);
    const vecina = secciones[idx + direccion];
    if (!vecina) return;

    setGuardando(true);
    setAviso(null);
    try {
      const ordenOriginalS = s.orden;
      const ordenOriginalVecina = vecina.orden;

      await MesaServicio.actualizarSeccion(s.id, { orden: -999 });
      await MesaServicio.actualizarSeccion(vecina.id, { orden: ordenOriginalS });
      await MesaServicio.actualizarSeccion(s.id, { orden: ordenOriginalVecina });

      await recargarTodo();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo reordenar");
    } finally {
      setGuardando(false);
    }
  };

  const borrarSeccion = async (s: SeccionBackend) => {
    const cantidad = mesasPorSeccion.get(s.id) ?? 0;
    if (cantidad > 0) {
      setAviso(`Mueve o borra las ${cantidad} mesa(s) de "${s.nombre}" antes de eliminar la sección.`);
      return;
    }
    if (!window.confirm(`¿Eliminar la sección "${s.nombre}"?`)) return;
    setGuardando(true);
    setAviso(null);
    try {
      await MesaServicio.eliminarSeccion(s.id);
      if (editandoId === s.id) resetFormaSeccion();
      await recargarTodo();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo eliminar la sección");
    } finally {
      setGuardando(false);
    }
  };

  const agregarMesas = async () => {
    if (idSeccionMesas === "") {
      setAviso("Elige una sección para las mesas.");
      return;
    }
    const cantNum = parseInt(cantidadMesas, 10);
    if (isNaN(cantNum) || cantNum < 1) {
      setAviso("Agrega al menos una mesa válida.");
      return;
    }
    if (cantNum > cuposDestino) {
      setAviso(`Solo quedan ${cuposDestino} cupos en esta sección.`);
      return;
    }
    setGuardando(true);
    setAviso(null);
    try {
      let inicio: number;
      if (numeroInicial.trim() !== "" && !isNaN(Number(numeroInicial))) {
        inicio = Number(numeroInicial);
      } else {
        const maxNumeroMesa = mesas.reduce((max, m) => Math.max(max, m.numero), 0);
        inicio = maxNumeroMesa + 1;
      }

      await MesaServicio.crearMesasLote({
        idSeccion: Number(idSeccionMesas),
        cantidad: cantNum,
        numeroInicial: inicio,
      });

      setCantidadMesas("1");
      setNumeroInicial("");
      await recargarTodo();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudieron crear las mesas");
    } finally {
      setGuardando(false);
    }
  };

  const moverMesa = async (mesa: MesaBackend, idSeccion: number) => {
    if (idSeccion === mesa.idSeccion) return;
    const destino = secciones.find((s) => s.id === idSeccion);
    const ocupadas = mesasPorSeccion.get(idSeccion) ?? 0;
    if (destino && ocupadas >= destino.limiteMesas) {
      setAviso(`"${destino.nombre}" ya está al límite (${destino.limiteMesas}).`);
      return;
    }
    setGuardando(true);
    setAviso(null);
    try {
      await MesaServicio.moverMesa(mesa.id, idSeccion);
      await recargarTodo();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo mover la mesa");
    } finally {
      setGuardando(false);
    }
  };

  const borrarMesa = async (mesa: MesaBackend) => {
    if (mesa.estado === "Ocupada") {
      setAviso(`La mesa ${mesa.numero} está ocupada. Libérala primero.`);
      return;
    }
    if (!window.confirm(`¿Eliminar la mesa ${mesa.numero}?`)) return;
    setGuardando(true);
    setAviso(null);
    try {
      await MesaServicio.eliminarMesa(mesa.id);
      await recargarTodo();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo eliminar la mesa");
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) return null;

  // Ordenamiento FIFO estricto por ID para que la última mesa agregada quede de última (de izquierda a derecha)
  const mesasFiltradasPorTab = [...mesas]
    .filter((m) => filtroSeccionMesaTab === "Todas" || m.idSeccion === filtroSeccionMesaTab)
    .sort((a, b) => a.id - b.id);

  // Clases reutilizables para los botones +/- de los campos numéricos
  const btnStep =
    "w-9 sm:w-8 h-full flex items-center justify-center bg-[#3A506B] text-[#F4D6B0] hover:bg-[#5BC0DE] hover:text-[#0B132B] rounded-lg transition-colors font-bold text-xs shrink-0";

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center px-2 pt-2 pb-14 sm:p-5 animate-in fade-in duration-200">
      {/* Tarjeta con margen: se ajusta al espacio visible y nunca ocupa toda la pantalla */}
      <div className="bg-[#1C2541] border border-[#3A506B] rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-full overflow-hidden flex flex-col shadow-2xl">
        
        {/* Encabezado del Modal */}
        <div className="p-3 sm:p-5 bg-[#0B132B] border-b border-[#3A506B] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-[#5BC0DE] text-[#0B132B] flex items-center justify-center shadow-md">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-[#F4D6B0] truncate">Configuración del Salón</h2>
              <p className="text-[11px] text-[#5BC0DE] truncate">Administra zonas y distribución de mesas.</p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="p-2 shrink-0 rounded-xl text-[#5BC0DE] hover:text-[#F4D6B0] hover:bg-[#3A506B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas (Tabs) de Navegación Interna */}
        <div className="flex border-b border-[#3A506B] bg-[#0B132B] px-2 sm:px-4 pt-2 sm:pt-3 gap-1.5 sm:gap-2 shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden touch-pan-x">
          <button
            onClick={() => setTabActiva("secciones")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all border-t border-x ${
              tabActiva === "secciones"
                ? "bg-[#1C2541] text-[#5BC0DE] border-[#3A506B]"
                : "bg-transparent text-[#7B8FA8] border-transparent hover:text-[#F4D6B0]"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="sm:hidden">Secciones ({secciones.length})</span>
            <span className="hidden sm:inline">Secciones Editables ({secciones.length})</span>
          </button>
          <button
            onClick={() => setTabActiva("mesas")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all border-t border-x ${
              tabActiva === "mesas"
                ? "bg-[#1C2541] text-[#5BC0DE] border-[#3A506B]"
                : "bg-transparent text-[#7B8FA8] border-transparent hover:text-[#F4D6B0]"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="sm:hidden">Mesas ({mesas.length})</span>
            <span className="hidden sm:inline">Gestión de Mesas ({mesas.length})</span>
          </button>
        </div>

        {/* Cuerpo con scroll único y barra visible */}
        <div className="p-3 sm:p-5 overflow-y-auto overscroll-contain flex-1 min-h-0 space-y-4 sm:space-y-5 bg-[#1C2541] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#0B132B] [&::-webkit-scrollbar-thumb]:bg-[#5BC0DE]/60 [&::-webkit-scrollbar-thumb]:rounded-full">
          {aviso && (
            <div className="bg-[#E57373]/10 border border-[#E57373]/30 text-[#E57373] text-xs rounded-xl px-3 py-2.5 font-semibold break-words">
              {aviso}
            </div>
          )}

          {cargando && <p className="text-xs text-[#5BC0DE]">Cargando configuración...</p>}

          {/* ================= PESTAÑA 1: SECCIONES ================= */}
          {tabActiva === "secciones" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-[#0B132B] border border-[#3A506B] rounded-2xl p-3 sm:p-4 space-y-3 shadow-inner">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#5BC0DE]">
                  {editandoId !== null ? "Editar Sección" : "Crear Nueva Sección"}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 items-end">
                  <label className="col-span-2 sm:col-span-6 text-[11px] font-bold uppercase tracking-wider text-[#F4D6B0] flex flex-col">
                    Nombre
                    <input
                      type="text"
                      placeholder="Ej. Terraza"
                      value={nombreSeccion}
                      onChange={(e) => setNombreSeccion(e.target.value)}
                      className="mt-1 w-full bg-[#1C2541] text-[#F4D6B0] font-bold px-3 rounded-xl text-xs border border-[#3A506B] focus:border-[#5BC0DE] outline-none transition-colors h-[42px]"
                    />
                  </label>
                  
                  {/* Orden con botones + y - */}
                  <label className="col-span-1 sm:col-span-3 text-[11px] font-bold uppercase tracking-wider text-[#F4D6B0] flex flex-col min-w-0">
                    Orden
                    <div className="mt-1 flex items-center bg-[#1C2541] rounded-xl p-0.5 border border-[#3A506B] h-[42px]">
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseInt(ordenSeccion, 10) || 1;
                          setOrdenSeccion(String(Math.max(0, val - 1)));
                        }}
                        className={btnStep}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={ordenSeccion}
                        onChange={(e) => setOrdenSeccion(e.target.value.replace(/[^0-9]/g, ""))}
                        className="w-full min-w-0 bg-transparent text-center text-[#F4D6B0] font-bold text-xs outline-none px-1 h-full"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseInt(ordenSeccion, 10) || 0;
                          setOrdenSeccion(String(val + 1));
                        }}
                        className={btnStep}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </label>

                  {/* Límite de mesas con botones + y - */}
                  <label className="col-span-1 sm:col-span-3 text-[11px] font-bold uppercase tracking-wider text-[#F4D6B0] flex flex-col min-w-0">
                    Límite Mesas
                    <div className="mt-1 flex items-center bg-[#1C2541] rounded-xl p-0.5 border border-[#3A506B] h-[42px]">
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseInt(limiteSeccion, 10) || 1;
                          setLimiteSeccion(String(Math.max(1, val - 1)));
                        }}
                        className={btnStep}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={limiteSeccion}
                        onChange={(e) => setLimiteSeccion(e.target.value.replace(/[^0-9]/g, ""))}
                        className="w-full min-w-0 bg-transparent text-center text-[#F4D6B0] font-bold text-xs outline-none px-1 h-full"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseInt(limiteSeccion, 10) || 0;
                          setLimiteSeccion(String(val + 1));
                        }}
                        className={btnStep}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </label>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1 sm:pt-2">
                  {editandoId !== null && (
                    <button
                      onClick={() => resetFormaSeccion()}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[#5BC0DE] hover:text-[#F4D6B0] hover:bg-[#3A506B]/50 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    onClick={() => void guardarSeccion()}
                    disabled={guardando}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#5BC0DE] text-[#0B132B] hover:bg-[#4CA8C4] disabled:opacity-50 shadow-md transition-colors h-[42px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {editandoId !== null ? "Guardar cambios" : "Crear sección"}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {secciones.map((s, idx) => {
                  const usadas = mesasPorSeccion.get(s.id) ?? 0;
                  return (
                    <div
                      key={s.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 bg-[#0B132B] border border-[#3A506B] rounded-2xl p-3 hover:border-[#5BC0DE]/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[#F4D6B0] text-sm truncate">{s.nombre}</p>
                        <p className="text-[11px] text-[#5BC0DE]">
                          Orden {s.orden} · {usadas} de {s.limiteMesas} mesas ocupadas
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          disabled={idx === 0 || guardando}
                          onClick={() => void cambiarOrden(s, -1)}
                          className="p-2 sm:p-1.5 rounded-lg border border-[#3A506B] text-[#F4D6B0] hover:bg-[#3A506B] disabled:opacity-30 transition-colors"
                          title="Subir"
                          aria-label="Subir"
                        >
                          <ArrowUp className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                        <button
                          disabled={idx === secciones.length - 1 || guardando}
                          onClick={() => void cambiarOrden(s, 1)}
                          className="p-2 sm:p-1.5 rounded-lg border border-[#3A506B] text-[#F4D6B0] hover:bg-[#3A506B] disabled:opacity-30 transition-colors"
                          title="Bajar"
                          aria-label="Bajar"
                        >
                          <ArrowDown className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                        <button
                          onClick={() => editarSeccion(s)}
                          className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 rounded-lg text-[11px] font-bold border border-[#3A506B] text-[#5BC0DE] hover:bg-[#5BC0DE]/10 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => void borrarSeccion(s)}
                          className="p-2 sm:p-1.5 rounded-lg text-[#E57373] hover:bg-[#E57373]/10 transition-colors"
                          title="Eliminar sección"
                          aria-label="Eliminar sección"
                        >
                          <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {secciones.length === 0 && !cargando && (
                  <p className="text-xs text-[#5BC0DE] text-center py-6">No hay secciones registradas.</p>
                )}
              </div>
            </div>
          )}

          {/* ================= PESTAÑA 2: MESAS ================= */}
          {tabActiva === "mesas" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              <div className="bg-[#0B132B] border border-[#3A506B] rounded-2xl p-3 sm:p-4 space-y-3 shadow-inner">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#5BC0DE]">Agregar Mesas por Lote</h3>
                <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 items-end">
                  
                  {/* Selector de Sección */}
                  <div className="col-span-2 sm:col-span-4 flex flex-col">
                    <span className="text-[10px] font-bold text-[#F4D6B0] uppercase tracking-wider mb-1">Sección</span>
                    <select
                      value={idSeccionMesas}
                      onChange={(e) => setIdSeccionMesas(e.target.value ? Number(e.target.value) : "")}
                      className="w-full bg-[#1C2541] text-[#F4D6B0] font-bold px-3 rounded-xl text-xs border border-[#3A506B] focus:border-[#5BC0DE] outline-none transition-colors h-[42px]"
                    >
                      <option value="">Seleccionar sección destino</option>
                      {secciones.map((s) => {
                        const usadas = mesasPorSeccion.get(s.id) ?? 0;
                        return (
                          <option key={s.id} value={s.id} disabled={usadas >= s.limiteMesas}>
                            {s.nombre} ({usadas}/{s.limiteMesas})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Cantidad con botones + y - */}
                  <div className="col-span-1 sm:col-span-3 flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-[#F4D6B0] uppercase tracking-wider mb-1">Cantidad</span>
                    <div className="flex items-center bg-[#1C2541] rounded-xl p-0.5 border border-[#3A506B] h-[42px]">
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseInt(cantidadMesas, 10) || 1;
                          setCantidadMesas(String(Math.max(1, val - 1)));
                        }}
                        className={btnStep}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cantidadMesas}
                        onChange={(e) => setCantidadMesas(e.target.value.replace(/[^0-9]/g, ""))}
                        className="w-full min-w-0 bg-transparent text-center text-[#F4D6B0] font-bold text-xs outline-none px-1 h-full"
                        placeholder="1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseInt(cantidadMesas, 10) || 0;
                          const maxPermitido = cuposDestino || 99;
                          if (val < maxPermitido) {
                            setCantidadMesas(String(val + 1));
                          }
                        }}
                        className={btnStep}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* N° inicial con botones + y - */}
                  <div className="col-span-1 sm:col-span-2 flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-[#F4D6B0] uppercase tracking-wider mb-1">N° Inicial</span>
                    <div className="flex items-center bg-[#1C2541] rounded-xl p-0.5 border border-[#3A506B] h-[42px]">
                      <button
                        type="button"
                        onClick={() => {
                          const current = numeroInicial.trim() !== "" ? parseInt(numeroInicial, 10) : (mesas.reduce((max, m) => Math.max(max, m.numero), 0) + 1);
                          setNumeroInicial(String(Math.max(1, current - 1)));
                        }}
                        className="w-9 sm:w-6 h-full flex items-center justify-center bg-[#3A506B] text-[#F4D6B0] hover:bg-[#5BC0DE] hover:text-[#0B132B] rounded-lg transition-colors font-bold text-xs shrink-0"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Auto"
                        value={numeroInicial}
                        onChange={(e) => setNumeroInicial(e.target.value.replace(/[^0-9]/g, ""))}
                        className="w-full min-w-0 bg-transparent text-center text-[#F4D6B0] font-bold text-xs outline-none px-1 h-full placeholder-[#3A506B]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const current = numeroInicial.trim() !== "" ? parseInt(numeroInicial, 10) : (mesas.reduce((max, m) => Math.max(max, m.numero), 0) + 1);
                          setNumeroInicial(String(current + 1));
                        }}
                        className="w-9 sm:w-6 h-full flex items-center justify-center bg-[#3A506B] text-[#F4D6B0] hover:bg-[#5BC0DE] hover:text-[#0B132B] rounded-lg transition-colors font-bold text-xs shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => void agregarMesas()}
                    disabled={guardando || cuposDestino <= 0 || idSeccionMesas === ""}
                    className="col-span-2 sm:col-span-3 flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold bg-[#5BC0DE] text-[#0B132B] hover:bg-[#4CA8C4] disabled:opacity-40 shadow-md transition-colors h-[42px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar
                  </button>
                </div>
                <p className="text-[11px] text-[#5BC0DE]">
                  {seccionDestino
                    ? `Quedan ${cuposDestino} cupos disponibles en ${seccionDestino.nombre}. Las mesas se ordenan de izquierda a derecha conforme llegan.`
                    : "Elige una sección para validar los cupos."}
                </p>
              </div>

              {/* Filtro de sección */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#0B132B] p-3 rounded-xl border border-[#3A506B]">
                <span className="text-xs font-bold text-[#F4D6B0]">Filtrar panel de mesas:</span>
                <select
                  value={filtroSeccionMesaTab}
                  onChange={(e) => setFiltroSeccionMesaTab(e.target.value === "Todas" ? "Todas" : Number(e.target.value))}
                  className="w-full sm:w-auto bg-[#1C2541] text-[#F4D6B0] border border-[#3A506B] text-xs rounded-lg px-3 py-1.5 font-medium outline-none focus:border-[#5BC0DE] transition-colors h-10"
                >
                  <option value="Todas">Todas las secciones ({mesas.length})</option>
                  {secciones.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({mesasPorSeccion.get(s.id) ?? 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* Panel Grid de Mesas */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
                {mesasFiltradasPorTab.map((mesa) => (
                  <div
                    key={mesa.id}
                    className="bg-[#0B132B] border-2 border-[#3A506B] hover:border-[#5BC0DE] rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-between gap-2.5 sm:gap-3 transition-all shadow-md group relative"
                  >
                    {/* Eliminar: siempre visible en teléfono (no hay hover), aparece al pasar el mouse en escritorio */}
                    <button
                      onClick={() => void borrarMesa(mesa)}
                      className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1.5 rounded-lg text-[#E57373]/80 sm:text-[#3A506B] hover:text-[#E57373] hover:bg-[#E57373]/10 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                      title="Eliminar mesa"
                      aria-label={`Eliminar mesa ${mesa.numero}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Número de la mesa */}
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#1C2541] border border-[#3A506B] flex items-center justify-center font-black text-[#F4D6B0] text-base sm:text-lg mt-1 sm:mt-2">
                      {mesa.numero}
                    </div>

                    {/* Sección */}
                    <span className="text-[10px] text-[#5BC0DE] font-bold uppercase tracking-wider truncate w-full text-center">
                      {mesa.seccionNombre}
                    </span>

                    {/* Selector de Zona */}
                    <div className="w-full pt-2 border-t border-[#3A506B]/60 flex items-center justify-between gap-1.5">
                      <ArrowRightLeft className="w-3 h-3 text-[#5BC0DE] shrink-0" />
                      <select
                        value={mesa.idSeccion}
                        disabled={guardando}
                        onChange={(e) => void moverMesa(mesa, Number(e.target.value))}
                        className="flex-1 min-w-0 sm:max-w-[85px] bg-[#1C2541] border border-[#3A506B] text-[10px] text-[#F4D6B0] rounded-lg px-1.5 py-1.5 sm:py-1 outline-none truncate focus:border-[#5BC0DE] transition-colors"
                        title="Mover a otra sección"
                      >
                        {secciones.map((s) => {
                          const usadas = mesasPorSeccion.get(s.id) ?? 0;
                          const llena = s.id !== mesa.idSeccion && usadas >= s.limiteMesas;
                          return (
                            <option key={s.id} value={s.id} disabled={llena}>
                              {s.nombre}{llena ? " (llena)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {mesasFiltradasPorTab.length === 0 && !cargando && (
                <p className="text-xs text-[#5BC0DE] text-center py-8">No hay mesas registradas en esta sección.</p>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}