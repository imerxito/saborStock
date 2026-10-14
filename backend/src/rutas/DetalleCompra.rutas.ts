import { Router } from "express";
import { DetalleCompraControlador } from "../controladores/DetalleCompraControlador.js";

const router = Router();
const detalleCompraControlador = new DetalleCompraControlador();

router.get("/", (req, res) =>
    detalleCompraControlador.listar(req, res)
);

router.get("/compra/:idCompra", (req, res) =>
    detalleCompraControlador.listarPorCompra(req, res)
);

router.get("/:idCompra/:idIngrediente", (req, res) =>
    detalleCompraControlador.obtenerPorId(req, res)
);

router.post("/", (req, res) =>
    detalleCompraControlador.crear(req, res)
);

router.put("/:idCompra/:idIngrediente", (req, res) =>
    detalleCompraControlador.actualizar(req, res)
);

router.delete("/:idCompra/:idIngrediente", (req, res) =>
    detalleCompraControlador.eliminar(req, res)
);

export default router;