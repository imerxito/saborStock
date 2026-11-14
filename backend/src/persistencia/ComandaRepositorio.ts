import { supabase } from "../configuracion/Supabase.js";
import { Comanda, CrearComanda, ActualizarComanda, ItemComandaDetalle } from "../modelos/Comanda.js";
import { EstadoComanda } from "../modelos/EstadoComanda.js";
import { parseFechaDb } from "../utilidades/fechaDb.js";

function mapearComandaCompleta(row: any): Comanda {
  const detalles: ItemComandaDetalle[] = Array.isArray(row.detalle_comanda)
    ? row.detalle_comanda.map((d: any) => ({
        id: d.id_detalle_comanda,
        idProducto: d.id_producto,
        nombreProducto: d.producto?.nombre ?? `Producto #${d.id_producto}`,
        precio: Number(d.producto?.precio_venta ?? 0),
        cantidad: Number(d.cantidad) || 1,
        nota: d.nota ?? null,
      }))
    : [];

  return {
    id: row.id_comanda,
    idVenta: row.id_venta,
    idMesa: row.venta?.id_mesa ?? null,
    mesaNumero: row.venta?.mesa?.numero ?? null,
    cliente: row.venta?.cliente ?? null,
    personas: row.venta?.personas ?? null,
    idUsuario: row.id_usuario,
    usuarioNombre: row.usuario?.nombre ?? null,
    estado: row.estado,
    observacion: row.observacion,
    fechaCreacion: parseFechaDb(row.fecha_creacion) ?? new Date(),
    fechaDespachada: parseFechaDb(row.fecha_despachada),
    detalles,
  };
}

export class ComandaRepositorio {
  async listar(): Promise<Comanda[]> {
    const { data, error } = await supabase
      .from("comanda")
      .select("*, venta:id_venta(id_venta, id_mesa, cliente, personas, mesa:id_mesa(id_mesa, numero, estado)), usuario:id_usuario(id_usuario, nombre), detalle_comanda(*, producto:id_producto(*))")
      .order("fecha_creacion", { ascending: false });

    if (error) throw new Error(`Error al listar comandas: ${error.message}`);
    return (data || []).map(mapearComandaCompleta);
  }

