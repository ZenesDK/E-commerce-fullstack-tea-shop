import { createContext, useContext, useState, useEffect } from 'react';
import { getCart, addToCart as apiAddToCart, removeFromCart as apiRemoveFromCart, updateQuantity as apiUpdateQuantity, syncCart } from '../api/cart';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Загрузка корзины при инициализации
  useEffect(() => {
    const initCart = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await loadCartFromServer();
      } else {
        loadCartFromLocal();
      }
      setInitialized(true);
    };
    initCart();
  }, []);

  const loadCartFromServer = async () => {
    try {
      setLoading(true);
      const { data } = await getCart();
      const formatted = data.items?.map(item => ({
        productId: item.productId?._id || item.productId,
        quantity: item.quantity,
        price: item.price,
        title: item.product?.title || item.title,
        image_url: item.product?.image_url || item.image_url
      })) || [];
      setItems(formatted);
    } catch (err) {
      console.error("Failed to load cart from server", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCartFromLocal = () => {
    try {
      const local = localStorage.getItem('cart');
      if (local) setItems(JSON.parse(local));
    } catch (e) {
      console.error('Failed to parse local cart', e);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    const token = localStorage.getItem('accessToken');
    const productId = product.id || product._id || product.productId;
    
    if (token) {
      try {
        await apiAddToCart(productId, quantity);
        await loadCartFromServer();
      } catch (err) {
        // 🔥 ОБРАБОТКА ОШИБКИ: показываем сообщение пользователю
        // Бэкенд вернет { error: "Недостаточно товара на складе" }
        const errorMessage = err.response?.data?.error || "Ошибка добавления в корзину";
        alert(errorMessage); 
        // Не пробрасываем ошибку дальше, чтобы не крашить приложение
      }
    } else {
      // Локальная корзина (гость) — тут ошибки не будет, просто добавляем
      const newItems = [...items];
      const existing = newItems.find(i => i.productId === productId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        newItems.push({
          productId,
          quantity,
          price: product.price,
          title: product.title,
          image_url: product.imageUrl || product.image_url
        });
      }
      setItems(newItems);
      localStorage.setItem('cart', JSON.stringify(newItems));
    }
  };

  const removeFromCart = async (productId) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      await apiRemoveFromCart(productId);
      await loadCartFromServer();
    } else {
      const newItems = items.filter(i => i.productId !== productId);
      setItems(newItems);
      localStorage.setItem('cart', JSON.stringify(newItems));
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return removeFromCart(productId);
    
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        await apiUpdateQuantity(productId, quantity);
        await loadCartFromServer();
      } catch (err) {
        // 🔥 ОБРАБОТКА ОШИБКИ: показываем сообщение пользователю
        // Бэкенд вернет { error: "Недостаточно товара на складе" }
        const errorMessage = err.response?.data?.error || "Ошибка обновления количества";
        alert(errorMessage); 
        // Не пробрасываем ошибку дальше, чтобы не крашить приложение
      }
    } else {
      // Локальная корзина (гость) — тут ошибки не будет, просто обновляем
      const newItems = items.map(i => i.productId === productId ? { ...i, quantity } : i);
      setItems(newItems);
      localStorage.setItem('cart', JSON.stringify(newItems));
    }
  };

  const syncAndLogin = async () => {
    const local = localStorage.getItem('cart');
    if (local) {
      const localItems = JSON.parse(local);
      if (localItems.length > 0) {
        try {
          await syncCart(localItems);
          localStorage.removeItem('cart');
        } catch (err) {
          console.error('Sync failed:', err);
        }
      }
    }
    await loadCartFromServer();
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      syncAndLogin, 
      clearCart,
      totalAmount, 
      totalCount,
      loading,
      initialized 
    }}>
      {children}
    </CartContext.Provider>
  );
};