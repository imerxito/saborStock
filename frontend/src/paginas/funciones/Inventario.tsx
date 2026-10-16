function Inventario() {
    return (
        <>
            <div className="barra-herramientas">
                <input className="buscador" placeholder="Buscar insumo..." />
                <button className="btn">Nuevo insumo</button>
            </div>

            <div className="tabla-contenedor">
                <table className="tabla">
                    <thead>
                        <tr>
                            <th>Insumo</th>
                            <th>Stock</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Arroz</td>
                            <td>
                                <div className="progreso progreso--alerta">
                                    <div className="progreso__etiqueta">
                                        <span>12 kg</span>
                                        <span>30%</span>
                                    </div>
                                    <div className="progreso__pista">
                                        <div className="progreso__barra" style={{ width: "30%" }} />
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span className="estado estado--alerta">Stock bajo</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default Inventario;