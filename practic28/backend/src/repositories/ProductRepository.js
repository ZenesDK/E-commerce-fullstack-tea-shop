const IRepository = require('./IRepository');
const Product = require('../models/Product');

class ProductRepository extends IRepository {
  async findAll(filter = {}) {
    const products = await Product.find(filter).sort({ createdAt: -1 });
    return products.map(p => this._formatProduct(p));
  }

  async findById(id) {
    const product = await Product.findById(id);
    return product ? this._formatProduct(product) : null;
  }

  // 🔥 ИСПРАВЛЕНО: сохраняем stock при создании
  async create(productData) {
    const { title, category, description, price, imageUrl, stock } = productData;
    const newProduct = new Product({
      title,
      category,
      description,
      price,
      image_url: imageUrl,
      stock: stock || 0 // 🔥 Сохраняем stock
    });
    await newProduct.save();
    return this._formatProduct(newProduct);
  }

  // 🔥 ИСПРАВЛЕНО: обновляем stock
  async update(id, productData) {
    const { title, category, description, price, imageUrl, stock } = productData;
    
    // Формируем объект обновления
    const updateFields = { 
      title, 
      category, 
      description, 
      price, 
      image_url: imageUrl 
    };

    // Если stock передан (даже если 0), обновляем его
    if (stock !== undefined) {
      updateFields.stock = stock;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) return null;
    return this._formatProduct(updatedProduct);
  }

  async delete(id) {
    const deletedProduct = await Product.findByIdAndDelete(id);
    return deletedProduct ? this._formatProduct(deletedProduct) : null;
  }

  _formatProduct(doc) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : doc;
    return {
      ...obj,
      id: obj._id.toString(),
      imageUrl: obj.image_url,
      _id: undefined,
      __v: undefined
    };
  }
}

module.exports = ProductRepository;