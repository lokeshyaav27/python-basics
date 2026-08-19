import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { useAuth } from '../../auth/AuthProvider'
import { agentLogin, resetAgentPassword } from '../../services/auth'
import { ROUTES } from '../../constants'
import {
  FirstTimePasswordResetModal,
  AgentLoginForm,
} from './components'

const AgentLogin: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // First-time reset password state
  const [showResetModal, setShowResetModal] = useState(false)
  const [pendingAgent, setPendingAgent] = useState<{
    id: number
    name: string
    email: string
    token: string
  } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  const auth = useAuth()
  const nav = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await agentLogin(email.trim(), password)
      const user = res?.user

      const isFirstLogin =
        user?.temppasswordreset === false || user?.tempPasswordReset === false

      if (isFirstLogin) {
        setPendingAgent({
          id: user.id,
          name: user.name || email,
          email: user.email || email,
          token: res?.accessToken || '',
        })
        setShowResetModal(true)
        setLoading(false)
        return
      }

      const name = user?.name || email
      auth.login(res.accessToken, {
        id: user.id,
        name,
        email: user.email || email,
        mobile: user.mobile,
        role: 'agent',
        photo: user.photo,
        isAdmin: false,
      })
      message.success(`Welcome back, ${name}!`)
      nav(ROUTES.AGENT.LOAN_APPLICATIONS)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError(null)

    if (!newPassword.trim()) {
      setResetError('New password is required')
      return
    }

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setResetError('New password and confirm password do not match')
      return
    }

    if (!pendingAgent) return

    setResetLoading(true)
    try {
      await resetAgentPassword(newPassword.trim(), pendingAgent.token)
      message.success('Password updated successfully! Please log in with your new password.')
      setShowResetModal(false)
      setPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPendingAgent(null)
    } catch (err: any) {
      setResetError(err?.response?.data?.detail || 'Failed to update password')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AgentLoginForm
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          loading={loading}
          error={error}
          onSubmit={handleLogin}
        />
      </div>

      <FirstTimePasswordResetModal
        isOpen={showResetModal}
        pendingAgent={pendingAgent}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        resetLoading={resetLoading}
        resetError={resetError}
        onSubmit={handleResetPassword}
      />
    </div>
  )
}

export default AgentLogin
