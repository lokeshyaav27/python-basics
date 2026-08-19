import axios from 'axios'
import { store } from '../store'
import { logout } from '../store/slices/authSlice'
import { API_BASE_URL } from '../constants/apiEndpoints'

export { API_BASE_URL }

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

// Request Interceptor: Attach JWT Bearer token & role headers from Redux state
apiClient.interceptors.request.use(
  (config) => {
    try {
      const state = store.getState()
      const token = state.auth.accessToken
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      const user = state.auth.user
      if (user) {
        if (user.role) {
          config.headers['X-User-Role'] = user.role
        }
        if (user.id) {
          config.headers['X-User-Id'] = String(user.id)
        }
        if (user.uniqueCustomerId) {
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

// Response Interceptor: Handle 401 Unauthorized globally via Redux action
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/api/auth/')
      if (!isAuthEndpoint) {
        console.warn('Session expired or unauthorized request, dispatching logout.')
        store.dispatch(logout())
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
