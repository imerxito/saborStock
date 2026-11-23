import { Request, Response, NextFunction } from "express";

/**
 * Middleware para validar que solo usuarios con rol Dueño o Administrador
 * puedan realizar operaciones de creación, edición o eliminación.
 */
export function autorizarGerencia(req: Request, res: Response, next: NextFunction): void {
    const rol = String(req.headers["x-user-role"] || "").toLowerCase();
    const esGerencia = rol.includes("due") || rol.includes("admin");

    if (!esGerencia) {
        res.status(403).json({
            mensaje: "Acceso denegado. Solo el Dueño y el Administrador tienen permisos para realizar esta acción.",
        });
        return;
    }

    next();
}

/**
 * Middleware para la actualización de productos:
 * - Si solo se modifica el estado 'activo' (activar/desactivar), se permite a Cocineros, Caja y Gerencia.
 * - Si se modifican otros campos (precio, nombre, categoría, receta), se requiere Dueño o Administrador.
 */
export function autorizarEdicionProducto(req: Request, res: Response, next: NextFunction): void {
    const keys = Object.keys(req.body || {});
    const soloCambiaActivo = keys.length > 0 && keys.every((k) => k === "activo");

    if (soloCambiaActivo) {
        return next();
    }

    return autorizarGerencia(req, res, next);
}

