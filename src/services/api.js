// src/services/api.js
export const API_URL = (import.meta.env.VITE_API_URL || 'https://back-slugman.vercel.app/api/v1').replace(/\/+$/, '')
export const TOKEN_KEY = 'vn_token'

export async function api(path, { method = 'GET', body, signal } = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error(data?.message ?? `Erreur ${res.status}`)
    err.status = res.status
    throw err
  }
  return data
}