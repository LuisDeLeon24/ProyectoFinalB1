import Category from "../category/category.model.js";
import Product from "../product/product.model.js";

export const newCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const category = new Category({ name });
        await category.save();

        res.status(201).json({
            success: true,
            message: "[Console] Categoría creada exitosamente.",
            category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "[Console] Error: No se pudo crear la categoría.",
            error: error.message
        });
    }
};

export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ status: true });
        res.status(200).json({
            success: true,
            message: "[Console] Consulta exitosa: Categorías obtenidas correctamente.",
            categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "[Console] Error: No se pudieron obtener las categorías.",
            error: error.message
        });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const category = await Category.findByIdAndUpdate(id, { name }, { new: true });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "[Console] Error: No se encontró la categoría para actualizar."
            });
        }

        res.status(200).json({
            success: true,
            message: "[Console] Categoría actualizada correctamente.",
            category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "[Console] Error: No se pudo actualizar la categoría.",
            error: error.message
        });
    }
};

export const delCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const defaultCategory = await Category.findOne({ name: "Default" });
        if (!defaultCategory) {
            return res.status(500).json({
                success: false,
                message: "[Console] Error: No se encontró la categoría por defecto."
            });
        }

        await Product.updateMany({ category: id }, { category: defaultCategory._id });
        await Category.findByIdAndUpdate(id, { status: false });

        res.status(200).json({
            success: true,
            message: "[Console] Categoría eliminada correctamente."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "[Console] Error: No se pudo eliminar la categoría.",
            error: error.message
        });
    }
};