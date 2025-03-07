import { response, request } from "express";
import { hash } from "argon2";
import User from "./user.model.js";
import Category from "../category/category.model.js"; 

export const getUsers = async (req = request, res = response) => {
    try {
        const { limite = 10, desde = 0 } = req.query;
        const query = { estado: true };

        const [total, users] = await Promise.all([
            User.countDocuments(query),
            User.find(query)
                .skip(Number(desde))
                .limit(Number(limite))
                .populate('preferencias') // Agregado para traer las categorías completas
        ]);

        res.status(200).json({
            success: true,
            message: "[Console] Consulta Exitosa: Listado de usuarios obtenido.",
            total,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "[Console] Error: No se pudo obtener los usuarios.",
            error: error.message
        });
    }
};


export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).populate('preferencias'); // Ahora también carga las preferencias

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "[Console] Error: Usuario no encontrado con ese ID."
            });
        }

        res.status(200).json({
            success: true,
            message: "[Console] Usuario encontrado correctamente.",
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "[Console] Error: No se pudo obtener el usuario.",
            error: error.message
        });
    }
};


export const updateUser = async (req, res = response) => {
    try {
        const { id } = req.params;
        const { password, preferencias, ...data } = req.body;

        if (password) {
            return res.status(400).json({
                success: false,
                message: "[Console] Error: No puedes actualizar la contraseña aquí."
            });
        }

        if (req.usuario.role === "CLIENT_ROLE" && id !== req.usuario._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "[Console] Error: No tienes autorización para actualizar la información de otro usuario."
            });
        }

        // Validar que las preferencias sean IDs válidos de categorías
        if (preferencias && preferencias.length > 0) {
            const categoriasValidas = await Category.find({ _id: { $in: preferencias } });

            if (categoriasValidas.length !== preferencias.length) {
                return res.status(400).json({
                    success: false,
                    message: "[Console] Error: Una o más categorías no son válidas."
                });
            }

            data.preferencias = preferencias;
        }

        const user = await User.findByIdAndUpdate(id, data, { new: true }).populate('preferencias');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "[Console] Error: Usuario no encontrado para actualizar."
            });
        }

        res.status(200).json({
            success: true,
            message: "[Console] Usuario actualizado correctamente.",
            user
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "[Console] Error: No se pudo actualizar el usuario.",
            error: error.message
        });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, newPassword } = req.body;

        if (!password || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "[Console] Error: La contraseña actual y la nueva contraseña son requeridas."
            });
        }

        // Verificar que la nueva contraseña no sea igual a la antigua
        if (password === newPassword) {
            return res.status(400).json({
                success: false,
                message: "[Console] Error: La nueva contraseña no puede ser la misma que la actual."
            });
        }

        // Buscar al usuario por su ID
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "[Console] Error: Usuario no encontrado para cambiar la contraseña."
            });
        }

        // Encriptar la nueva contraseña
        const encryptedPassword = await hash(newPassword);

        // Actualizar la contraseña en la base de datos
        user.password = encryptedPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: "[Console] Contraseña actualizada correctamente."
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "[Console] Error: No se pudo actualizar la contraseña.",
            error: error.message || "Error desconocido"
        });
    }
};

export const delaccount = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "[Console] Error: La contraseña es requerida para eliminar la cuenta."
            });
        }

        const user = await User.findByIdAndUpdate(req.usuario._id, { estado: false }, { new: true });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "[Console] Error: Usuario no encontrado para desactivación."
            });
        }

        res.status(200).json({
            success: true,
            message: "[Console] Cuenta eliminada correctamente.",
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "[Console] Error: No se pudo eliminar la cuenta.",
            error: error.message
        });
    }
};

