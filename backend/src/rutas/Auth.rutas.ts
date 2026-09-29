import { Router } from "express";
import { AuthControlador } from "../controladores/AuthControlador.js";

const router = Router();
const authControlador = new AuthControlador();

router.post("/login", (req, res) => authControlador.login(req, res));
router.post("/register", (req, res) => authControlador.registrar(req, res));

export default router;