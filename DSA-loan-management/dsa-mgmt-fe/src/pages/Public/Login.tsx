import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'

export default function Login() {
  const [name, setName] = useState('')
  const [role, setRole] = useState<'admin'|'agent'|'customer'>('agent')
  const auth = useAuth()
  const nav = useNavigate()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    auth.login(name || 'user', role)
    // redirect based on role
    if (role === 'admin') nav('/admin')
    else if (role === 'agent') nav('/agent/customers')
    else nav('/customer')
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Login (demo)</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full p-2 border" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <select className="w-full p-2 border" value={role} onChange={e=>setRole(e.target.value as any)}>
          <option value="admin">Admin</option>
          <option value="agent">Agent</option>
          <option value="customer">Customer</option>
        </select>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Login</button>
        </div>
      </form>
    </div>
  )
}
