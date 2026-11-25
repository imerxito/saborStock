import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions= {
  origin: (origin, callback) => {
    const permitido =
      !origin || // Postman, curl, etc.
      origin === 'http://localhost:5173' ||
      /^https:\/\/sabor-stock.*\.vercel\.app$/.test(origin);

    callback(null, permitido);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Role', 'X-User-Id'],
  optionsSuccessStatus: 204,
};

// Antes de las rutas. También responde los preflight (OPTIONS).
app.use(cors(corsOptions));
app.use(express.json());

// ---- Rutas ----
app.get('/api/inventario', (req, res) => {
  res.json({ mensaje: '¡Hola desde el backend de saborStock!' });
});

app.post('/auth/login', (req, res) => {
  // tu lógica de login
});

app.get('/api/comandas', (req, res) => {
  // tu lógica de comandas
});
// ---------------

// Solo escucha en local; en Vercel no se usa listen()
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
  });
}

// Obligatorio para Vercel
export default app;