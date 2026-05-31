import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalAmount } = useCart();

  if (items.length === 0) {
    return (
      <div className="cart-page-container">
        <h2>Корзина пуста</h2>
        <Link to="/products" className="btn-back-shopping">
          ← Вернуться к покупкам
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page-container">
      <h2>Корзина покупок</h2>
      
      <div className="cart-list">
        {items.map(item => (
          <div key={item.productId} className="cart-item">
            <img 
              src={`http://localhost${item.image_url}`} 
              alt={item.title} 
              className="cart-item-img" 
            />
            
            <div className="cart-item-info">
              <h3>{item.title}</h3>
              <p>{item.price} ₽</p>
            </div>

            <div className="cart-item-controls">
              <button 
                className="qty-btn" 
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              >
                -
              </button>
              <span className="qty-value">{item.quantity}</span>
              <button 
                className="qty-btn" 
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              >
                +
              </button>
              <button 
                className="remove-btn" 
                onClick={() => removeFromCart(item.productId)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-actions">
        <Link to="/products" className="btn-back-shopping">
          ← Вернуться к покупкам
        </Link>
        
        <div>
          <h3>Итого: {totalAmount.toFixed(2)} ₽</h3>
          <button 
            className="btn-checkout"
            onClick={() => {
              const token = localStorage.getItem('accessToken');
              if (!token) {
                // 🔥 Нет токена — редирект на логин с возвратом в корзину
                window.location.href = '/login?returnTo=/cart';
              } else {
                // 🔥 Есть токен — можно переходить к оплате (здесь будет Stripe)
                alert('Переход к оплате (Stripe)');
                // Здесь будет интеграция со Stripe
              }
            }}
          >
            Перейти к оплате
          </button>
        </div>
      </div>
    </div>
  );
}