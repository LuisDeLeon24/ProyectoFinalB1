import Cart from "./cart.model.js";
import Product from "../product/product.model.js";

export const getCart = async (req, res) => {
    try {
        let carts;

        if (req.usuario.role === "ADMIN_ROLE") {
            // Populate tanto los productos como el usuario
            carts = await Cart.find().populate("products.product", "name price").populate("user", "username");
        } else {
            // Populate tanto los productos como el usuario
            carts = await Cart.findOne({ user: req.usuario._id })
                .populate("products.product", "name price")
                .populate("user", "username");
        }

        if (!carts) {
            return res.status(404).json({
                success: false,
                message: "Carrito no encontrado"
            });
        }

        res.status(200).json({
            success: true,
            carts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener el carrito",
            error
        });
    }
};

export const addToCart = async (req, res) => {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Debes agregar al menos un producto"
        });
    }

    try {
        let cart = await Cart.findOne({ user: req.usuario._id });
        if (!cart) {
            cart = new Cart({ user: req.usuario._id, products: [] });
        }

        for (const { productId, quantity } of products) {
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ 
                    success: false, 
                    message: `Producto con ID ${productId} no encontrado` 
                });
            }

            if (product.stock < quantity) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Stock insuficiente para el producto ${product.name}` 
                });
            }

            const productIndex = cart.products.findIndex(p => p.product.equals(productId));

            if (productIndex > -1) {
                const currentQuantity = cart.products[productIndex].quantity;
                const newQuantity = currentQuantity + quantity;

                if (newQuantity > product.stock) {
                    return res.status(400).json({
                        success: false,
                        message: `No puedes agregar más productos de los que hay en stock para ${product.name}`
                    });
                }

                cart.products[productIndex].quantity = newQuantity;
            } else {
                cart.products.push({ product: productId, quantity });
            }

           
            await product.save();
        }

        await cart.save();

        res.status(200).json({ 
            success: true,
            message: "Productos agregados al carrito",
            cart 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Error al agregar productos", 
            error 
        });
    }
};

export const removeFromCart = async (req, res) => {
    const { productId } = req.params;
    try {
        const cart = await Cart.findOne({ user: req.usuario._id });
        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                message: "Carrito no encontrado" 
            });
        }

        const productIndex = cart.products.findIndex(p => p.product.equals(productId));
        if (productIndex > -1) {
            const product = await Product.findById(productId);
            if (product) {
                product.stock += cart.products[productIndex].quantity;
                await product.save();
            }
            cart.products.splice(productIndex, 1);
            await cart.save();
        }

        res.status(200).json({ 
            success: true, 
            message: "Producto eliminado del carrito", 
            cart 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Error al eliminar producto", 
            error 
        });
    }
};

export const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.usuario._id }).populate("products.product");

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Carrito no encontrado"
            });
        }

        
        for (const item of cart.products) {
            const product = item.product;

            if (product) {
                product.stock += item.quantity;
                await product.save(); 
            }
        }

        await Cart.findOneAndDelete({ user: req.usuario._id });

        res.status(200).json({
            success: true,
            message: "Carrito vaciado correctamente"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al vaciar el carrito",
            error
        });
    }
};