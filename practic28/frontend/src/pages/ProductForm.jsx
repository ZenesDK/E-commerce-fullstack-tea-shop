import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProduct, createProduct, updateProduct } from '../api/products';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  // 🔥 ДОБАВЛЕНО: stock в начальное состояние
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
    stock: '', // Изначально пустая строка, чтобы работал placeholder
    image: null
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await getProduct(id);
      let product = response.data;
      
      // Обработка кэшированного ответа
      if (product && typeof product === 'object' && !Array.isArray(product) && product.data) {
        product = product.data;
      }
      
      // 🔥 ОБНОВЛЕНО: загружаем stock, если он есть
      setForm({
        title: product.title || '',
        category: product.category || '',
        description: product.description || '',
        price: product.price !== undefined && product.price !== null ? String(product.price) : '',
        stock: product.stock !== undefined && product.stock !== null ? String(product.stock) : '', 
        image: null
      });
      
      const imageUrl = product.imageUrl || product.image_url;
      if (imageUrl) {
        setImagePreview(`http://localhost${imageUrl}`);
      } else {
        setImagePreview(null);
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка загрузки товара');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('category', form.category);
      formData.append('description', form.description);
      
      const priceValue = parseFloat(form.price);
      if (isNaN(priceValue)) throw new Error('Цена должна быть числом');
      formData.append('price', priceValue);

      // 🔥 ИСПРАВЛЕНО: Обязательно добавляем stock в FormData
      // Если поле пустое, сохраняем 0, иначе парсим число
      const stockValue = parseInt(form.stock) || 0; 
      formData.append('stock', stockValue);

      if (form.image) {
        formData.append('image', form.image);
      }

      if (id) {
        await updateProduct(id, formData);
        alert('Товар обновлён');
      } else {
        await createProduct(formData);
        alert('Товар создан');
      }
      navigate('/products');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  return (
    <div className="container">
      <h2>{id ? 'Редактировать товар' : 'Новый товар'}</h2>
      <form onSubmit={handleSubmit} className="product-form" encType="multipart/form-data">
        <input
          type="text"
          placeholder="Название"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          disabled={loading}
        />
        <input
          type="text"
          placeholder="Категория"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          required
          disabled={loading}
        />
        <textarea
          placeholder="Описание"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
          disabled={loading}
        />
        
        <input
          type="number"
          placeholder="Цена"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
          disabled={loading}
        />

        {/* 🔥 НОВОЕ ПОЛЕ: Количество на складе */}
        <input
          type="number"
          placeholder="Количество на складе" // Вместо 0
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
          min="0"
          disabled={loading}
          style={{ background: '#fff', color: '#333' }} // Стили для контраста
        />

        <div className="image-upload">
          <label className="image-upload__label">
            <span>📷 {imagePreview ? 'Изменить изображение' : 'Выберите изображение'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={loading}
              className="image-upload__input"
            />
          </label>
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Предпросмотр" />
              <button type="button" className="image-preview__remove" onClick={() => {
                setImagePreview(null);
                setForm({ ...form, image: null });
              }}>✕</button>
            </div>
          )}
        </div>

        <div className="form-buttons">
          <button type="submit" className="form-btn form-btn--submit" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button type="button" className="form-btn form-btn--cancel" onClick={() => navigate('/products')} disabled={loading}>
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}