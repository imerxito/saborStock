import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Settings, Trash2, X } from "lucide-react";
import { MesaServicio, type SeccionBackend } from "../../servicios/MesaServicio";
import type { MesaBackend } from "../../tipos/Comanda";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onActualizado: () => void;
}

export default function ConfiguracionMesas({ abierto, onCerrar, onActualizado }: Props) {
  const [secciones, setSecciones] = useState<SeccionBackend[]>([]);
  const [mesas, setMesas] = useState<MesaBackend[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const [nombreSeccion, setNombreSeccion] = useState("");
  const [ordenSeccion, setOrdenSeccion] = useState(1);
  const [limiteSeccion, setLimiteSeccion] = useState(10);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [idSeccionMesas, setIdSeccionMesas] = useState<number | "">("");
  const [cantidadMesas, setCantidadMesas] = useState(1);
  const [numeroInicial, setNumeroInicial] = useState("");

  const cargar = async () => {
    setCargando(true);
    try {
      const [secs, mesasData] = await Promise.all([
        MesaServicio.obtenerSecciones(),
        MesaServicio.listarMesas(),
      ]);
      setSecciones(secs);
      setMesas(mesasData);
      if (secs.length > 0 && idSeccionMesas === "") {
        setIdSeccionMesas(secs[0].id);
      }
      const maxOrden = secs.reduce((m, s) => Math.max(m, s.orden ?? 0), 0);
      if (editandoId === null) setOrdenSeccion(maxOrden + 1);
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
    setLimiteSeccion(10);
    const maxOrden = lista.reduce((m, s) => Math.max(m, s.orden ?? 0), 0);
    setOrdenSeccion(maxOrden + 1);
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
      if (editandoId !== null) {
        await MesaServicio.actualizarSeccion(editandoId, {
          nombre,
          orden: Number(ordenSeccion),
          limiteMesas: Number(limiteSeccion),
        });
      } else {
        await MesaServicio.crearSeccion({
          nombre,
          orden: Number(ordenSeccion),
          limiteMesas: Number(limiteSeccion),
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
    setOrdenSeccion(s.orden);
    setLimiteSeccion(s.limiteMesas);
  };

  const cambiarOrden = async (s: SeccionBackend, direccion: -1 | 1) => {
    const ordenada = [...secciones].sort((a, b) => a.orden - b.orden);
    const idx = ordenada.findIndex((x) => x.id === s.id);
    const vecina = ordenada[idx + direccion];
    if (!vecina) return;
    setGuardando(true);
    setAviso(null);
    try {
      await MesaServicio.actualizarSeccion(s.id, { orden: vecina.orden });
      await MesaServicio.actualizarSeccion(vecina.id, { orden: s.orden });
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
    if (cantidadMesas < 1) {
      setAviso("Agrega al menos una mesa.");
      return;
    }
    if (cantidadMesas > cuposDestino) {
      setAviso(`Solo quedan ${cuposDestino} cupos en esta sección.`);
      return;
    }
    setGuardando(true);
    setAviso(null);
    try {
      const inicio = numeroInicial.trim() === "" ? undefined : Number(numeroInicial);
      await MesaServicio.crearMesasLote({
        idSeccion: Number(idSeccionMesas),
        cantidad: cantidadMesas,
        numeroInicial: inicio && inicio > 0 ? inicio : undefined,
      });
      setCantidadMesas(1);
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

  const mesasOrdenadas = [...mesas].sort((a, b) => a.numero - b.numero);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0a2228] border border-[#143d46] rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 sm:p-5 bg-[#0e2a30] border-b border-[#143d46] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#3ba28a] text-[#07191d] flex items-center justify-center shadow-md">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Configurar mesas y secciones</h2>
              <p className="text-xs text-slate-400 mt-0.5">Solo el Dueño puede crear, mover o borrar el salón.</p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#143d46] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-8">
          {aviso && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-xl px-4 py-3">
              {aviso}
            </div>
          )}

          {cargando && <p className="text-sm text-slate-400">Cargando configuración...</p>}

          <section className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#3ba28a]">Secciones</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#0e2a30] border border-[#143d46] rounded-2xl p-4">
              <label className="md:col-span-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Nombre
                <input
                  type="text"
                  placeholder="Ej. Terraza"
                  value={nombreSeccion}
                  onChange={(e) => setNombreSeccion(e.target.value)}
                  className="mt-1 w-full bg-[#f3ebd9] text-[#0a2228] font-bold p-3 rounded-xl"
                />
              </label>
              <label className="md:col-span-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Orden
                <input
                  type="number"
                  min={0}
                  value={ordenSeccion}
                  onChange={(e) => setOrdenSeccion(Number(e.target.value))}
                  className="mt-1 w-full bg-[#f3ebd9] text-[#0a2228] font-bold p-3 rounded-xl"
                />
              </label>
              <label className="md:col-span-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Límite
                <input
                  type="number"
                  min={1}
                  value={limiteSeccion}
                  onChange={(e) => setLimiteSeccion(Number(e.target.value))}
                  className="mt-1 w-full bg-[#f3ebd9] text-[#0a2228] font-bold p-3 rounded-xl"
                />
              </label>
              <button
                onClick={() => void guardarSeccion()}
                disabled={guardando}
                className="md:col-span-3 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-[#3ba28a] text-[#07191d] hover:bg-[#43b399] disabled:opacity-50 self-end"
              >
                <Plus className="w-4 h-4" />
                {editandoId !== null ? "Guardar sección" : "Crear sección"}
              </button>
              {editandoId !== null && (
                <button
                  onClick={() => resetFormaSeccion()}
                  className="md:col-span-12 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar edición
                </button>
              )}
              <p className="md:col-span-12 text-[11px] text-slate-400">
                Orden: posición en las pestañas. Límite: máximo de mesas que admite esa zona.
              </p>
            </div>

            <div className="space-y-2">
              {secciones.map((s, idx) => {
                const usadas = mesasPorSeccion.get(s.id) ?? 0;
                return (
                  <div
                    key={s.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 bg-[#0e2a30] border border-[#143d46] rounded-2xl p-3"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-white">{s.nombre}</p>
                      <p className="text-xs text-slate-400">
                        Orden {s.orden} · {usadas}/{s.limiteMesas} mesas
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={idx === 0 || guardando}
                        onClick={() => void cambiarOrden(s, -1)}
                        className="p-2 rounded-lg border border-[#143d46] text-slate-300 hover:text-white disabled:opacity-30"
                        title="Subir"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        disabled={idx === secciones.length - 1 || guardando}
                        onClick={() => void cambiarOrden(s, 1)}
                        className="p-2 rounded-lg border border-[#143d46] text-slate-300 hover:text-white disabled:opacity-30"
                        title="Bajar"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => editarSeccion(s)}
                        className="px-3 py-2 rounded-lg text-xs font-bold border border-[#143d46] text-[#3ba28a] hover:bg-[#143d46]"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => void borrarSeccion(s)}
                        className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10"
                        title="Eliminar sección"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {secciones.length === 0 && !cargando && (
                <p className="text-sm text-slate-400">Aún no hay secciones. Crea la primera arriba.</p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#3ba28a]">Mesas</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#0e2a30] border border-[#143d46] rounded-2xl p-4">
              <select
                value={idSeccionMesas}
                onChange={(e) => setIdSeccionMesas(e.target.value ? Number(e.target.value) : "")}
                className="md:col-span-4 bg-[#f3ebd9] text-[#0a2228] font-bold p-3 rounded-xl"
              >
                <option value="">Sección</option>
                {secciones.map((s) => {
                  const usadas = mesasPorSeccion.get(s.id) ?? 0;
                  return (
                    <option key={s.id} value={s.id} disabled={usadas >= s.limiteMesas}>
                      {s.nombre} ({usadas}/{s.limiteMesas})
                    </option>
                  );
                })}
              </select>
              <input
                type="number"
                min={1}
                max={cuposDestino || 1}
                value={cantidadMesas}
                onChange={(e) => setCantidadMesas(Math.max(1, Number(e.target.value)))}
                className="md:col-span-2 bg-[#f3ebd9] text-[#0a2228] font-bold p-3 rounded-xl"
                title="Cantidad"
              />
              <input
                type="number"
                min={1}
                placeholder="N° inicial (opcional)"
                value={numeroInicial}
                onChange={(e) => setNumeroInicial(e.target.value)}
                className="md:col-span-3 bg-[#f3ebd9] text-[#0a2228] font-bold p-3 rounded-xl"
              />
              <button
                onClick={() => void agregarMesas()}
                disabled={guardando || cuposDestino <= 0 || idSeccionMesas === ""}
                className="md:col-span-3 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-[#3ba28a] text-[#07191d] hover:bg-[#43b399] disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
                Agregar mesa(s)
              </button>
              <p className="md:col-span-12 text-[11px] text-slate-400">
                {seccionDestino
                  ? `Quedan ${cuposDestino} cupos en ${seccionDestino.nombre}. Puedes agregar varias de una vez; si el número ya existe se usa el siguiente libre.`
                  : "Elige una sección para ver cuántas mesas caben."}
              </p>
            </div>

            <div className="space-y-2">
              {mesasOrdenadas.map((mesa) => (
                <div
                  key={mesa.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 bg-[#0e2a30] border border-[#143d46] rounded-2xl p-3"
                >
                  <div className="flex-1">
                    <p className="font-bold text-white">Mesa {mesa.numero}</p>
                    <p className="text-xs text-slate-400">
                      {mesa.seccionNombre} · {mesa.estado}
                    </p>
                  </div>
                  <select
                    value={mesa.idSeccion}
                    disabled={guardando}
                    onChange={(e) => void moverMesa(mesa, Number(e.target.value))}
                    className="bg-[#07191d] border border-[#143d46] text-sm text-white rounded-xl px-3 py-2"
                    title="Cambiar ubicación"
                  >
                    {secciones.map((s) => {
                      const usadas = mesasPorSeccion.get(s.id) ?? 0;
                      const llena = s.id !== mesa.idSeccion && usadas >= s.limiteMesas;
                      return (
                        <option key={s.id} value={s.id} disabled={llena}>
                          {s.nombre}
                          {llena ? " (llena)" : ""}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    onClick={() => void borrarMesa(mesa)}
                    className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10"
                    title="Eliminar mesa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {mesasOrdenadas.length === 0 && !cargando && (
                <p className="text-sm text-slate-400">No hay mesas. Agrégalas por sección arriba.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
