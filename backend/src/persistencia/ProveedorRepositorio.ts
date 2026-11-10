import {supabase} from "../configuracion/Supabase.js";
import {Proveedor, CrearProveedor, ActualizarProveedor, ProveedorRow} from "../modelos/Proveedor.js";

function mapearProveedorRow(row: ProveedorRow): Proveedor {
    return {
        id_proveedor: row.id_proveedor,
        documento: row.documento,
        nombre: row.nombre,
        telefono: row.telefono ?? null,
        correo: row.correo ?? null,
        direccion: row.direccion ?? null,
        activo: row.activo
    };
}

export class ProveedorRepositorio {
    async listar(): Promise<Proveedor[]> {
        const {data, error} = await supabase
            .from("proveedor")
            .select("*")
            .order("id_proveedor", {ascending: true});  

        if (error) {
            throw new Error("Error al listar proveedores");
        }

        return data.map(mapearProveedorRow);
    }

    async obtenerPorId(id: number): Promise<Proveedor | null> {
        const {data, error} = await supabase
            .from("proveedor")
            .select("*")
            .eq("id_proveedor", id)
            .maybeSingle();
        if (error) {
            throw new Error("Error al obtener proveedor");
        }

        return data ? mapearProveedorRow(data) : null;
    }

    async crear(datos: CrearProveedor): Promise<Proveedor> {
        const {data, error} = await supabase
            .from("proveedor")
            .insert(datos)
            .select("*")
            .single();
        if (error) {
            throw new Error("Error al crear proveedor");
        }

        return mapearProveedorRow(data);
    }

    async actualizar(id: number, datos: ActualizarProveedor): Promise<Proveedor> {
        const {data, error} = await supabase
            .from("proveedor")
            .update(datos)
            .eq("id_proveedor", id)
            .select("*")
            .single();
        if (error) {
            throw new Error("Error al actualizar proveedor");
        }

        return mapearProveedorRow(data);
    }

    async desactivar(id: number): Promise<void> {
        const {error} = await supabase
            .from("proveedor")
            .update({activo: false})
            .eq("id_proveedor", id);
        if (error) {
            throw new Error("Error al desactivar proveedor");
        }
    }

    async activar(id: number): Promise<void> {
        const {error} = await supabase
            .from("proveedor")
            .update({activo: true})
            .eq("id_proveedor", id);
        if (error) {
            throw new Error("Error al activar proveedor");
        }
    }
    async eliminar(id: number): Promise<void> {
        const {error} = await supabase
            .from("proveedor")
            .delete()
            .eq("id_proveedor", id);
        if (error) {
            throw new Error("Error al eliminar proveedor");
        }
    }
}