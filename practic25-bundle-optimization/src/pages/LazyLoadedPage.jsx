import { Suspense, lazy } from 'react'
import './LazyLoadedPage.css'

// Ленивая загрузка тяжёлого компонента
const HeavyComponent = lazy(() => import('../components/HeavyComponent'))

function LazyLoadedPage() {
  return (
    <div className="page lazy-page">
      <h1>🚀 Страница с Lazy Loading</h1>
      <p>
        Компонент ниже загружается лениво (только при отображении этой страницы):
      </p>
      
      <Suspense fallback={
        <div className="loading">
          <div className="spinner"></div>
          <p>Загрузка компонента...</p>
        </div>
      }>
        <HeavyComponent />
      </Suspense>

      <div className="info-box">
        <h3>Преимущества Lazy Loading:</h3>
        <ul>
          <li>📦 Уменьшение начального размера бандла</li>
          <li>⚡ Быстрая загрузка главной страницы</li>
          <li>💾 Компоненты загружаются только при необходимости</li>
          <li>🎯 Улучшение производительности</li>
        </ul>
      </div>
    </div>
  )
}

export default LazyLoadedPage