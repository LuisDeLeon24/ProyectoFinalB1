import Purchase from "./purchase.model.js";
import Product from "../product/product.model.js";
import Cart from "../cart/cart.model.js"
import { hash} from "argon2";
import { Document, Packer, Paragraph, TextRun } from "docx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";



const isValidCreditCard = (cardNumber) => {
    const digits = cardNumber.split('').reverse().map(digit => parseInt(digit));
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
        let digit = digits[i];
        if (i % 2 !== 0) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        sum += digit;
    }
    return sum % 10 === 0;
};

export const newPurchase = async (req, res) => {
    const { cartId, shippingAddress, paymentMethod, account } = req.body;

    
    if (!paymentMethod || !["credit_card", "paypal"].includes(paymentMethod)) {
        return res.status(400).json({
            success: false,
            message: "El método de pago es obligatorio y debe ser 'credit_card' o 'paypal'."
        });
    }

    if (!account || account.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "El campo 'account' es obligatorio y no puede estar vacío."
        });
    }

    if (!shippingAddress || shippingAddress.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "El campo 'shippingAddress' es obligatorio y no puede estar vacío."
        });
    }

    
    if (paymentMethod === "credit_card" && !isValidCreditCard(account)) {
        return res.status(400).json({
            success: false,
            message: "El número de tarjeta de crédito no es válido"
        });
    }

    try {
        const cart = await Cart.findOne({ _id: cartId, user: req.usuario._id }).populate("products.product");

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "El carrito no existe o no pertenece al usuario"
            });
        }

        if (cart.products.length === 0) {
            return res.status(400).json({
                success: false,
                message: "El carrito está vacío, agrega productos antes de comprar"
            });
        }

        let total = 0;
        const purchasedProducts = cart.products.map(item => {
            total += item.product.price * item.quantity;
            return {
                product: item.product._id,
                quantity: item.quantity,
                priceAtPurchase: item.product.price
            };
        });

        const encryptedAccount = await hash(account); 
        const newPurchase = new Purchase({
            user: req.usuario._id,
            products: purchasedProducts,
            shippingAddress,
            total,
            status: "pending",
            paymentMethod,
            account: encryptedAccount
        });

        await newPurchase.save();
        cart.products = []; 
        await cart.save();

        res.status(201).json({
            success: true,
            message: "Factura creada exitosamente",
            purchase: newPurchase
        });

    } catch (error) {
        console.error(error);  
        res.status(500).json({
            success: false,
            message: "Error al crear la factura",
            error: error.message  
        });
    }
};





export const getUserPurchases = async (req, res) => { 
    try {
        let purchases;
        if (req.usuario.role === "ADMIN_ROLE") {
            purchases = await Purchase.find()
                .populate("products.product", "name price")
                .populate("user", "name surname email")
                .exec();
        } else {
            purchases = await Purchase.find({ user: req.usuario._id })
                .populate("products.product", "name price")
                .populate("user", "name surname email")
                .exec();
        }

        
        purchases = purchases.map(purchase => ({
            ...purchase.toObject(),
            paymentMethod: purchase.paymentMethod,
            account: purchase.account
        }));

        res.status(200).json({ 
            success: true, 
            purchases 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener las facturas", 
            error 
        });
    }
};

export const getPurchaseById = async (req, res) => {
    const { id } = req.params;
    try {
        const purchase = await Purchase.findById(id)
            .populate("products.product", "name price")
            .populate("user", "name surname email")
            .exec();

        if (!purchase) {
            return res.status(404).json({ 
                success: false, 
                message: "Factura no encontrada" 
            });
        }

        if (req.usuario.role === "CLIENT_ROLE" && purchase.user._id.toString() !== req.usuario._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: "No tienes permisos para ver esta factura" 
            });
        }

        // Incluir los nuevos campos
        const response = {
            ...purchase.toObject(),
            paymentMethod: purchase.paymentMethod,
            account: purchase.account
        };

        res.status(200).json({ 
            success: true, 
            purchase: response
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener la factura", 
            error 
        });
    }
};

