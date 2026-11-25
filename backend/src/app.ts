import express from "express";
import cors from "cors";
import usuarioRutas from "./rutas/Usuario.rutas.js";
import UnidadMedidaRutas from "./rutas/UnidadMedida.rutas.js";
import authRutas from "./rutas/Auth.rutas.js";
import categoriaRutas from "./rutas/Categoria.rutas.js";
import seccionRutas from "./rutas/Seccion.rutas.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import productoRutas from "./rutas/Producto.rutas.js";
import ingredienteRutas from "./rutas/Ingrediente.rutas.js";
import CajaRutas from "./rutas/Caja.rutas.js";
import movimientoInventarioRutas from "./rutas/MovimientoInventario.rutas.js";
import TurnoCajaRutas from "./rutas/TurnoCaja.rutas.js";
import MesaRutas from "./rutas/Mesa.rutas.js";
import ComandaRutas from "./rutas/Comanda.rutas.js";
import DetalleComandaRutas from "./rutas/DetalleComanda.rutas.js";
import HistorialMesaRutas from "./rutas/HistorialMesa.rutas.js";
import FacturaRutas from "./rutas/Factura.rutas.js";
import DetalleFacturaRutas from "./rutas/DetalleFactura.rutas.js";
import HistorialCajaRutas from "./rutas/HistorialCaja.rutas.js";
import compraRutas from "./rutas/Compra.rutas.js";
import detalleCompraRutas from "./rutas/DetalleCompra.rutas.js";
import recetaRutas from "./rutas/Receta.rutas.js";
import reporteRutas from "./rutas/Reporte.rutas.js";
import ProveedorRutas from "./rutas/Proveedor.rutas.js";
import VentaRutas from "./rutas/Venta.rutas.js";
import IaRutas from "./rutas/Ia.rutas.js";
import CategoriaIngredienteRutas from "./rutas/CategoriaIngrediente.rutas.js";
import ComponenteComboRutas from "./rutas/ComponenteCombo.rutas.js";
import configuracionRutas from "./rutas/Configuracion.rutas.js";
import nominaRutas from "./rutas/Nomina.rutas.js";

const app = express();

app.use(
    cors({
        origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://sabor-stock-7qpi.vercel.app",
        "https://sabor-stock-azure.vercel.app",
        /^http:\/\/192\.168\.\d+\.\d+:5173$/,
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

app.use(express.json());

app.get("/", (_req, res) => {
    res.json({ success: true, message: "El backend Funcionaaaa" });
});

app.use("/api/usuarios", usuarioRutas);
app.use("/api/productos", productoRutas);
app.use("/api/ingredientes", ingredienteRutas);
app.use("/api/movimientoInventario", movimientoInventarioRutas);
app.use("/api/compras", compraRutas);
app.use("/api/detalles-compra", detalleCompraRutas);
app.use("/api/recetas", recetaRutas);
app.use("/api/unidades-medida", UnidadMedidaRutas);
app.use("/api/categorias", categoriaRutas);
app.use("/api/secciones", seccionRutas);
app.use("/api/cajas", CajaRutas);
app.use("/api/turnos-caja", TurnoCajaRutas);
app.use("/auth", authRutas);
app.use("/api/mesas", MesaRutas);
app.use("/api/comandas", ComandaRutas);
app.use("/api/detalles-comanda", DetalleComandaRutas);
app.use("/api/historial-mesas", HistorialMesaRutas);
app.use("/api/facturas", FacturaRutas);
app.use("/api/ventas", VentaRutas);
app.use("/api/ia", IaRutas);
app.use("/api/detalles-factura", DetalleFacturaRutas);
app.use("/api/historial-caja", HistorialCajaRutas);
app.use("/api/reportes", reporteRutas);
app.use("/api/proveedores", ProveedorRutas);
app.use("/api/categorias-ingrediente", CategoriaIngredienteRutas);
app.use("/api/componentes-combo", ComponenteComboRutas);
app.use("/api/configuracion", configuracionRutas);
app.use("/api/nomina", nominaRutas);
app.use(errorMiddleware);

export default app;
