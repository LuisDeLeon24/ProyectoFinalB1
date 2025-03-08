'use strict';
import limiter from '../src/middlewares/validar-cant-peticiones.js'
import authRoutes from "../src/auth/auth.routes.js"
import userRoutes from "../src/user/user.routes.js"
import cartRoutes from "../src/cart/cart.routes.js"
import purchaseRoutes from "../src/purchases/purchase.routes.js"
import categoryRoutes from "../src/category/category.routes.js"
import productRoutes from "../src/product/product.routes.js"
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { dbConnection } from './mongo.js';
import Category from "../src/category/category.model.js"
import { hash } from "argon2";

const configurarMiddlewares = (app) => {
    app.use(express.urlencoded({extended: false}));
    app.use(cors());
    app.use(express.json());
    app.use(helmet());
    app.use(morgan('dev'));
    app.use(limiter);
}

const configurarRutas = (app) =>{
    app.use("/proyectoFinal/auth", authRoutes);
    app.use("/proyectoFinal/user", userRoutes);
    app.use("/proyectoFinal/category", categoryRoutes);
    app.use("/proyectoFinal/product", productRoutes);
    app.use("/proyectoFinal/cart", cartRoutes);
    app.use("/proyectoFinal/purchase", purchaseRoutes);
}

const defaultCategory = async () => {
    try {
        const defaultCategory = await Category.findOne({ name: "Default" });
        if (!defaultCategory) {
            await Category.create({ name: "Default" });
            console.log("Categoría por defecto creada: Default");
        } else {
            console.log("Categoría por defecto ya existente");
        }
    } catch (error) {
        console.error("Error al inicializar categorías:", error);
    }
};

const conectarDB = async () => {
    try {
        await dbConnection();
        await defaultCategory();
        console.log("Conexion Exitosa Con La Base De Datos");
    } catch (error) {
        console.log("Error Al Conectar Con La Base De Datos", error);
    }
}



export const iniciarServidor = async () => {
    const app = express();
    const port = process.env.PORT || 3000;

    await conectarDB();
    configurarMiddlewares(app);
    configurarRutas(app);

    app.listen(port, () => {
        console.log(`Server Running On Port ${port}`);
    });
}