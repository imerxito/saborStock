import express from "express";
import cors from "cors";
import usuarioRutas from "./rutas/Usuario.rutas.js";
import authRutas from "./rutas/Auth.rutas.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import productoRutas from "./rutas/Producto.rutas.js";
import ingredienteRutas from "./rutas/Ingrediente.rutas.js";
import movimientoInventarioRutas from "./rutas/MovimientoInventario.rutas.js";
const app = express();
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express.json());
app.get("/", (_req, res) => {
    res.json({ success: true, message: "El backend Funcionaaaa" });
});
app.use("/api/usuarios", usuarioRutas);
app.use("/api/productos", productoRutas);
app.use("/api/ingredientes", ingredienteRutas);
app.use("/api/movimientos-inventario", movimientoInventarioRutas);
app.use("/auth", authRutas);
app.use(errorMiddleware);
export default app;
