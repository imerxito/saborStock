import { useEffect, useRef } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import logo from "../assets/SaborYStock (1).png";
import { Login } from "./Login";
import { Registro } from "./Registro";
import "../estilos/Principal.css"; // al final, para que gane sobre otros CSS

type Modo = "login" | "registro";

export default function Auth() {
  const { modo: param } = useParams(); // viene de la ruta /:modo
  const navigate = useNavigate();
  const modo: Modo = param === "registro" ? "registro" : "login";

  const refLogin = useRef<HTMLElement>(null);
  const refRegistro = useRef<HTMLElement>(null);

  // Foco en el primer campo del formulario que aparece
  useEffect(() => {
    const el = modo === "login" ? refLogin.current : refRegistro.current;
    const t = setTimeout(() => el?.querySelector("input")?.focus(), 450);
    return () => clearTimeout(t);
  }, [modo]);

  const cambiar = (nuevo: Modo) => navigate(`/${nuevo}`);

  // Si la URL no es /login ni /registro, vuelve a /login
  if (param !== "login" && param !== "registro") {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="auth-contenedor">
      <div className={`auth-tarjeta auth-split ${modo === "registro" ? "registro" : ""}`}>
        {/* Izquierda: tu componente Login */}
        <section
          ref={refLogin}
          className="auth-panel auth-panel--login"
          aria-hidden={modo !== "login"}
        >
          <Login />
        </section>

        {/* Derecha: tu componente Registro */}
        <section
          ref={refRegistro}
          className="auth-panel auth-panel--registro"
          aria-hidden={modo !== "registro"}
        >
          <Registro />
        </section>

        {/* Panel visual deslizante */}
        <aside className="auth-visual" aria-hidden="true">
          <div className="auth-visual-marca">
            <div className="auth-logo auth-logo--marco">
              <img src={logo} alt="" />
            </div>
            <span className="auth-marca-nombre">
              Sabor<span>&amp;</span>Stock
            </span>
          </div>

          <div className="auth-visual-textos">
            <div className="auth-visual-texto auth-visual-texto--login">
              <h3>¿Aún no tienes cuenta?</h3>
              <p>Regístrate y empieza en pocos pasos.</p>
              <button
                type="button"
                className="auth-boton-ghost"
                tabIndex={modo === "login" ? 0 : -1}
                onClick={() => cambiar("registro")}
              >
                Registrarme
              </button>
            </div>
            <div className="auth-visual-texto auth-visual-texto--registro">
              <h3>¡Bienvenido de nuevo!</h3>
              <p>Si ya tienes cuenta, ingresa con tus datos.</p>
              <button
                type="button"
                className="auth-boton-ghost"
                tabIndex={modo === "registro" ? 0 : -1}
                onClick={() => cambiar("login")}
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}