const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image_url: { type: String },
  stock: { type: Number, default: 0, min: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);