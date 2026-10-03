import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('Не найден #root')

// Файл данных и язык читаются в App: надписи подставляются туда же,
// где t() используется в компонентах.
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
