export const validarRol = (...roles) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(500).json({
                success: false,
                msg: "Se quiere verificar un Role Sin Validar El Token Antes"
            });
        }

        const { role } = req.usuario;
        
        if (!roles.includes(role)) {
            return res.status(403).json({
                success: false,
                msg: `Usuario No Autorizado, Posee Un Rol ${req.usuario.role}, los roles autorizados son ${roles}`
            });
        }

        next();
    }
};