import { fetchJson } from "./api";

export interface PagoNomina {
  id: number | string;
  idUsuario: number;
  idTurnoCaja?: number | null;
  empleado: string;
  cedula: string;
  telefono: string;
  cargo: string;
  montoBase: number;
  bono: number;
  montoTotal: number;
  metodo: string;
  fecha: string;
}

export interface CrearPagoNominaPayload {
  idUsuario: number;
  idTurnoCaja?: number | null;
  montoBase: number;
  bono?: number;
  metodoPago?: string;
  fecha?: string;
  registrarEgresoCaja?: boolean;
  idUsuarioOperador?: number;
}

export const NominaServicio = {
  async listar(): Promise<PagoNomina[]> {
    const data = await fetchJson<any[]>("/api/nomina");
    return (data || []).map((row) => ({
      id: row.id,
      idUsuario: row.idUsuario,
      idTurnoCaja: row.idTurnoCaja,
      empleado: row.empleado || `Empleado #${row.idUsuario}`,
      cedula: row.cedula || "",
      telefono: row.telefono || "",
      cargo: row.cargo || "Empleado",
      montoBase: Number(row.montoBase || 0),
      bono: Number(row.bono || 0),
      montoTotal: Number(row.montoTotal || 0),
      metodo: row.metodoPago || "Efectivo",
      fecha: row.fecha ? new Date(row.fecha).toLocaleString() : new Date().toLocaleString(),
    }));
  },

  async crear(payload: CrearPagoNominaPayload): Promise<PagoNomina> {
    const row = await fetchJson<any>("/api/nomina", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return {
      id: row.id,
      idUsuario: row.idUsuario,
      idTurnoCaja: row.idTurnoCaja,
      empleado: row.empleado,
      cedula: row.cedula || "",
      telefono: row.telefono || "",
      cargo: row.cargo || "Empleado",
      montoBase: Number(row.montoBase || 0),
      bono: Number(row.bono || 0),
      montoTotal: Number(row.montoTotal || 0),
      metodo: row.metodoPago || "Efectivo",
      fecha: row.fecha ? new Date(row.fecha).toLocaleString() : new Date().toLocaleString(),
    };
  },

  async eliminar(id: number | string): Promise<void> {
    await fetchJson<any>(`/api/nomina/${id}`, {
      method: "DELETE",
    });
  },
};
