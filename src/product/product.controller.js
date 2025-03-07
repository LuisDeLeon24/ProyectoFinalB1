import Product from "./product.model.js";
import Category from "../category/category.model.js";
import User from "../user/user.model.js";

export const newProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock } = req.body;

        // Buscar la categoría por nombre
        const categoryExists = await Category.findOne({ name: category });
        if (!categoryExists) {
            return res.status(400).json({
                success: false,
                message: "[controller] Categoría no válida"
            });
        }

        // Crear el nuevo producto
        const product = new Product({
            name,
            description,
            price,
            category: categoryExists._id,  // Usar el _id de la categoría encontrada
            stock,
            status: true
        });

        await product.save();

        res.status(200).json({
            success: true,
            message: "[controller] Producto Creado",
            product
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "[controller] Error al crear el Producto",
            error
        });
    }
};

export const getProducts = async (req, res) => {
    const { limite = 10, desde = 0, sort = "name", order = "asc", category = "", name = "" } = req.query;

    const query = { status: true };

    if (category) {
        query.category = category;
    }

    if (name) {
        query.name = { $regex: name, $options: 'i' };  
    }

    const sortBy = order === "asc" ? 1 : -1;

    try {
        const products = await Product.find(query)
            .populate("category", "name") 
            .skip(Number(desde))  
            .limit(Number(limite))  
            .sort({ [sort]: sortBy });  

        const total = await Product.countDocuments(query);

        res.status(200).json({
            success: true,
            total,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "[controller] Error al obtener los productos",
            error
        });
    }
};

export const searchProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findById(id)
            .populate("category", "name");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "[controller] Producto No Encontrado"
            });
        }

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "[controller] Error al buscar el producto",
            error
        });
    }
};

export const delProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "[controller] Producto No Encontrado"
            });
        }

        if (req.usuario.role === "CLIENT_ROLE") {
            return res.status(403).json({ 
                success: false, 
                message: "[controller] No autorizado para eliminar este producto" 
            });
        }

        product.status = false;
        await product.save();

        res.status(200).json({
            success: true,
            message: "[controller] Producto Eliminado Exitosamente"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "[controller] Error al eliminar el producto",
            error
        });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { category, ...data } = req.body;

        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: "[controller] Usuario no autenticado"
            });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "[controller] Producto No Encontrado"
            });
        }

        if (category) {
            // Buscar la categoría por su nombre
            const categoryExists = await Category.findOne({ name: category });
            if (!categoryExists) {
                return res.status(400).json({
                    success: false,
                    message: "[controller] Categoría no válida"
                });
            }
            // Asignar el ID de la categoría al producto
            product.category = categoryExists._id;
        }

        // Actualizar el resto de los datos
        Object.assign(product, data);
        await product.save();

        res.status(200).json({
            success: true,
            message: "[controller] Producto Actualizado",
            product
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "[controller] Error al actualizar el producto",
            error
        });
    }
};



