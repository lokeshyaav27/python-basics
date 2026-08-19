import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

// Request Interceptor: Attach JWT Bearer token & role headers
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('dsa_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      const rawUser = localStorage.getItem('dsa_user')
      if (rawUser) {
        const user = JSON.parse(rawUser)
        if (user?.role) {
          config.headers['X-User-Role'] = user.role
        }
        if (user?.id) {
          config.headers['X-User-Id'] = String(user.id)
        }
        if (user?.uniqueCustomerId) {
          config.headers['X-Customer-Id'] = String(user.uniqueCustomerId)
        }
      }
    } catch (err) {
      console.error('Error attaching auth headers to request', err)
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Handle 401 Unauthorized globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/api/auth/')
      if (!isAuthEndpoint) {
        console.warn('Session expired or unauthorized request, clearing auth state.')
        localStorage.removeItem('dsa_token')
        localStorage.removeItem('dsa_user')
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
