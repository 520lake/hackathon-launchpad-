import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Pages
import Layout from './pages/Layout'
import HomePage from './pages/HomePage'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import ProfilePage from './pages/ProfilePage'
import CreateHackathonPage from './pages/CreateHackathonPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/create" element={<CreateHackathonPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
