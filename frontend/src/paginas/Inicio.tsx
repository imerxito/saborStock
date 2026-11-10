import { useEffect, useRef } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { LogIn, UserPlus, UtensilsCrossed, ShieldCheck } from "lucide-react";
import logo from "../assets/SaborYStock (1).png";
import { Login } from "./Login";
import { Registro } from "./Registro";

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
    }, 300);
    return () => clearTimeout(t);
  }, [modo]);

  const cambiar = (nuevo: Modo) => navigate(`/${nuevo}`);

  if (param !== "login" && param !== "registro") {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="relative isolate min-h-[100dvh] w-full flex items-center justify-center p-3 sm:p-6 md:p-8 md:h-[100dvh] md:overflow-hidden bg-[#070D1F] overflow-x-hidden custom-scrollbar">
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 9999px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb,
        .custom-scrollbar:active::-webkit-scrollbar-thumb {
          background: rgba(91, 192, 222, 0.35);
        }
        .auth-grid {
          background-image:
            linear-gradient(rgba(91, 192, 222, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(91, 192, 222, 0.06) 1px, transparent 1px);
          background-size: 44px 44px;
          -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
        }
      `}</style>

      <h1 className="sr-only">Sabor&Stock — Gestión Gastronómica</h1>

      {/* FONDO DE PANTALLA (decorativo) */}
      <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B132B] via-[#070D1F] to-[#101A36]" />
        <div className="auth-grid absolute inset-0" />
        <div className="absolute -top-40 -left-40 w-[34rem] h-[34rem] rounded-full bg-[#5BC0DE]/15 blur-3xl" />
        <div className="absolute -bottom-48 -right-32 w-[36rem] h-[36rem] rounded-full bg-[#D97706]/10 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-[#3A506B]/20 blur-3xl" />
      </div>

      {/*
        TARJETA PRINCIPAL:
        Móvil: fluye con el scroll natural.
        Escritorio: tarjeta grande y centrada que deja ver el fondo alrededor.
      */}
      <div className="relative w-full md:w-[88vw] max-w-[1100px] bg-[#1C2541] border border-[#3A506B] rounded-3xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] flex flex-col md:grid md:grid-cols-2 md:h-[90%] md:max-h-[700px] md:overflow-hidden">
        {/* HEADER MÓVIL */}
        <div className="md:hidden flex flex-col p-4 border-b border-[#3A506B] bg-[#0B132B] shrink-0 rounded-t-3xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center p-2 bg-[#1C2541] border border-[#3A506B] rounded-2xl shrink-0">
              <img src={logo} alt="Sabor & Stock" className="h-6 w-auto object-contain" />
            </div>
            <div className="min-w-0">
              <span className="text-base font-black text-[#F4D6B0] tracking-tight block">
                Sabor<span className="text-[#5BC0DE]">&</span>Stock
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 bg-[#1C2541] p-1 rounded-xl gap-1">
            <button
              type="button"
              className={`py-2.5 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !esRegistro ? "bg-[#5BC0DE] text-[#0B132B] shadow-sm" : "text-[#F4D6B0] hover:bg-[#3A506B]/50"
              }`}
              onClick={() => cambiar("login")}
            >
              <LogIn size={15} />
              <span>Iniciar sesión</span>
            </button>
            <button
              type="button"
              className={`py-2.5 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                esRegistro ? "bg-[#5BC0DE] text-[#0B132B] shadow-sm" : "text-[#F4D6B0] hover:bg-[#3A506B]/50"
              }`}
              onClick={() => cambiar("registro")}
            >
              <UserPlus size={15} />
              <span>Registrarse</span>
            </button>
          </div>
        </div>

        {/* LOGIN PANEL */}
        <div
          ref={loginRef}
          className={`p-5 sm:p-8 lg:p-10 xl:p-12 flex flex-col bg-[#1C2541] w-full justify-start md:justify-center md:h-full md:overflow-y-auto custom-scrollbar rounded-b-3xl md:rounded-none ${
            esRegistro ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="w-full max-w-md mx-auto">
            <div className="hidden md:flex items-center gap-4 mb-10">
              <div className="flex items-center justify-center p-3 bg-[#0B132B] border border-[#3A506B] rounded-2xl">
                <img src={logo} alt="Sabor & Stock" className="h-10 w-auto object-contain" />
              </div>
              <div>
                <span className="text-2xl font-black text-[#F4D6B0] tracking-tight">
                  Sabor<span className="text-[#5BC0DE]">&</span>Stock
                </span>
                <p className="text-xs font-bold text-[#5BC0DE] uppercase tracking-wider">
                  Gestión Gastronómica
                </p>
              </div>
            </div>
            <Login />
          </div>
        </div>

        {/* REGISTRO PANEL */}
        <div
          ref={registroRef}
          className={`p-5 sm:p-8 lg:p-10 xl:p-12 flex flex-col bg-[#1C2541] w-full justify-start md:justify-center md:h-full md:overflow-y-auto custom-scrollbar rounded-b-3xl md:rounded-none ${
            !esRegistro ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="w-full max-w-md mx-auto">
            <div className="hidden md:flex items-center gap-4 mb-8">
              <div className="flex items-center justify-center p-3 bg-[#0B132B] border border-[#3A506B] rounded-2xl">
                <img src={logo} alt="Sabor & Stock" className="h-10 w-auto object-contain" />
              </div>
              <div>
                <span className="text-2xl font-black text-[#F4D6B0] tracking-tight">
                  Sabor<span className="text-[#5BC0DE]">&</span>Stock
                </span>
                <p className="text-xs font-bold text-[#5BC0DE] uppercase tracking-wider">
                  Gestión Gastronómica
                </p>
              </div>
            </div>
            <Registro />
          </div>
        </div>

        {/* PANEL DESLIZANTE DE ESCRITORIO */}
        <div
          className={`hidden md:flex absolute top-0 bottom-0 w-1/2 bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#3A506B] border-l border-[#3A506B] p-10 lg:p-12 flex-col justify-between text-white transition-transform duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] z-20 ${
            esRegistro ? "translate-x-0 left-0 border-l-0 border-r border-[#3A506B]" : "translate-x-full left-0"
          }`}
        >
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#5BC0DE]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#D97706]/10 rounded-full blur-3xl pointer-events-none" />

          {!esRegistro ? (
            <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto">
              <div className="p-5 bg-[#1C2541]/80 backdrop-blur-md border border-[#3A506B] rounded-3xl shadow-lg mb-8 text-[#5BC0DE]">
                <UtensilsCrossed size={48} />
              </div>
              <h2 className="text-4xl font-black tracking-tight text-[#F4D6B0] mb-4">
                ¿Nuevo por aquí?
              </h2>
              <p className="text-base font-medium text-[#5BC0DE] max-w-md mb-10 leading-relaxed">
                Optimiza el flujo de tu restaurante. Controla mesas, comandas e inventarios en tiempo real con precisión.
              </p>
              <button
                type="button"
                onClick={() => cambiar("registro")}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-[#0B132B] bg-[#F4D6B0] hover:bg-[#e3c29b] active:scale-95 shadow-lg transition-all cursor-pointer"
              >
                <UserPlus size={20} />
                <span>Crear cuenta corporativa</span>
              </button>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto">
              <div className="p-5 bg-[#1C2541]/80 backdrop-blur-md border border-[#3A506B] rounded-3xl shadow-lg mb-8 text-[#4ADE80]">
                <ShieldCheck size={48} />
              </div>
              <h2 className="text-4xl font-black tracking-tight text-[#F4D6B0] mb-4">
                ¿Ya tienes acceso?
              </h2>
              <p className="text-base font-medium text-[#5BC0DE] max-w-md mb-10 leading-relaxed">
                Vuelve al panel principal para continuar gestionando las operaciones y turnos de tu local.
              </p>
              <button
                type="button"
                onClick={() => cambiar("login")}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-[#0B132B] bg-[#F4D6B0] hover:bg-[#e3c29b] active:scale-95 shadow-lg transition-all cursor-pointer"
              >
                <LogIn size={20} />
                <span>Iniciar sesión</span>
              </button>
            </div>
          )}

          <div className="relative z-10 text-center text-sm font-semibold text-[#F4D6B0]">
            Sabor&Stock &copy; {new Date().getFullYear()} — Sistema Gastronómico Profesional
          </div>
        </div>
      </div>
    </main>
  );
}