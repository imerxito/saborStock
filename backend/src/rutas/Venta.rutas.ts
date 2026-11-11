import { Router } from 'express';
import { VentaControlador } from '../controladores/VentaControlador.js';

const router = Router();
const ctrl = new VentaControlador();

router.get('/', (req, res) => ctrl.listar(req, res));
router.get('/:id', (req, res) => ctrl.obtenerPorId(req, res));
router.get('/mesa/:idMesa', (req, res) => ctrl.listarPorMesa(req, res));
router.post('/', (req, res) => ctrl.crear(req, res));
router.put('/:id', (req, res) => ctrl.actualizar(req, res));
router.patch('/:id/cerrar', (req, res) => ctrl.cerrar(req, res));
router.patch('/:id/anular', (req, res) => ctrl.anular(req, res));

export default router;
