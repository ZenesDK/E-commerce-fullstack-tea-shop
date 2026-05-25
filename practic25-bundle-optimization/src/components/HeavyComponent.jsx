import { useState } from 'react'
import './HeavyComponent.css'

function HeavyComponent() {
  const [data, setData] = useState([])

  const generateData = () => {
    const newData = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      value: Math.random().toString(36).substr(2, 9)
    }))
    setData(newData)
  }

  return (
    <div className="heavy-component">
      <h3>Тяжёлый компонент</h3>
      <button onClick={generateData}>
        Сгенерировать 1000 элементов
      </button>
      {data.length > 0 && (
        <div className="data-list">
          {data.map(item => (
            <div key={item.id} className="data-item">
              {item.value}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default HeavyComponent