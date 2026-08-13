import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export async function fetchBanks() {
  const res = await axios.get(`${API_BASE_URL}/api/banks`)
  return res.data || []
}
