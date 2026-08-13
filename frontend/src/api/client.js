import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  getStats: () => api.get('/auth/stats'),
}

// ─── Contracts ───────────────────────────────────────────────────────────────
export const contractsAPI = {
  upload: (formData) => api.post('/contracts/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  list: (skip = 0, limit = 20) => api.get(`/contracts?skip=${skip}&limit=${limit}`),
  get: (id) => api.get(`/contracts/${id}`),
  delete: (id) => api.delete(`/contracts/${id}`),
}

// ─── Analysis ────────────────────────────────────────────────────────────────
export const analysisAPI = {
  run: (contractId) => api.post(`/analysis/run/${contractId}`),
  get: (contractId) => api.get(`/analysis/${contractId}`),
  optimizeClause: (data) => api.post('/analysis/optimize/clause', data),
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const chatAPI = {
  sendMessage: (data) => api.post('/chat/message', data),
  getHistory: () => api.get('/chat/history'),
}

// ─── Negotiation ─────────────────────────────────────────────────────────────
export const negotiationAPI = {
  suggest: (data) => api.post('/negotiation/suggest', data),
  getHistory: (contractId) => api.get(`/negotiation/history/${contractId}`),
}

// ─── Export ──────────────────────────────────────────────────────────────────
export const exportAPI = {
  pdf: (contractId) => api.get(`/export/pdf/${contractId}`, { responseType: 'blob' }),
  docx: (contractId) => api.get(`/export/docx/${contractId}`, { responseType: 'blob' }),
}

export default api
