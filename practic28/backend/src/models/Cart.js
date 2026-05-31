const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    // Храним цену на момент добавления, чтобы не было сюрпризов при оформлении
    price: { type: Number, required: true } 
}, { _id: false });

const cartSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true }, // Связь с User по ID (строка)
    items: [cartItemSchema],
    totalAmount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);