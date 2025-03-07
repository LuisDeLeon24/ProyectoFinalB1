import { Router } from "express";
import { check } from "express-validator";
import { getCart, addToCart, removeFromCart, clearCart } from "./cart.controller.js";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { validarCampos } from "../middlewares/validar-campos.js";

const router = Router();

router.get(
    "/getCart", 
    [
    validarJWT
    ],
    getCart
);

router.post(
    "/addCart",
    [
        validarJWT,
        check("products")
            .custom((value, { req }) => {
                if (!Array.isArray(value) && (!req.body.productId || !req.body.quantity)) {
                    throw new Error("Debe ser un array de productos o un solo producto con productId y quantity");
                }
                return true;
            }),
        check("products.*.productId", "El ID del producto es obligatorio").optional().isMongoId(),
        check("products.*.quantity", "La cantidad debe ser mayor a 0").optional().isInt({ min: 1 }),
        check("productId", "El ID del producto es obligatorio").optional().isMongoId(),
        check("quantity", "La cantidad debe ser mayor a 0").optional().isInt({ min: 1 }),
        validarCampos
    ],
    addToCart
);


router.delete(
    "/revoCart/:productId",
    [
        validarJWT,
        check("productId", "El ID del producto es obligatorio").isMongoId(),
        validarCampos
    ],
    removeFromCart
);

router.delete(
    "/clrCart",
     validarJWT,
      clearCart);

export default router;