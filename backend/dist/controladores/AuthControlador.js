import { AuthServicio } from "../servicios/AuthServicio.js";
import { UsuarioServicio } from "../servicios/UsuarioServicio.js";
const authServicio = new AuthServicio();
const usuarioServicio = new UsuarioServicio();
export class AuthControlador {
    async login(req, res) {
        try {
            console.log('Body recibido:', req.body);
            const { correo, contrasena } = req.body;
            if (!correo || !contrasena) {
                res.status(400).json({ mensaje: "Correo y contraseña son obligatorios" });
                return;
            }
            const resultado = await authServicio.login(correo, contrasena);
            res.status(200).json(resultado);
        }
        catch (error) {
            res.status(401).json({ mensaje: error.message });
        }
    }
    async registrar(req, res) {
        try {
            const nuevoUsuario = await usuarioServicio.crear(req.body);
            res.status(201).json({ usuario: nuevoUsuario });
        }
        catch (error) {
            res.status(400).json({ mensaje: error.message });
        }
    }
}
