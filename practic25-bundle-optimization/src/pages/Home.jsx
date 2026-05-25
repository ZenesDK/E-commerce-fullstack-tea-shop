import { useState } from 'react'

function Home() {
  const [count, setCount] = useState(0)

  return (
    <div className="page home">
      <h1>🏠 Главная страница</h1>
      <p>Это основная страница приложения.</p>
      
      <div className="counter">
        <h2>Интерактивный счётчик:</h2>
        <p>Счётчик: {count}</p>
        <button onClick={() => setCount(count + 1)}>
          Увеличить
        </button>
        <button onClick={() => setCount(0)} style={{ marginLeft: '10px' }}>
          Сбросить
        </button>
      </div>

      <div className="features">
        <h3>Возможности приложения:</h3>
        <ul>
          <li>✅ Маршрутизация с React Router</li>
          <li>✅ Lazy Loading компонентов</li>
          <li>✅ Code Splitting</li>
          <li>✅ Анализ бандла</li>
          <li>✅ Оптимизация сборки Vite</li>
        </ul>
      </div>
    </div>
  )
}

export default Home