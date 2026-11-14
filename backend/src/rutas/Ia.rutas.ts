import { Router } from "express";
import { IaControlador } from "../controladores/IaControlador.js";

const iaControlador = new IaControlador();
const router = Router();

router.post("/chat", (req, res) => iaControlador.chat(req, res));
router.get("/conversaciones", (req, res) => iaControlador.listarConversaciones(req, res));
router.get("/conversaciones/:id", (req, res) => iaControlador.obtenerConversacion(req, res));
router.delete("/conversaciones/:id", (req, res) => iaControlador.eliminarConversacion(req, res));
router.post("/excel", (req, res) => iaControlador.procesarExcel(req, res));
router.post("/excel/confirmar", (req, res) => iaControlador.confirmarExcel(req, res));

export default router;
