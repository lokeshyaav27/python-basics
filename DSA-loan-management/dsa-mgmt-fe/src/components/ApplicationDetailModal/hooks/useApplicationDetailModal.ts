import { useState, useEffect } from 'react'
import { message } from 'antd'
import { useMutation } from '@tanstack/react-query'
import {
  LoanApplication,
  updateLoanApplication,
  ClientGeneralDetailsData,
  HomeLoanDetailsData,
  CarLoanDetailsData,
  PersonalLoanDetailsData,
} from '../../../services/loanApplications'

export const useApplicationDetailModal = (
  application: LoanApplication | null,
  onUpdated?: () => void
) => {
  const [isEditing, setIsEditing] = useState(false)

  const [name, setName] = useState(application?.name || '')
  const [email, setEmail] = useState(application?.email || '')
  const [mobile, setMobile] = useState(application?.mobile || '')

  const [generalDetails, setGeneralDetails] = useState<ClientGeneralDetailsData>(
    application?.clientGeneralDetails || {}
  )
  const [homeDetails, setHomeDetails] = useState<HomeLoanDetailsData>(
    application?.homeLoanDetails || {}
  )
  const [carDetails, setCarDetails] = useState<CarLoanDetailsData>(
    application?.carLoanDetails || {}
  )
  const [personalDetails, setPersonalDetails] = useState<PersonalLoanDetailsData>(
    application?.personalLoanDetails || {}
  )

  useEffect(() => {
    if (application) {
      setName(application.name || '')
      setEmail(application.email || '')
      setMobile(application.mobile || '')
      setGeneralDetails(application.clientGeneralDetails || {})
      setHomeDetails(application.homeLoanDetails || {})
      setCarDetails(application.carLoanDetails || {})
      setPersonalDetails(application.personalLoanDetails || {})
      setIsEditing(false)
    }
  }, [application])

  const updateMutation = useMutation({
    mutationFn: (payload: any) => {
      if (!application) throw new Error('No active application')
      return updateLoanApplication(application.id, payload)
    },
    onSuccess: () => {
      message.success('Application details updated successfully!')
      setIsEditing(false)
      if (onUpdated) onUpdated()
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.detail || 'Failed to update application details')
    },
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!application) return
    updateMutation.mutate({
      name,
      email,
      mobile,
      clientGeneralDetails: generalDetails,
      homeLoanDetails: homeDetails,
      carLoanDetails: carDetails,
      personalLoanDetails: personalDetails,
    })
  }

  const productName = application?.productName || 'Loan Application'
  const isHomeLoan =
    productName.toLowerCase().includes('home') || productName.toLowerCase().includes('housing')
  const isCarLoan =
    productName.toLowerCase().includes('car') ||
    productName.toLowerCase().includes('auto') ||
    productName.toLowerCase().includes('vehicle')
  const isPersonalLoan =
    productName.toLowerCase().includes('personal') || (!isHomeLoan && !isCarLoan)

  return {
    isEditing,
    setIsEditing,
    isSaving: updateMutation.isPending,
    name,
    setName,
    email,
    setEmail,
    mobile,
    setMobile,
    generalDetails,
    setGeneralDetails,
    homeDetails,
    setHomeDetails,
    carDetails,
    setCarDetails,
    personalDetails,
    setPersonalDetails,
    productName,
    isHomeLoan,
    isCarLoan,
    isPersonalLoan,
    handleSave,
  }
}
