import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, TOKEN_KEY } from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true tant qu'on ne sait pas si la session est valide

  // Au chargement de l'app : si un token existe, on demande au back qui on est.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    api('/auth/me')
      .then((data) => setUser(data.user ?? data))
      .catch((err) => {
        if (err.status === 401) localStorage.removeItem(TOKEN_KEY); // token expiré/invalide
      })
      .finally(() => setLoading(false));
  }, []);

  // À appeler dans ton login/inscription existant, avec la réponse du back.
  const saveSession = useCallback((token, userData) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, saveSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}