  async obtenerPorId(id: number): Promise<Comanda | null> {
    const { data, error } = await supabase
      .from("comanda")
      .select("*, venta:id_venta(id_venta, id_mesa, cliente, personas, mesa:id_mesa(id_mesa, numero, estado)), usuario:id_usuario(id_usuario, nombre), detalle_comanda(*, producto:id_producto(*))")
      .eq("id_comanda", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error al obtener comanda: ${error.message}`);
    }
    return mapearComandaCompleta(data);
  }

  async crearComanda(datos: CrearComanda): Promise<Comanda> {
    const itemsRecibidos = datos.items ?? [];
    const itemsValidos = itemsRecibidos.filter(
      (it) => Number(it.idProducto) > 0 && Number(it.cantidad) > 0
    );
    if (itemsRecibidos.length > 0 && itemsValidos.length !== itemsRecibidos.length) {
      throw new Error("La comanda contiene productos o cantidades inválidas");
    }

    let idVenta = datos.idVenta;
    let ventaCreada = false;

    const limpiarVentaCreada = async () => {
      if (ventaCreada && idVenta) {
        await supabase.from("venta").delete().eq("id_venta", idVenta);
      }
    };

    // Verificar que el usuario exista o usar null si no es válido
    let idUsuarioValido: number | null = null;
    if (datos.idUsuario) {
      const { data: userExists } = await supabase
        .from("usuario")
        .select("id_usuario")
        .eq("id_usuario", datos.idUsuario)
        .maybeSingle();
      if (userExists) {
        idUsuarioValido = userExists.id_usuario;
      }
    }

    // Si no se proporcionó idVenta pero sí idMesa, buscar venta abierta del mismo cliente
    if (!idVenta && datos.idMesa) {
      const clienteBuscado = (datos.cliente || "Cliente General").trim();
      const { data: ventasAbiertas } = await supabase
        .from("venta")
        .select("id_venta, cliente")
        .eq("id_mesa", datos.idMesa)
        .eq("estado", "Abierta")
        .order("fecha_apertura", { ascending: false });

      const ventaExistente = (ventasAbiertas || []).find(
        (v: { cliente?: string }) =>
          (v.cliente || "Cliente General").trim().toLowerCase() === clienteBuscado.toLowerCase()
      );

      if (ventaExistente) {
        idVenta = ventaExistente.id_venta;
      } else {
        const { data: nuevaVenta, error: errVenta } = await supabase
          .from("venta")
          .insert({
            id_mesa: datos.idMesa,
            cliente: datos.cliente || "Cliente General",
            personas: datos.personas || 1,
            id_usuario: idUsuarioValido,
            estado: "Abierta",
            observacion: datos.observacion ?? null,
          })
          .select("id_venta")
          .single();

        if (errVenta) {
          throw new Error(`Error al crear la venta para la comanda: ${errVenta.message}`);
        }
        idVenta = nuevaVenta.id_venta;
        ventaCreada = true;
      }

      // Marcar mesa como Ocupada
      const { error: errMesa } = await supabase
        .from("mesa")
        .update({ estado: "Ocupada" })
        .eq("id_mesa", datos.idMesa);
      if (errMesa) {
        await limpiarVentaCreada();
        throw new Error(`Error al ocupar la mesa: ${errMesa.message}`);
      }
    }

    if (!idVenta) {
      // Si aún no hay idVenta, crear una venta general sin mesa
      const { data: ventaGen, error: errVentaGen } = await supabase
        .from("venta")
        .insert({
          id_mesa: null,
          cliente: datos.cliente || "Cliente General",
          personas: datos.personas || 1,
          id_usuario: idUsuarioValido,
          estado: "Abierta",
          observacion: datos.observacion ?? null,
        })
        .select("id_venta")
        .single();

      if (errVentaGen) {
        throw new Error(`Error al crear venta genérica: ${errVentaGen.message}`);
      }
      idVenta = ventaGen.id_venta;
      ventaCreada = true;
    }

    // Insertar comanda
    const { data: comandaCreada, error: errComanda } = await supabase
      .from("comanda")
      .insert({
        id_venta: idVenta,
        id_usuario: idUsuarioValido,
        estado: datos.estado ?? EstadoComanda.Pendiente,
        observacion: datos.observacion ?? null,
      })
      .select()
      .single();

    if (errComanda) {
      await limpiarVentaCreada();
      throw new Error(`Error al crear comanda: ${errComanda.message}`);
    }

    // Si viene con items, crearlos
    if (itemsValidos.length > 0) {
      const detallesAInsertar = itemsValidos.map((it) => ({
        id_comanda: comandaCreada.id_comanda,
        id_producto: Number(it.idProducto),
        cantidad: Number(it.cantidad),
        nota: it.nota ?? null,
      }));

      const { error: errDetalles } = await supabase.from("detalle_comanda").insert(detallesAInsertar);
      if (errDetalles) {
        await supabase.from("comanda").delete().eq("id_comanda", comandaCreada.id_comanda);
        await limpiarVentaCreada();
        throw new Error(`Error al insertar detalle_comanda: ${errDetalles.message}`);
      }
    }

    const comandaFinal = await this.obtenerPorId(comandaCreada.id_comanda);

    if (datos.idMesa) {
      await this.registrarHistorialMesa(
        datos.idMesa,
        idVenta ?? null,
        idUsuarioValido ?? null,
        "Ocupada",
        `Comanda #${comandaCreada.id_comanda}`
      );
    }

