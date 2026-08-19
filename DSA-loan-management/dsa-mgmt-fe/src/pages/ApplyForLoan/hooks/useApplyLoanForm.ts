import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { message } from 'antd'
import { submitFullLoanApplication } from '../../../services/loanApplications'

export const useApplyLoanForm = (products: any[], user: any) => {
  const [searchParams] = useSearchParams()

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successModal, setSuccessModal] = useState<{ open: boolean; appId?: number } | null>(null)

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)

  const [basicInfo, setBasicInfo] = useState({
    name: '',
    email: '',
    mobile: '',
  })

  const [financialInfo, setFinancialInfo] = useState({
    age: '30',
    gender: 'Male',
    location: '',
    employment_type: 'Salaried',
    isSalaried: true,
    monthly_income: '',
    monthly_obligation: '',
    existing_emi: '',
    cibil_score: '750',
    loan_amount_required: '',
    preferred_tenure: '60',
  })

  const [homeLoanDetails, setHomeLoanDetails] = useState({
    property_value: '',
    property_location: '',
    propertyUsageType: 'Residential',
    down_payment: '',
    isPartProperty: false,
    propertyRequirement: 'Ready to Move',
    propertyType: 'Apartment',
    propertyStatus: 'Freehold',
    femaleCoApplicant: false,
    propertyInsurance: true,
    applicantInsurance: true,
  })

  const [carLoanDetails, setCarLoanDetails] = useState({
    new_or_used: 'New',
    car_value: '',
    down_payment: '',
    vehicle_age: '0',
  })

  const [personalLoanDetails, setPersonalLoanDetails] = useState({
    loan_purpose: 'Home Improvement',
    other: '',
    required_amount: '',
    existing_obligations: '',
  })

  useEffect(() => {
    if (user) {
      setBasicInfo((prev) => ({
        name: user.name || prev.name || '',
        email: user.email || prev.email || '',
        mobile: user.mobile || (!isNaN(Number(user.name)) ? user.name : '') || prev.mobile || '',
      }))
    }
  }, [user])

  useEffect(() => {
    const pId = searchParams.get('productId')
    if (pId && products.length > 0) {
      const match = products.find((p: any) => p.id === Number(pId))
      if (match) setSelectedProductId(match.id)
    }
  }, [searchParams, products])

  const selectedProduct = products.find((p: any) => p.id === selectedProductId)
  const productName = selectedProduct?.name || ''
  const isHomeLoan =
    productName.toLowerCase().includes('home') || productName.toLowerCase().includes('housing')
  const isCarLoan =
    productName.toLowerCase().includes('car') ||
    productName.toLowerCase().includes('auto') ||
    productName.toLowerCase().includes('vehicle')
  const isPersonalLoan =
    productName.toLowerCase().includes('personal') || (!isHomeLoan && !isCarLoan)

  const handleStep1Next = () => {
    if (!selectedProductId) {
      setErrorMessage('Please select a loan product to proceed.')
      return
    }
    setErrorMessage('')
    setStep(2)
  }

  const handleStep2Next = () => {
    if (!basicInfo.name.trim()) {
      setErrorMessage('Please enter your full legal name.')
      return
    }
    if (!basicInfo.email.trim() || !basicInfo.email.includes('@')) {
      setErrorMessage('Please enter a valid email address.')
      return
    }
    if (!basicInfo.mobile.trim() || basicInfo.mobile.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.')
      return
    }
    setErrorMessage('')
    setStep(3)
  }

  const handleStep3Next = () => {
    if (!financialInfo.monthly_income || Number(financialInfo.monthly_income) <= 0) {
      setErrorMessage('Please enter a valid monthly net income.')
      return
    }
    if (!financialInfo.loan_amount_required || Number(financialInfo.loan_amount_required) <= 0) {
      setErrorMessage('Please specify your required loan amount.')
      return
    }
    setErrorMessage('')
    setStep(4)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      if (!selectedProductId) throw new Error('Product not selected')

      const payload = {
        productId: selectedProductId,
        name: basicInfo.name.trim(),
        email: basicInfo.email.trim(),
        mobile: basicInfo.mobile.trim(),
        clientGeneralDetails: {
          age: financialInfo.age ? Number(financialInfo.age) : null,
          gender: financialInfo.gender,
          location: financialInfo.location,
          employment_type: financialInfo.employment_type,
          isSalaried: financialInfo.employment_type === 'Salaried',
          monthly_income: financialInfo.monthly_income ? Number(financialInfo.monthly_income) : null,
          monthly_obligation: financialInfo.monthly_obligation
            ? Number(financialInfo.monthly_obligation)
            : 0,
          existing_emi: financialInfo.existing_emi ? Number(financialInfo.existing_emi) : 0,
          cibil_score: financialInfo.cibil_score ? Number(financialInfo.cibil_score) : null,
          loan_amount_required: financialInfo.loan_amount_required
            ? Number(financialInfo.loan_amount_required)
            : null,
          preferred_tenure: financialInfo.preferred_tenure
            ? Number(financialInfo.preferred_tenure)
            : null,
        },
        homeLoanDetails: isHomeLoan
          ? {
              property_value: homeLoanDetails.property_value
                ? Number(homeLoanDetails.property_value)
                : null,
              property_location: homeLoanDetails.property_location,
              propertyUsageType: homeLoanDetails.propertyUsageType,
              down_payment: homeLoanDetails.down_payment
                ? Number(homeLoanDetails.down_payment)
                : null,
              isPartProperty: homeLoanDetails.isPartProperty,
              propertyRequirement: homeLoanDetails.propertyRequirement,
              propertyType: homeLoanDetails.propertyType,
              propertyStatus: homeLoanDetails.propertyStatus,
              femaleCoApplicant: homeLoanDetails.femaleCoApplicant,
              propertyInsurance: homeLoanDetails.propertyInsurance,
              applicantInsurance: homeLoanDetails.applicantInsurance,
            }
          : undefined,
        carLoanDetails: isCarLoan
          ? {
              new_or_used: carLoanDetails.new_or_used,
              car_value: carLoanDetails.car_value ? Number(carLoanDetails.car_value) : null,
              down_payment: carLoanDetails.down_payment
                ? Number(carLoanDetails.down_payment)
                : null,
              vehicle_age: carLoanDetails.vehicle_age
                ? Number(carLoanDetails.vehicle_age)
                : 0,
            }
          : undefined,
        personalLoanDetails: isPersonalLoan
          ? {
              loan_purpose: personalLoanDetails.loan_purpose,
              other: personalLoanDetails.other,
              required_amount: personalLoanDetails.required_amount
                ? Number(personalLoanDetails.required_amount)
                : financialInfo.loan_amount_required
                ? Number(financialInfo.loan_amount_required)
                : null,
              existing_obligations: personalLoanDetails.existing_obligations
                ? Number(personalLoanDetails.existing_obligations)
                : null,
            }
          : undefined,
      }

      const res = await submitFullLoanApplication(payload)
      const createdApp = res?.application || {}

      message.success('Loan application submitted successfully!')
      setSuccessModal({ open: true, appId: createdApp.id })
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.detail ||
          err.message ||
          'Failed to submit loan application. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    step,
    setStep,
    isSubmitting,
    errorMessage,
    setErrorMessage,
    successModal,
    selectedProductId,
    setSelectedProductId,
    basicInfo,
    setBasicInfo,
    financialInfo,
    setFinancialInfo,
    homeLoanDetails,
    setHomeLoanDetails,
    carLoanDetails,
    setCarLoanDetails,
    personalLoanDetails,
    setPersonalLoanDetails,
    isHomeLoan,
    isCarLoan,
    isPersonalLoan,
    handleStep1Next,
    handleStep2Next,
    handleStep3Next,
    handleSubmit,
  }
}
