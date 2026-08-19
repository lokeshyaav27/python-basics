import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { adminLogin } from '../../services/auth'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const auth = useAuth()
  const nav = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await adminLogin(email, password)
      const user = res?.user || {}
      const name = user?.name || email
      const token = res?.accessToken || ''
      auth.login(
        name,
        'admin',
        {
          id: user.id,
          email: user.email,
          mobile: user.mobile,
          photo: user.photo,
          isAdmin: true,
        },
        token
      )
      nav('/admin')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Login failed')
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Admin Login</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full p-2 border" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" className="w-full p-2 border" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        {error && <div className="text-red-600">{error}</div>}
        <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Login</button>
      </form>
    </div>
  )
}
