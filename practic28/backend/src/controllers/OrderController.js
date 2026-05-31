const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const cacheService = require('../services/CacheService'); // 🔥 Импортируем сервис кэша
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class OrderController {
  async createCheckoutSession(req, res) {
    try {
      const userId = req.user.sub;
      const cart = await Cart.findOne({ userId }).populate('items.productId');
      
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ error: "Корзина пуста" });
      }

      // 🔥 ПРОВЕРКА: достаточно ли товаров на складе
      for (const item of cart.items) {
        if (item.productId.stock < item.quantity) {
          return res.status(400).json({ 
            error: `Товар "${item.productId.title}" доступен только в количестве ${item.productId.stock} шт.` 
          });
        }
      }

      const lineItems = cart.items.map(item => ({
        price_data: {
          currency: 'rub',
          product_data: { name: item.productId.title },
          unit_amount: Math.round(item.productId.price * 100)
        },
        quantity: item.quantity
      }));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL}/orders?success=true`,
        cancel_url: `${process.env.CLIENT_URL}/cart?canceled=true`,
        metadata: { userId }
      });

      const orderItems = cart.items.map(item => ({
        productId: item.productId._id,
        title: item.productId.title,
        price: item.productId.price,
        quantity: item.quantity
      }));
      
      const totalAmount = cart.items.reduce((sum, item) => sum + item.productId.price * item.quantity, 0);
      
      // 🔥 СОЗДАЕМ заказ со статусом 'pending' (stock ещё НЕ уменьшаем!)
      const order = new Order({
        userId,
        items: orderItems,
        totalAmount,
        status: 'pending',
        stripeSessionId: session.id
      });
      await order.save();

      // 🔥 НЕ уменьшаем stock здесь! Уменьшим только после успешной оплаты в webhook

      res.json({ url: session.url });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getOrderHistory(req, res) {
    try {
      const userId = req.user.sub;
      const orders = await Order.find({ userId }).sort({ createdAt: -1 });
      res.json(orders);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // 🔥 ОБРАБАТЫВАЕМ успешную оплату
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      try {
        const order = await Order.findOne({ stripeSessionId: session.id });
        
        if (order && order.status === 'pending') {
          // 🔥 УМЕНЬШАЕМ stock только ПОСЛЕ успешной оплаты!
          for (const item of order.items) {
            await Product.findByIdAndUpdate(item.productId, {
              $inc: { stock: -item.quantity }
            });
          }
          
          // Меняем статус на 'paid'
          order.status = 'paid';
          await order.save();
          
          // 🔥 ОЧИЩАЕМ КЭШ ТОВАРОВ после изменения stock
          await cacheService.invalidatePattern('products:*');
          
          console.log(`✅ Order ${order._id} paid. Stock updated & cache cleared.`);
        }
      } catch (err) {
        console.error('Error processing webhook:', err);
      }
    }

    res.json({ received: true });
  }

  async confirmPayment(req, res) {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID is required" });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === 'paid') {
        const order = await Order.findOne({ stripeSessionId: sessionId });
        
        if (order && order.status !== 'paid') {
          // 🔥 УМЕНЬШАЕМ stock
          for (const item of order.items) {
            await Product.findByIdAndUpdate(item.productId, {
              $inc: { stock: -item.quantity }
            });
          }
          
          order.status = 'paid';
          await order.save();
          
          // 🔥 ОЧИЩАЕМ КЭШ ТОВАРОВ после изменения stock
          await cacheService.invalidatePattern('products:*');
          
          console.log(`✅ Payment confirmed. Stock updated & cache cleared.`);
          
          return res.json({ success: true, message: "Order status updated to paid" });
        }
      }

      res.json({ success: false, message: "Payment status check complete" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = OrderController;