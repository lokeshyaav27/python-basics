import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'
import { Header, Footer } from './components'
import AppRoutes from './routes/AppRoutes'

const App: React.FC = () => {
  let authUser: any = null
  try {
    const auth = useAuth()
    authUser = auth?.user ?? null
  } catch (e) {
    authUser = null
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
        {!authUser && <Header />}
        <main className="flex-1 flex flex-col">
          <AppRoutes />
        </main>
        {!authUser && <Footer />}
      </div>
    </BrowserRouter>
  )
}

export default App
