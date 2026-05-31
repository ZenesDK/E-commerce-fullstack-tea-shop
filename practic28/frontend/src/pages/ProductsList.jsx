import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getProducts, deleteProduct } from '../api/products';
import { useCart } from '../context/CartContext'; // 👈 Импортируем хук корзины

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  
  // 🔍 Состояние для фильтров
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: ''
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const navigate = useNavigate();
  
  // 🛒 Получаем данные корзины из контекста
  const { items, addToCart, totalCount } = useCart();

  const updateRole = () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const role = decoded.role;
        localStorage.setItem('userRole', role);
        setUserRole(role);
      } catch (err) {
        console.error('Ошибка декодирования токена:', err);
      }
    }
  };

  // 🔍 Debounce для поиска (300мс задержка)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(handler);
  }, [filters.search]);

  // 🏷️ Получаем уникальные категории из товаров
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    return cats.sort();
  }, [products]);

  useEffect(() => {
    updateRole();
    fetchProducts();
  }, []);

  // 🔍 Обновлённая функция загрузки с фильтрами
  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      
      const queryString = params.toString();
      const url = `/products${queryString ? `?${queryString}` : ''}`;
      
      const response = await getProducts(url);
      
      let productsData = response.data;
      if (productsData && typeof productsData === 'object' && !Array.isArray(productsData)) {
        productsData = productsData.data || [];
      } else if (!Array.isArray(productsData)) {
        productsData = [];
      }
      setProducts(productsData);
    } catch (err) {
      console.error(err);
      alert('Ошибка загрузки товаров: ' + (err.response?.data?.error || err.message));
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.category, filters.minPrice, filters.maxPrice]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ search: '', category: '', minPrice: '', maxPrice: '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Удалить товар?')) {
      try {
        await deleteProduct(id);
        fetchProducts();
      } catch (err) {
        console.error(err);
        alert('Ошибка удаления товара');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const toggleDescription = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleImageError = (productId) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1)
      .then(() => {
        // Можно показать тост/уведомление
      })
      .catch(() => {
        // Ошибка уже обработана в addToCart
      });
  };

  const isAdmin = userRole === 'admin';
  const isCustomer = userRole === 'customer' || isAdmin;

  if (userRole === null) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header-with-logout">
        <h2>Мир чая</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* 🛒 Кнопка корзины */}
          <Link to="/cart" className="btn-cart-icon" title="Корзина">
            🛒 {totalCount > 0 ? <span className="cart-badge">{totalCount}</span> : ''}
          </Link>
          
          <span className="user-role-badge">
            {userRole === 'admin' ? 'Администратор' : 'Покупатель'}
          </span>
          <button onClick={handleLogout} className="btn-logout">Выйти</button>
        </div>
      </div>

      {/* 🔍 Панель поиска и фильтрации */}
      <div className="filters-panel">
        <div className="filters-row">
          <div className="filter-group filter-group--search">
            <label htmlFor="search">🔍 Поиск</label>
            <input
              id="search"
              type="text"
              placeholder="Название товара..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="filter-input filter-input--green"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="category">🏷️ Категория</label>
            <select
              id="category"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="filter-input filter-input--green"
            >
              <option value="">Все категории</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-group filter-group--price">
            <label htmlFor="minPrice">💰 От</label>
            <input
              id="minPrice"
              type="number"
              placeholder="0"
              min="0"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="filter-input filter-input--green filter-input--small"
            />
          </div>

          <div className="filter-group filter-group--price">
            <label htmlFor="maxPrice">До</label>
            <input
              id="maxPrice"
              type="number"
              placeholder="∞"
              min="0"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="filter-input filter-input--green filter-input--small"
            />
          </div>

          <button type="button" onClick={handleResetFilters} className="btn-reset" title="Сбросить фильтры">
            ↺ Сброс
          </button>
        </div>
        
        {(debouncedSearch || filters.category || filters.minPrice || filters.maxPrice) && (
          <div className="filters-active">
            <span>Активные фильтры:</span>
            {debouncedSearch && <span className="filter-tag">🔍 "{debouncedSearch}"</span>}
            {filters.category && <span className="filter-tag">🏷️ {filters.category}</span>}
            {(filters.minPrice || filters.maxPrice) && (
              <span className="filter-tag">💰 {filters.minPrice || 0}–{filters.maxPrice || '∞'} ₽</span>
            )}
            <button onClick={handleResetFilters} className="filter-tag filter-tag--remove" title="Сбросить">✕</button>
          </div>
        )}
      </div>

      <div className="toolbar">
        {isAdmin && (
          <Link to="/products/new" className="btn-primary">Добавить товар</Link>
        )}
        {isAdmin && (
          <Link to="/users" className="btn-admin">Управление пользователями</Link>
        )}
      </div>

      {!Array.isArray(products) || products.length === 0 ? (
        <div className="empty">
          <p>Нет товаров. {isAdmin && 'Нажмите "Добавить товар" чтобы создать первый.'}</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((p) => (
            <div key={p.id} className="product-card">
              {p.imageUrl && !imageErrors[p.id] && (
                <div className="product-image">
                  <img
                    src={`http://localhost${p.imageUrl}`}
                    alt={p.title}
                    onError={() => handleImageError(p.id)}
                    loading="lazy"
                  />
                </div>
              )}
              {(!p.imageUrl || imageErrors[p.id]) && (
                <div className="product-image product-image--placeholder">
                  <span>📷</span>
                  <span>Нет изображения</span>
                </div>
              )}
              <div className="product-card-header">
                <h3 className="product-title">{p.title}</h3>
                <span className="product-category">{p.category}</span>
              </div>
              <div className="product-price">
                {p.price.toLocaleString()} ₽
              </div>
              <div className="product-description">
                <p className={expandedId === p.id ? 'expanded' : 'collapsed'}>
                  {p.description}
                </p>
                {p.description && p.description.length > 100 && (
                  <button className="toggle-description" onClick={() => toggleDescription(p.id)}>
                    {expandedId === p.id ? 'Свернуть' : 'Читать далее'}
                  </button>
                )}
              </div>
              <div className="product-card-actions">
                {p.stock <= 0 ? (
                  <button className="btn-out-of-stock" disabled>
                    Нет в наличии
                  </button>
                ) : (
                  <button 
                    className="btn-cart" 
                    onClick={() => handleAddToCart(p)}
                    title="Добавить в корзину"
                  >
                    В корзину
                  </button>
                )}
                
                {isAdmin && (
                  <Link to={`/products/${p.id}/edit`} className="btn-edit" title="Редактировать">
                    Редактировать
                  </Link>
                )}
                {isAdmin && (
                  <button onClick={() => handleDelete(p.id)} className="btn-delete" title="Удалить">
                    Удалить
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}