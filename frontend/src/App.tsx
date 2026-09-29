import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvier } from './contexto/AuthContexto';
import { RutaProtegida } from './componentes/RutaProtegida';
import { Login } from './paginas/Login';
import { Registro } from './paginas/Registro';
import { Inicio } from './paginas/Inicio';
function App() {
return (
<BrowserRouter>
<AuthProvier>
<Routes>
<Route path="/login" element={<Login />} />
<Route path="/registro" element={<Registro />} />
<Route
path="/inicio"
element={
<RutaProtegida>
<Inicio />
</RutaProtegida>
}
/>
<Route path="*" element={<Navigate to="/login" replace />} />
</Routes>
</AuthProvier>
</BrowserRouter>);
}
export default App;