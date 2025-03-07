import { hash, verify } from "argon2";
import Usuario from '../user/user.model.js';
import { generarJWT } from '../helpers/generate-jwt.js';
import Category from "../category/category.model.js";

// Iniciar sesión
export const login = async (req, res) => {
    const { email, password, username } = req.body;

    try {
        const user = await Usuario.findOne({
            $or: [{ email }, { username }]
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "[Console] Error: Credenciales incorrectas, correo no existente en la base de datos."
            });
        }

        if (!user.estado) {
            return res.status(400).json({
                success: false,
                message: "[Console] Error: El usuario no existe en la base de datos."
            });
        }

        const validPassword = await verify(user.password, password);
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                message: "[Console] Error: La contraseña es incorrecta."
            });
        }

        const token = await generarJWT(user.id);

        res.status(200).json({
            success: true,
            message: "[Console] Inicio de sesión exitoso: El usuario ha iniciado sesión correctamente.",
            userDetails: {
                username: user.username,
                token: token,
                profile_picture: user.profile_picture
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "[Console] Error: Problema al iniciar sesión.",
            error: error.message
        });
    }
};

// Registrar usuario


export const register = async (req, res) => {
    try {
        const data = req.body;
        let profile_picture = req.file ? req.file.filename : null;
        const encryptedPassword = await hash(data.password);
        let preferenciasValidas = [];

        // Obtener la categoría Default (o crearla si no existe)
        let defaultCategoria = await Category.findOne({ name: "Default" });

        if (!defaultCategoria) {
            defaultCategoria = await Category.create({ name: "Default" });
            console.log(`[Console] Categoría 'Default' creada con ID ${defaultCategoria._id}`);
        }

        if (data.preferencias && Array.isArray(data.preferencias) && data.preferencias.length > 0) {
            const preferenciasProcesadas = [];

            for (let pref of data.preferencias) {
                if (mongoose.Types.ObjectId.isValid(pref)) {
                    // Si ya es un ObjectId válido, lo agregamos
                    preferenciasProcesadas.push(pref);
                } else {
                    // Si es un nombre de categoría, buscamos su ID
                    const categoria = await Category.findOne({ name: pref });

                    if (categoria) {
                        preferenciasProcesadas.push(categoria._id);
                    } else {
                        console.warn(`[Console] Advertencia: La categoría '${pref}' no existe.`);
                    }
                }
            }

            // Si ninguna preferencia fue válida, usar Default
            preferenciasValidas = preferenciasProcesadas.length > 0 ? preferenciasProcesadas : [defaultCategoria._id];
        } else {
            // Si el usuario no ingresó preferencias, asignar Default
            preferenciasValidas = [defaultCategoria._id];
        }

        const user = await Usuario.create({
            name: data.name,
            username: data.username,
            email: data.email,
            phone: data.phone,
            password: encryptedPassword,
            role: data.role || "CLIENT_ROLE",
            profile_picture,
            preferencias: preferenciasValidas
        });

        return res.status(201).json({
            success: true,
            message: "[Console] Usuario registrado correctamente.",
            userDetails: {
                user: user.email
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "[Console] Error al registrar el usuario: No se pudo registrar el usuario.",
            error: error.message
        });
    }
};
