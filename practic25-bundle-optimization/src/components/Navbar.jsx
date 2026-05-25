import { Link } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-brand">Practice 25</div>
      <ul className="nav-links">
        <li><Link to="/">Главная</Link></li>
        <li><Link to="/about">О нас</Link></li>
        <li><Link to="/lazy">Lazy Loading</Link></li>
      </ul>
    </nav>
  )
}

export default Navbar