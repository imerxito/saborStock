import { Router } from "express";
import { CompraControlador } from "../controladores/CompraControlador.js";

const router = Router();
const compraControlador = new CompraControlador();

router.get("/", (req, res) =>
    compraControlador.listar(req, res)
);

router.get("/:id", (req, res) =>
    compraControlador.obtenerPorId(req, res)
);

router.post("/", (req, res) =>
    compraControlador.crear(req, res)
);

router.put("/:id", (req, res) =>
    compraControlador.actualizar(req, res)
);

export default router;