import express from "express";
import cors from "cors";
import usuarioRutas from "./rutas/Usuario.rutas.js";
import UnidadMedidaRutas from "./rutas/UnidadMedida.rutas.js";
import authRutas from "./rutas/Auth.rutas.js";
import  categoriaRutas  from "./rutas/Categoria.rutas.js";
import seccionRutas from "./rutas/Seccion.rutas.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json());

app.get("/", (_req, res) => {
    res.json({ success: true, message: "El backend Funcionaaaa" });
});

app.use("/api/usuarios", usuarioRutas);
app.use("/api/unidades-medida", UnidadMedidaRutas);
app.use("/api/categorias", categoriaRutas);
app.use("/api/secciones", seccionRutas);
app.use("/auth", authRutas);

app.use(errorMiddleware);

export default app;