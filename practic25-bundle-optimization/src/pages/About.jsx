function About() {
  return (
    <div className="page about">
      <h1>ℹ️ О нас</h1>
      <p>
        Это демонстрационное приложение для Практического занятия №25
        по дисциплине "Фронтенд и бэкенд разработка".
      </p>
      
      <div className="info-section">
        <h3>Цели практики:</h3>
        <ul>
          <li>Изучение современных инструментов сборки</li>
          <li>Освоение Vite как альтернативы Webpack</li>
          <li>Применение техник оптимизации бандла</li>
          <li>Code splitting и lazy loading</li>
          <li>Анализ размера бандла</li>
        </ul>
      </div>

      <div className="tech-stack">
        <h3>Технологический стек:</h3>
        <div className="tech-grid">
          <div className="tech-item">⚛️ React 18</div>
          <div className="tech-item">⚡ Vite</div>
          <div className="tech-item">🔄 React Router</div>
          <div className="tech-item">📊 Rollup Visualizer</div>
        </div>
      </div>
    </div>
  )
}

export default About