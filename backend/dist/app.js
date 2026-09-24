import express from "express";
import cors from "cors";
import usuarioRutas from "./rutas/Usuario.rutas.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
const app = express();
app.use(cors({
    origin: "http://localhost5173",
    credentials: true,
}));
app.use(express.json());
app.get("/", (_req, res) => {
    res.json({ success: true, message: "El backend Funcionaaaa" });
});
app.use("/api/usuarios", usuarioRutas);
app.use(errorMiddleware);
export default app;
