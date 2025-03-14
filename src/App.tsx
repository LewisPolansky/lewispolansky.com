import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import { Profile } from './pages/Profile'
import { Animator } from './pages/Animator'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Profile />} />
        <Route path="/animator" element={<Animator />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
