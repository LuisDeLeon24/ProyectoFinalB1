import { Router } from "express";
import { newCategory, getCategories, updateCategory, delCategory } from "../category/category.controller.js";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { validarRol } from "../middlewares/validar-roles.js";

const router = Router();

router.post(
    "/newCategory",
    [
    validarJWT,
    validarRol("ADMIN_ROLE")
    ],
    newCategory
);

router.get("/getCategories", getCategories);

router.put(
    "/updateCategory/:id",
    [
        validarJWT,
        validarRol("ADMIN_ROLE")
    ],
    updateCategory
);

router.delete(
    "/delCategory/:id", 
    [
        validarJWT,
        validarRol("ADMIN_ROLE")
    ],
    delCategory
    );

export default router;