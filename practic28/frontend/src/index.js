import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import App from './App';
import { CartProvider } from './context/CartContext'; // 👈 Импортируем

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <CartProvider> {/* 👈 Оборачиваем */}
      <App />
    </CartProvider>
  </React.StrictMode>
);