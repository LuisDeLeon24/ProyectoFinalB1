import { Router } from "express";
import { register,login } from "./auth.controller.js";
import { loginValidator} from "../middlewares/validator.js";

const router = Router()

router.post(
    "/register",
    register,
    register
)

router.post(
    "/login",
    login,
    login
)

export default router