const Cart = require('../models/Cart');
const Product = require('../models/Product');

class CartController {
  
  // Получить корзину пользователя
  async getCart(req, res) {
    try {
      const cart = await Cart.findOne({ userId: req.user.sub })
        .populate('items.productId', 'title price image_url stock category');
      
      if (!cart) return res.json({ items: [], totalAmount: 0 });
      
      // Формируем удобный ответ для фронтенда
      const items = cart.items.map(item => ({
        ...item.toObject(),
        product: item.productId
      }));

      res.json({ items, totalAmount: cart.totalAmount });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Добавить товар (или увеличить количество)
  async addToCart(req, res) {
    try {
      const { productId, quantity = 1 } = req.body;
      const userId = req.user.sub;

      // Проверяем товар и остаток
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ error: "Товар не найден" });
      if (product.stock < quantity) return res.status(400).json({ error: "Недостаточно товара на складе" });

      let cart = await Cart.findOne({ userId });
      
      // Если корзины нет — создаем
      if (!cart) {
        cart = new Cart({ userId, items: [] });
      }

      // Проверяем, есть ли товар уже в корзине
      const existingItem = cart.items.find(item => item.productId.toString() === productId);

      if (existingItem) {
        // Если есть — суммируем количество
        const newQuantity = existingItem.quantity + quantity;
        // Проверяем склад снова для суммы
        if (product.stock < newQuantity) {
          return res.status(400).json({ error: "Недостаточно товара на складе для увеличения количества" });
        }
        existingItem.quantity = newQuantity;
        existingItem.price = product.price; // Обновляем цену, если изменилась
      } else {
        // Если нет — добавляем новый
        cart.items.push({ productId, quantity, price: product.price });
      }

      // Считаем общую сумму
      cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      await cart.save();
      res.status(201).json(cart);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Удалить товар из корзины
  async removeFromCart(req, res) {
    try {
      const { productId } = req.params;
      const userId = req.user.sub;

      const cart = await Cart.findOne({ userId });
      if (!cart) return res.status(404).json({ error: "Корзина не найдена" });

      cart.items = cart.items.filter(item => item.productId.toString() !== productId);
      cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      await cart.save();
      res.json(cart);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Изменить количество
  async updateQuantity(req, res) {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;
      const userId = req.user.sub;

      if (quantity <= 0) return this.removeFromCart(req, res); // Если 0 — удаляем

      const cart = await Cart.findOne({ userId });
      if (!cart) return res.status(404).json({ error: "Корзина не найдена" });

      const item = cart.items.find(i => i.productId.toString() === productId);
      if (!item) return res.status(404).json({ error: "Товар не найден в корзине" });

      const product = await Product.findById(productId);
      if (product.stock < quantity) return res.status(400).json({ error: "Недостаточно товара на складе" });

      item.quantity = quantity;
      cart.totalAmount = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      
      await cart.save();
      res.json(cart);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = CartController;