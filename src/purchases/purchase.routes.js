import { Router } from "express";
import { check } from "express-validator";
import { newPurchase, getUserPurchases, getPurchaseById, undoPurchase, updatePurchase, paidPurchase,listUserPurchases} from "./purchase.controller.js";
import { validarCampos } from "../middlewares/validar-campos.js";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { validarRol } from "../middlewares/validar-roles.js";

const router = Router();

router.post(
    "/newPurchase",
    [
        validarJWT,
        check("cartId", "El ID del carrito es obligatorio").not().isEmpty(),
        check("cartId", "No es un ID válido").isMongoId(),
        check("shippingAddress", "La dirección de envío es obligatoria").not().isEmpty(),
        validarCampos
    ],
    newPurchase
);

router.get("/userPurchases", 
    [
        validarJWT,
    ],
    getUserPurchases);

router.get(
    "/findPurchase/:id",
    [
        validarJWT,
        check("id", "No es un ID válido").isMongoId(),
        validarCampos
    ],
    getPurchaseById
);

router.put(
    "/undoPurchase/:id",
    [
        validarJWT,
        validarRol("ADMIN_ROLE"),
        check("id", "No es un ID válido").isMongoId(),
        validarCampos
    ],
    undoPurchase
);

router.put(
    "/updatePurchase/:id",
    [
        validarJWT,
        validarRol("ADMIN_ROLE"),
        check("id", "No es un ID válido").isMongoId(),
        validarCampos
    ],
    updatePurchase
);

router.put(
    "/paidPurchase/:id", 
    [
        validarJWT,  
        check("id", "No es un ID válido").isMongoId(), 
        validarCampos 
    ], 
    paidPurchase
);

router.get('/purchasesU/:userId',
     [
        validarJWT,
        check("userId", "No es un ID válido").isMongoId(),
        validarCampos
    ],
    listUserPurchases
);



export default router;