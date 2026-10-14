import { useState, type ReactNode } from "react";
import logo from "../assets/SaborYStock (1).png";
import "../estilos/Dashboard.css";

function Dashboard(){
    return(
        <div className="Contenedor">
            <nav className="navegador">
                <div className="logo">
                    <img src={logo} />
                </div>
                <p>Holas</p>
            </nav>
            <aside>
                <button>

                </button>
                <button>

                </button>
            </aside>
            <main>

            </main>
        </div>
    )
}

export default Dashboard;