const ProductRepository = require('../repositories/ProductRepository');
const path = require('path');
const fs = require('fs');

class ProductController {
  constructor() {
    this.productRepo = new ProductRepository();
  }

  async getAll(req, res) {
    try {
      const { search, category, minPrice, maxPrice } = req.query;
      const query = {};

      if (search && typeof search === 'string' && search.trim()) {
        query.title = { $regex: search.trim(), $options: 'i' };
      }
      if (category && typeof category === 'string' && category.trim()) {
        query.category = category.trim();
      }
      if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined) {
          const min = Number(minPrice);
          if (!isNaN(min)) query.price.$gte = min;
        }
        if (maxPrice !== undefined) {
          const max = Number(maxPrice);
          if (!isNaN(max)) query.price.$lte = max;
        }
        if (Object.keys(query.price).length === 0) delete query.price;
      }

      const products = await this.productRepo.findAll(query);
      res.json(products);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error", details: err.message });
    }
  }

  async getById(req, res) {
    try {
      const product = await this.productRepo.findById(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found" });
      res.json(product);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // 🔥 ИЗМЕНЕНО: Добавлена обработка stock
  async create(req, res) {
    try {
      // 🔥 Деструктурируем stock из body
      const { title, category, description, price, stock } = req.body;
      
      const parsedPrice = parseFloat(price);
      // 🔥 Парсим stock в целое число, по умолчанию 0
      const parsedStock = stock !== undefined ? parseInt(stock, 10) : 0;

      if (!title || !category || !description || isNaN(parsedPrice)) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "All fields are required, price must be a valid number" });
      }

      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
      
      const newProduct = await this.productRepo.create({ 
        title, 
        category, 
        description, 
        price: parsedPrice, 
        stock: parsedStock, // 🔥 Передаем stock
        imageUrl 
      });
      res.status(201).json(newProduct);
    } catch (err) {
      console.error(err);
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // 🔥 ИЗМЕНЕНО: Добавлена обработка stock
  async update(req, res) {
    try {
      const id = req.params.id;
      // 🔥 Деструктурируем stock из body
      const { title, category, description, price, stock } = req.body;
      
      const parsedPrice = parseFloat(price);
      // 🔥 Парсим stock
      const parsedStock = stock !== undefined ? parseInt(stock, 10) : undefined;

      if (!title || !category || !description || isNaN(parsedPrice)) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "All fields are required, price must be a valid number" });
      }

      const oldProduct = await this.productRepo.findById(id);
      let imageUrl = oldProduct?.image_url;
      
      if (req.file) {
        if (imageUrl) {
          const oldPath = path.join(__dirname, '../..', imageUrl);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        imageUrl = `/uploads/${req.file.filename}`;
      }

      const updatedProduct = await this.productRepo.update(id, { 
        title, 
        category, 
        description, 
        price: parsedPrice, 
        stock: parsedStock, // 🔥 Передаем stock (может быть undefined, если не меняли)
        imageUrl 
      });
      
      if (!updatedProduct) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(updatedProduct);
    } catch (err) {
      console.error(err);
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async delete(req, res) {
    try {
      const id = req.params.id;
      const deletedProduct = await this.productRepo.delete(id);
      
      if (!deletedProduct) return res.status(404).json({ error: "Product not found" });

      if (deletedProduct.imageUrl) {
        const filePath = path.join(__dirname, '../..', deletedProduct.imageUrl);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = ProductController;