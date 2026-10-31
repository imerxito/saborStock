import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvier } from './contexto/AuthContexto';
import { ComandasProvider } from './contexto/ComandasContexto';
import { RutaProtegida } from './componentes/RutaProtegida';
import Inicio from './paginas/Inicio';
import Dashboard from './paginas/Dashboard';
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvier>
        <ComandasProvider>
          <Routes>
            {/* /login y /registro usan el MISMO componente para que la transición funcione */}
            <Route path="/:modo" element={<Inicio />} />
            <Route
              path="/inicio"
              element={
                <RutaProtegida>
                  <Dashboard />
                </RutaProtegida>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ComandasProvider>
      </AuthProvier>
    </BrowserRouter>
  );
}

export default App;