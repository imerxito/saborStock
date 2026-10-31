import { useEffect, useRef } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import logo from "../assets/SaborYStock (1).png";
import { Login } from "./Login";
import { Registro } from "./Registro";
import "../estilos/principal.css";

type Modo = "login" | "registro";

export default function Auth() {
  const { modo: param } = useParams();
  const navigate = useNavigate();
  const modo: Modo = param === "registro" ? "registro" : "login";
  const esRegistro = modo === "registro";

  const loginRef = useRef<HTMLDivElement>(null);
  const registroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = modo === "login" ? loginRef.current : registroRef.current;
    const t = setTimeout(() => {
      panel?.querySelector("input")?.focus();
    }, 500);
    return () => clearTimeout(t);
  }, [modo]);

  const cambiar = (nuevo: Modo) => navigate(`/${nuevo}`);

  if (param !== "login" && param !== "registro") {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="auth-canvas">
      <h1 className="sr-only">Sabor&amp;Stock — Gestión Gastronómica</h1>

      <div className={`auth-card auth-split${esRegistro ? " modo-registro" : ""}`}>

        {/* ── PANEL LOGIN (izquierda) ── */}
        <div
          ref={loginRef}
          aria-hidden={esRegistro}
          className="auth-panel auth-panel--login"
        >
          {/* Logo solo desktop, esquina superior */}
          <div className="auth-marca-corner">
            <div className="auth-brand-pill">
              <img src={logo} alt="Sabor &amp; Stock" />
            </div>
            <div className="auth-brand-text">
              <span className="auth-brand-name">Sabor<span>&</span>Stock</span>
              <span className="auth-brand-tag">Gestión Gastronómica</span>
            </div>
          </div>
          <div className="auth-panel-inner">
            <Login />
          </div>
        </div>

        {/* ── PANEL REGISTRO (derecha) ── */}
        <div
          ref={registroRef}
          aria-hidden={!esRegistro}
          className="auth-panel auth-panel--registro"
        >
          <div className="auth-marca-corner">
            <div className="auth-brand-pill">
              <img src={logo} alt="Sabor &amp; Stock" />
            </div>
            <div className="auth-brand-text">
              <span className="auth-brand-name">Sabor<span>&</span>Stock</span>
              <span className="auth-brand-tag">Gestión Gastronómica</span>
            </div>
          </div>
          <div className="auth-panel-inner">
            <Registro />
          </div>
        </div>

        {/* ── PANEL VISUAL DESLIZANTE (solo desktop) ── */}
        <div className="auth-visual" aria-hidden="true">
          {/* Destellos decorativos */}
          <div className="auth-visual-glow glow-top" />
          <div className="auth-visual-glow glow-bottom" />
          <div className="auth-visual-ring ring-1" />
          <div className="auth-visual-ring ring-2" />

          {/* Logo centrado */}
          <div className="auth-visual-logo">
            <div className="auth-visual-logo-pill">
              <img src={logo} alt="Sabor &amp; Stock" />
            </div>
          </div>

          {/* Texto + botón para login (visible cuando modo=login) */}
          <div className={`auth-visual-content${!esRegistro ? " visible" : ""}`}>
            <p className="auth-visual-subtitle">¿Aún no tienes cuenta?</p>
            <button
              type="button"
              onClick={() => cambiar("registro")}
              className="auth-visual-btn"
            >
              <UserPlus size={16} />
              <span>Registrarme</span>
            </button>
          </div>

          {/* Texto + botón para registro (visible cuando modo=registro) */}
          <div className={`auth-visual-content${esRegistro ? " visible" : ""}`}>
            <p className="auth-visual-subtitle">¿Ya tienes cuenta?</p>
            <button
              type="button"
              onClick={() => cambiar("login")}
              className="auth-visual-btn"
            >
              <LogIn size={16} />
              <span>Iniciar sesión</span>
            </button>
          </div>
        </div>

        {/* ── CABECERA MÓVIL ── */}
        <div className="auth-movil-header">
          <div className="auth-brand-pill">
            <img src={logo} alt="Sabor &amp; Stock" />
          </div>
          <div className="auth-brand-text">
            <span className="auth-brand-name">Sabor<span>&</span>Stock</span>
            <span className="auth-brand-tag">Gestión Gastronómica</span>
          </div>
        </div>

        {/* ── PESTAÑAS MÓVIL ── */}
        <div className="auth-tabs-control auth-movil-tabs" role="tablist">
          <span
            aria-hidden="true"
            className={`auth-tab-indicator${esRegistro ? " desplazado" : ""}`}
          />
          <button
            type="button"
            role="tab"
            aria-selected={!esRegistro}
            className={`auth-tab-btn${!esRegistro ? " active" : ""}`}
            onClick={() => cambiar("login")}
          >
            <LogIn size={15} />
            <span>Iniciar sesión</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={esRegistro}
            className={`auth-tab-btn${esRegistro ? " active" : ""}`}
            onClick={() => cambiar("registro")}
          >
            <UserPlus size={15} />
            <span>Registrarme</span>
          </button>
        </div>

      </div>
    </main>
  );
}
