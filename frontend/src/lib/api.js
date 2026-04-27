import axios from 'axios'

const api = axios.create({
  baseURL: '',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('lantern_token')
      delete api.defaults.headers.common['Authorization']
      window.location.href = '/auth'
    }
    return Promise.reject(err)
  }
)

export default api
