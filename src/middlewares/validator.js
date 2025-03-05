import { body } from 'express-validator';
import { validarCampos } from './validar-campos.js';
import { existenteEmail } from '../helpers/db-validator.js';
 
export const registerValidator = [
    body('name', 'the name is required').not().isEmpty(),
    body('surname', "the surname is required").not().isEmpty(),
    body('email', "You must enter a valid email").isEmail(),
    body("email").custom(existenteEmail),
    body("password", "Password must be at least 6 characters").isLength({min: 6}),
    validarCampos
]
 
export const loginValidator = [
    body("email").optional().isEmail().withMessage("Enter a valid email address"),
    body ("username").optional().isString().withMessage("Enter a valid username"),
    body("password", "Password must be at least 6 characters").isLength({min: 6}),
    validarCampos
]