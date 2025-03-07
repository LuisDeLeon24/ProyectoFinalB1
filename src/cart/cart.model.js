import mongoose from "mongoose";

const CartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true // Un usuario solo tiene un carrito
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            }
        }
    ]
});

CartSchema.methods.toJSON = function () {
    const { __v, ...cart } = this.toObject();
    return cart;
};

export default mongoose.model("Cart", CartSchema);