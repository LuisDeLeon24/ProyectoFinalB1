import Product from "./product.model.js";
import Category from "../category/category.model.js";
import User from "../user/user.model.js";

export const newProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock } = req.body;

        
        const categoryExists = await Category.findOne({ name: category });
        if (!categoryExists) {
            return res.status(400).json({
                success: false,
                message: "[controller] Error: La categoría ingresada no es válida."
            });
        }

        
        const product = new Product({
            name,
            description,
            price,
            category: categoryExists._id,  
            stock,
            status: true
        });

        await product.save();

        res.status(200).json({
            success: true,
            message: "[controller] Éxito: El producto ha sido creado correctamente.",
            product
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "[controller] Error: No se pudo crear el producto.",
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
            message: "[controller] Éxito: Lista de productos obtenida correctamente.",
            total,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "[controller] Error: No se pudieron obtener los productos.",
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
                message: "[controller] Error: No se encontró el producto solicitado."
            });
        }

        res.status(200).json({
            success: true,
            message: "[controller] Éxito: Producto encontrado.",
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "[controller] Error: No se pudo buscar el producto.",
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
                message: "[controller] Error: No se encontró el producto a eliminar."
            });
        }

        if (req.usuario.role === "CLIENT_ROLE") {
            return res.status(403).json({ 
                success: false, 
                message: "[controller] Error: No tienes permiso para eliminar este producto." 
            });
        }

        product.status = false;
        await product.save();

        res.status(200).json({
            success: true,
            message: "[controller] Éxito: El producto ha sido eliminado correctamente."
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "[controller] Error: No se pudo eliminar el producto.",
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
                message: "[controller] Error: Usuario no autenticado."
            });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "[controller] Error: No se encontró el producto a actualizar."
            });
        }

        if (category) {
           
            const categoryExists = await Category.findOne({ name: category });
            if (!categoryExists) {
                return res.status(400).json({
                    success: false,
                    message: "[controller] Error: La categoría ingresada no es válida."
                });
            }
        
            product.category = categoryExists._id;
        }

       
        Object.assign(product, data);
        await product.save();

        res.status(200).json({
            success: true,
            message: "[controller] Éxito: El producto ha sido actualizado correctamente.",
            product
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "[controller] Error: No se pudo actualizar el producto.",
            error
        });
    }
};

export const getProductsCat = async (req, res) => {
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
            message: "[controller] Éxito: Lista de productos obtenida correctamente.",
            total,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "[controller] Error: No se pudieron obtener los productos.",
            error
        });
    }
};


