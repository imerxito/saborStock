import {Router} from 'express';
import { SeccionControlador } from '../controladores/SeccionControladro.js';

const router = Router();
const seccionControlador = new SeccionControlador();

router.get('/', (req, res) => seccionControlador.listar(req, res));
router.get('/:id', (req, res) => seccionControlador.obtenerPorId(req, res));
router.post('/', (req, res) => seccionControlador.crear(req, res));
router.put('/:id', (req, res) => seccionControlador.actualizar(req, res));
router.get('/nombre/:nombre', (req, res) => seccionControlador.obtenerPorNombre(req, res));
router.delete('/:id', (req, res) => seccionControlador.eliminar(req, res));

export default router;