import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/index';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await apiClient.get('/orders/history');
      setOrders(response.data);
    } catch (err) {
      console.error('Ошибка загрузки истории:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Функция проверки оплаты
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');

    if (success) {
      // Ищем последний заказ (скорее всего это он) или просим бэкенд проверить
      // Так как у нас есть sessionId в заказе, мы можем найти его и проверить
      // Но проще вызвать общий эндпоинт, если мы знаем sessionId.
      // В данном случае, Stripe возвращает session_id в URL? Нет.
      // Поэтому мы вызываем проверку для ВСЕХ pending заказов или последнего.
      
      // Упрощенный вариант: вызываем confirmPayment для последнего "pending" заказа,
      // у которого есть sessionId.
      const pendingOrder = orders.find(o => o.status === 'pending' && o.stripeSessionId);
      
      if (pendingOrder && pendingOrder.stripeSessionId) {
         apiClient.post('/orders/confirm', { sessionId: pendingOrder.stripeSessionId })
          .then(res => {
            if (res.data.success) {
              fetchOrders(); // Обновляем список заказов
            }
          })
          .catch(err => console.error("Error confirming payment", err));
      }
    } else if (canceled) {
      alert('Оплата отменена');
    }
  }, [orders]); // Зависимость от orders важна, чтобы найти pending заказ

  const getStatusInfo = (status) => {
    switch (status) {
      case 'paid': return { text: '✅ Оплачен', class: 'status-paid' };
      case 'pending': return { text: '⏳ Ожидает оплаты', class: 'status-pending' };
      case 'failed': return { text: '❌ Отменён', class: 'status-failed' };
      default: return { text: status, class: '' };
    }
  };

  if (loading) return <div className="container">Загрузка...</div>;

  return (
    <div className="container">
      <div className="orders-header">
        <h2>📦 История заказов</h2>
        <Link to="/products" className="btn-back-shopping">← К покупкам</Link>
      </div>

      {orders.length === 0 ? (
        <div className="empty-orders">
          <p>У вас пока нет заказов</p>
          <Link to="/products" className="btn-primary">Перейти к покупкам</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            return (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-id">
                    <strong>Заказ #{order._id.slice(-6).toUpperCase()}</strong>
                    <span className={`order-status ${statusInfo.class}`}>
                      {statusInfo.text}
                    </span>
                  </div>
                  <div className="order-date">
                    {new Date(order.createdAt).toLocaleString('ru-RU', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>

                <div className="order-items">
                  {order.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <div className="order-item-info">
                        <span className="item-title">{item.title}</span>
                        <span className="item-quantity">x {item.quantity}</span>
                      </div>
                      <span className="item-price">{(item.price * item.quantity).toLocaleString()} ₽</span>
                    </div>
                  ))}
                </div>

                <div className="order-total">
                  <span>Итого:</span>
                  <strong>{order.totalAmount.toLocaleString()} ₽</strong>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}