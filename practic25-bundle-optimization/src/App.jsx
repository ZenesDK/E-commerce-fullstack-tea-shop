import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import About from './pages/About'

// Ленивая загрузка страницы
const LazyLoadedPage = lazy(() => import('./pages/LazyLoadedPage'))

import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Suspense fallback={<div className="loading-page">Загрузка...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/lazy" element={<LazyLoadedPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  )
}

export default App