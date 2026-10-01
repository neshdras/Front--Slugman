import { Routes, Route, Navigate } from "react-router"
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider } from './context/AuthContext.jsx';
import { GameProvider } from './context/GameContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import MapPage from './pages/Map.jsx';
import PlayPage from './pages/Play.jsx';
import './styles/vn.css';

// import NotFound from './pages/notfound';

function App() {
  return (
      <AuthProvider>
        <GameProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/map" element={<MapPage />} />
              <Route path="/play" element={<PlayPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/map" replace />} />
          </Routes>
        </GameProvider>
      </AuthProvider>
  );
}

export default App