    return comandaFinal!;
  }

  private async registrarHistorialMesa(
    idMesa: number,
    idVenta: number | null,
    idUsuario: number | null,
    estado: string,
    motivo: string
  ): Promise<void> {
    try {
      let usuarioId = idUsuario;
      if (!usuarioId) {
        const { data } = await supabase
          .from("usuario")
          .select("id_usuario")
          .limit(1)
          .maybeSingle();
        usuarioId = data?.id_usuario ?? null;
      }
      if (!usuarioId) return;

      const { error } = await supabase.from("historial_mesa").insert({
        id_mesa: idMesa,
        id_venta: idVenta,
        id_usuario: usuarioId,
        estado,
        motivo,
      });
      if (error) console.error(`No se pudo registrar historial_mesa: ${error.message}`);
    } catch (e) {
      console.error("Error al registrar historial de mesa:", e);
    }
  }

  async actualizarComanda(id: number, cambios: ActualizarComanda): Promise<void> {
    const campos: Record<string, unknown> = {};
    if (cambios.estado !== undefined) campos.estado = cambios.estado;
    if (cambios.observacion !== undefined) campos.observacion = cambios.observacion;
    if (cambios.fechaDespachada !== undefined) {
      campos.fecha_despachada = cambios.fechaDespachada ? cambios.fechaDespachada.toISOString() : null;
    } else if (cambios.estado === 'Lista' || cambios.estado === 'Entregada') {
      campos.fecha_despachada = new Date().toISOString();
    }
    if (cambios.idUsuario !== undefined) campos.id_usuario = cambios.idUsuario;

    if (Object.keys(campos).length === 0) return;

    const { error } = await supabase
      .from("comanda")
      .update(campos)
      .eq("id_comanda", id);

    if (error) {
      throw new Error(`Error al actualizar comanda: ${error.message}`);
    }

    if (cambios.estado === "Cerrado" || (cambios.estado as any) === EstadoComanda.Cerrado) {
      const comandaActual = await this.obtenerPorId(id);
      if (comandaActual?.idVenta) {
        const { data: otras, error: errOtras } = await supabase
          .from("comanda")
          .select("id_comanda, estado")
          .eq("id_venta", comandaActual.idVenta)
          .neq("id_comanda", id)
          .neq("estado", "Cerrado");
        if (errOtras) {
          throw new Error(`Error al verificar comandas abiertas: ${errOtras.message}`);
        }

        const quedanAbiertas = (otras || []).length > 0;
        if (!quedanAbiertas) {
          const { error: errVentaCierre } = await supabase
            .from("venta")
            .update({
              estado: "Pagada",
              fecha_cierre: new Date().toISOString(),
            })
            .eq("id_venta", comandaActual.idVenta);
          if (errVentaCierre) {
            throw new Error(`Error al cerrar la venta: ${errVentaCierre.message}`);
          }
        }

        if (comandaActual.idMesa) {
          const { data: ventasDeMesa } = await supabase
            .from("venta")
            .select("id_venta")
            .eq("id_mesa", comandaActual.idMesa);

          const idsVentas = (ventasDeMesa || []).map((v) => v.id_venta);

          let comandasActivasEnMesa = 0;
          if (idsVentas.length > 0) {
            const { data: comsRestantes } = await supabase
              .from("comanda")
              .select("id_comanda")
              .in("id_venta", idsVentas)
              .neq("id_comanda", id)
              .neq("estado", "Cerrado");
            comandasActivasEnMesa = (comsRestantes || []).length;
          }

          if (comandasActivasEnMesa === 0) {
            const { error: errMesaLibre } = await supabase
              .from("mesa")
              .update({ estado: "Libre" })
              .eq("id_mesa", comandaActual.idMesa);
            if (errMesaLibre) {
              console.warn(`Aviso al liberar mesa: ${errMesaLibre.message}`);
            }

            await supabase
              .from("venta")
              .update({
                estado: "Pagada",
                fecha_cierre: new Date().toISOString(),
              })
              .eq("id_mesa", comandaActual.idMesa)
              .eq("estado", "Abierta");

            await this.registrarHistorialMesa(
              comandaActual.idMesa,
              comandaActual.idVenta,
              comandaActual.idUsuario ?? null,
              "Libre",
              `Comanda #${id} cerrada`
            );
          }
        }
      }
    }
  }
}
