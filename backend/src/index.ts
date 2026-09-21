import express from 'express';

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/api/inventario', (req, res) => {
  res.json({ mensaje: '¡Hola desde el backend de saborStock!' });
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
