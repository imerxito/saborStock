import { Router } from 'express';
import { ConfiguracionControlador } from '../controladores/ConfiguracionControlador.js';

const router = Router();
const controlador = new ConfiguracionControlador();

// Negocio
router.get('/negocio', (req, res) => controlador.obtenerNegocio(req, res));
router.put('/negocio', (req, res) => controlador.actualizarNegocio(req, res));

// Facturacion
router.get('/facturacion', (req, res) => controlador.obtenerFacturacion(req, res));
router.put('/facturacion', (req, res) => controlador.actualizarFacturacion(req, res));

// Impresoras
router.get('/impresoras-sistema', (req, res) => controlador.listarImpresorasSistema(req, res));
router.get('/impresoras', (req, res) => controlador.listarImpresoras(req, res));
router.post('/impresoras', (req, res) => controlador.crearImpresora(req, res));
router.put('/impresoras/:id', (req, res) => controlador.actualizarImpresora(req, res));
router.delete('/impresoras/:id', (req, res) => controlador.eliminarImpresora(req, res));
router.post('/impresoras/:id/probar', (req, res) => controlador.probarImpresora(req, res));
router.post('/impresoras/:id/imprimir', (req, res) => controlador.imprimirComanda(req, res));

// Rutas de impresion
router.get('/rutas', (req, res) => controlador.listarRutas(req, res));
router.post('/rutas', (req, res) => controlador.asignarRuta(req, res));

// Metodos de pago
router.get('/pagos', (req, res) => controlador.obtenerPagos(req, res));
router.put('/pagos', (req, res) => controlador.guardarPagos(req, res));

export default router;
