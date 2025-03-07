import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "[Model] El Nombre del Producto es Obligatorio"]
    },
    description: {
        type: String,
        required: [true, "[Model] La Descripción del Producto es Obligatoria"]
    },
    price: {
        type: Number,
        required: [true, "[Model] El Precio es Obligatorio"],
        min: [0, "Model] El Precio no puede ser menor a 0"]
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    stock: {
        type: Number,
        required: [true, "[Model] El Stock es Obligatorio"],
        min: [0, "[Model] El Stock no puede ser negativo"]
    },
    status: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});

export default mongoose.model("Product", ProductSchema);