export const undoPurchase = async (req, res) => {
    const { id } = req.params;
    try {
        const purchase = await Purchase.findById(id);

        if (!purchase) {
            return res.status(404).json({ 
                success: false, 
                message: "Factura no encontrada" 
            });
        }

        if (purchase.status !== "pending") {
            return res.status(400).json({ 
                success: false, 
                message: "Solo se pueden cancelar facturas pendientes" 
            });
        }

        if (req.usuario.role === "CLIENT_ROLE" && purchase.user.toString() !== req.usuario._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: "No tienes permiso para cancelar esta factura" 
            });
        }

        purchase.status = "canceled";

        for (let i = 0; i < purchase.products.length; i++) {
            await Product.findByIdAndUpdate(purchase.products[i].product, { $inc: { stock: purchase.products[i].quantity } });
        }

        await purchase.save();

        res.status(200).json({
            success: true,
            message: "Factura cancelada con éxito" 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Error al cancelar la factura", 
            error
        });
    }
};

export const updatePurchase = async (req, res) => {
    const { id } = req.params; 
    const { shippingAddress, paymentMethod, account } = req.body;

    try {
        
        const purchase = await Purchase.findById(id);

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Factura no encontrada"
            });
        }

        if (purchase.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Solo se pueden editar facturas pendientes"
            });
        }

       
        purchase.shippingAddress = shippingAddress;
        purchase.paymentMethod = paymentMethod;  
        purchase.account = account;  

        
        await purchase.save();

        res.status(200).json({
            success: true,
            message: "Factura actualizada exitosamente",
            purchase
        });
    } catch (error) {
        console.error("[controller] Error en updatePurchase:", error);
    
        res.status(500).json({
            success: false,
            message: "[controller] Error al editar la factura",
            error: error.message || error
        });
    }
};


export const paidPurchase = async (req, res) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const { id } = req.params;

    try {
        const purchase = await Purchase.findById(id).populate('products.product'); 

        if (!purchase) {
            return res.status(404).json({
                success: false, 
                message: "Factura no encontrada" 
            });
        }

        if (purchase.status === "paid") {
            return res.status(400).json({ 
                success: false, 
                message: "La factura ya está pagada" 
            });
        }

        if (purchase.status === "canceled") {
            return res.status(400).json({ 
                success: false, 
                message: "No se puede pagar una factura cancelada" 
            });
        }

        
        purchase.status = "paid";
        await purchase.save();

       
        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Factura Pagada",
                                    bold: true,
                                    size: 24
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun(`Factura ID: ${purchase._id}`),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun(`Estado: ${purchase.status}`),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun(`Método de Pago: ${purchase.paymentMethod}`),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun(`Cuenta: ${purchase.account}`),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun(`Dirección de Envío: ${purchase.shippingAddress}`),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun(`Total: Q${purchase.total}`),
                            ],
                        }),

                        
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Productos:",
                                    bold: true
                                })
                            ],
                        }),

                        
                        ...purchase.products.map(item => {
                            return new Paragraph({
                                children: [
                                    new TextRun(`Producto: ${item.product.name}`),
                                    new TextRun(` | Cantidad: ${item.quantity}`),
                                    new TextRun(` | Precio: Q${item.price}`),
                                ]
                            });
                        }),
                    ],
                },
            ],
        });

        
        const buffer = await Packer.toBuffer(doc);

        
        const filePath = path.join(__dirname, `Factura_${purchase._id}.docx`);

      
        fs.writeFileSync(filePath, buffer);

        
        res.status(200).json({
            success: true,
            message: "Factura marcada como pagada y archivo Word creado",
            purchase,
            filePath: filePath,  
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Error al actualizar la factura", 
            error: error.message 
        });
    }
};


export const listUserPurchases = async (req, res) => {
    try {
        
        const userId = req.params.userId;

       
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Debe proporcionar un ID de usuario en la URL"
            });
        }

       
        const purchases = await Purchase.find({ user: userId })
            .populate("products.product", "name price")
            .populate("user", "name surname email")
            .exec();

       
        if (purchases.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No se encontraron compras para este usuario"
            });
        }

        
        res.status(200).json({
            success: true,
            purchases
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener las compras del usuario",
            error: error.message
        });
    }
};

