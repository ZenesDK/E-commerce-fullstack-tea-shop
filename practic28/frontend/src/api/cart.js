import apiClient from './index';

// Получить корзину
export const getCart = () => apiClient.get('/cart');

// Добавить товар
export const addToCart = (productId, quantity = 1) => 
    apiClient.post('/cart/add', { productId, quantity });

// Удалить товар
export const removeFromCart = (productId) => 
    apiClient.delete(`/cart/remove/${productId}`);

// Изменить количество
export const updateQuantity = (productId, quantity) => 
    apiClient.put(`/cart/update/${productId}`, { quantity });

// Синхронизация (отправка локальных данных на сервер)
export const syncCart = (localItems) => {
    const promises = localItems.map(item => 
        apiClient.post('/cart/add', { productId: item.productId, quantity: item.quantity })
    );
    return Promise.all(promises);
};