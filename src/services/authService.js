// src/services/authService.js
import { api } from './api'

const authService = {
  login(email, password, signal) {
    return api('/auth/login', { method: 'POST', body: { email, password }, signal })
  },

  register(name, email, password, signal) {
    return api('/auth/register', { method: 'POST', body: { name, email, password }, signal })
  },

  me(signal) {
    return api('/auth/me', { signal })
  },
}

export default authService