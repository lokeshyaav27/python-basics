import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { message } from 'antd'
import { fetchProducts } from '../../services/products'
import { submitFullLoanApplication } from '../../services/loanApplications'
import { useAuth } from '../../auth/AuthProvider'
import { ROUTES } from '../../constants/routes'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const ApplyForLoan: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  // Multi-step state (1: Product, 2: Basic Info, 3: Financial Info, 4: Specific Details)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successModal, setSuccessModal] = useState<{ open: boolean; appId?: number } | null>(null)

  // Step 1: Product Selection
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)

  // Step 2: Contact Information
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    email: '',
    mobile: '',
  })

  // Step 3: Personal & Financial Information (client_general_details)
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
    preferred_tenure: '60', // months
  })

  // Step 4: Product Specific Details
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

  // Fetch available products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-list'],
    queryFn: fetchProducts,
  })

  // Auto-fill basic info if user is already logged in
  useEffect(() => {
    if (user) {
      setBasicInfo((prev) => ({
        name: user.name || prev.name || '',
        email: user.email || prev.email || '',
        mobile: user.mobile || (!isNaN(Number(user.name)) ? user.name : '') || prev.mobile || '',
      }))
    }
  }, [user])

  // Pre-select product if productId query param exists
  useEffect(() => {
    const pId = searchParams.get('productId')
    if (pId && products.length > 0) {
      const match = products.find((p: any) => p.id === Number(pId))
      if (match) {
        setSelectedProductId(match.id)
      }
    }
  }, [searchParams, products])

  // Get currently selected product object
  const selectedProduct = products.find((p: any) => p.id === selectedProductId)
  const productType = (selectedProduct?.name || '').toLowerCase()
  const isHomeLoan = productType.includes('home') || productType.includes('housing')
  const isCarLoan = productType.includes('car') || productType.includes('auto') || productType.includes('vehicle')
  const isPersonalLoan = productType.includes('personal') || (!isHomeLoan && !isCarLoan)

  const canProceedStep2 =
    basicInfo.name.trim() !== '' &&
    basicInfo.email.trim() !== '' &&
    basicInfo.mobile.trim().length >= 6

  const handleNext = () => {
    setErrorMessage('')
    if (step === 1) {
      if (!selectedProductId) {
        setErrorMessage('Please select a loan product to proceed.')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (!canProceedStep2) {
        setErrorMessage('Please provide valid Name, Email, and Mobile number.')
        return
      }
      setStep(3)
    } else if (step === 3) {
      if (!financialInfo.monthly_income || !financialInfo.loan_amount_required) {
        setErrorMessage('Please provide your Monthly Income and Loan Amount Required.')
        return
      }
      setStep(4)
    }
  }

  const handleBack = () => {
    setErrorMessage('')
    if (step > 1) setStep(step - 1)
  }

  // Final Form Submission
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
          monthly_obligation: financialInfo.monthly_obligation ? Number(financialInfo.monthly_obligation) : 0,
          existing_emi: financialInfo.existing_emi ? Number(financialInfo.existing_emi) : 0,
          cibil_score: financialInfo.cibil_score ? Number(financialInfo.cibil_score) : null,
          loan_amount_required: financialInfo.loan_amount_required ? Number(financialInfo.loan_amount_required) : null,
          preferred_tenure: financialInfo.preferred_tenure ? Number(financialInfo.preferred_tenure) : null,
        },
        homeLoanDetails: isHomeLoan
          ? {
              property_value: homeLoanDetails.property_value ? Number(homeLoanDetails.property_value) : null,
              property_location: homeLoanDetails.property_location,
              propertyUsageType: homeLoanDetails.propertyUsageType,
              down_payment: homeLoanDetails.down_payment ? Number(homeLoanDetails.down_payment) : null,
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
              down_payment: carLoanDetails.down_payment ? Number(carLoanDetails.down_payment) : null,
              vehicle_age: carLoanDetails.vehicle_age ? Number(carLoanDetails.vehicle_age) : 0,
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
        err?.response?.data?.detail || err.message || 'Failed to submit loan application. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const isUserLoggedInCustomer = !!user && user.role === 'customer'

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:py-14">
      {/* ── Top Header & Wizard Stepper ───────────────────────────────── */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700 border border-blue-200 mb-2">
          <span>⚡ Fast & Easy Process</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Apply for a Loan
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-lg mx-auto">
          Complete the steps below to find the best interest rates and match with top partner banks.
        </p>

        {/* Progress Stepper Bar */}
        <div className="mt-8 grid grid-cols-4 gap-2 md:gap-4 max-w-3xl mx-auto">
          {[
            { num: 1, title: 'Loan Product', icon: '🏷️' },
            { num: 2, title: 'Your Details', icon: '👤' },
            { num: 3, title: 'Financial Profile', icon: '💼' },
            { num: 4, title: 'Loan Details', icon: '📋' },
          ].map((s) => {
            const isCompleted = step > s.num
            const isCurrent = step === s.num
            return (
              <div key={s.num} className="flex flex-col items-center">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold transition shadow-sm ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : s.num}
                </div>
                <span
                  className={`mt-2 text-[11px] md:text-xs font-semibold text-center hidden sm:block ${
                    isCurrent ? 'text-blue-700' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {s.title}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Main Step Card ────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-10 shadow-xl">
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="text-rose-500 font-bold ml-4">
              ×
            </button>
          </div>
        )}

        {/* ── STEP 1: SELECT PRODUCT ──────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Step 1: Choose Loan Product</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select the loan category that best suits your financial requirement
              </p>
            </div>

            {isLoadingProducts ? (
              <div className="py-12 text-center text-slate-400">Loading loan products…</div>
            ) : products.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No active products available.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product: any) => {
                  const isSelected = selectedProductId === product.id
                  return (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProductId(product.id)}
                      className={`cursor-pointer rounded-2xl border p-5 transition relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute right-3 top-3 rounded-full bg-blue-600 text-white text-xs px-2 py-0.5 font-bold shadow-xs">
                          Selected ✓
                        </span>
                      )}

                      <div className="flex items-start gap-4">
                        {product.image ? (
                          <img
                            src={`${API_BASE_URL}/static/product-images/${product.image}`}
                            alt={product.name}
                            className="h-14 w-14 rounded-xl object-cover border border-slate-200 bg-white p-1"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-2xl font-bold text-blue-700">
                            💳
                          </div>
                        )}
                        <div className="flex-1 pr-4">
                          <h3 className="text-base font-bold text-slate-900">{product.name}</h3>
                          <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {product.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                        <span className="text-blue-700">Explore Terms →</span>
                        <span className="text-slate-400">Instant Pre-Approval</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: BASIC APPLICANT INFORMATION ─────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Step 2: Basic Contact Details</h2>
              <p className="text-xs text-slate-500 mt-1">
                Tell us who you are so we can initiate your loan application
              </p>
            </div>

            {isUserLoggedInCustomer && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs font-medium text-blue-800 flex items-center gap-2">
                <span>ℹ️</span> Logged in as a customer — your contact credentials are pre-filled.
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  disabled={isUserLoggedInCustomer && !!basicInfo.name && isNaN(Number(basicInfo.name))}
                  value={basicInfo.name}
                  onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-700 disabled:cursor-not-allowed font-medium"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  disabled={isUserLoggedInCustomer && !!user?.email}
                  value={basicInfo.email}
                  onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })}
                  placeholder="rahul.sharma@example.com"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-700 disabled:cursor-not-allowed font-medium"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  disabled={isUserLoggedInCustomer && (!!user?.mobile || (!!user?.name && !isNaN(Number(user.name))))}
                  value={basicInfo.mobile}
                  onChange={(e) => setBasicInfo({ ...basicInfo, mobile: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-700 disabled:cursor-not-allowed font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: PERSONAL & FINANCIAL PROFILE ────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Step 3: Personal & Financial Profile</h2>
              <p className="text-xs text-slate-500 mt-1">
                Provide your employment and income details to determine eligible borrowing limit
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Age */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Age (Years) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={18}
                  max={75}
                  value={financialInfo.age}
                  onChange={(e) => setFinancialInfo({ ...financialInfo, age: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Gender
                </label>
                <select
                  value={financialInfo.gender}
                  onChange={(e) => setFinancialInfo({ ...financialInfo, gender: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Current City / Location
                </label>
                <input
                  value={financialInfo.location}
                  onChange={(e) => setFinancialInfo({ ...financialInfo, location: e.target.value })}
                  placeholder="e.g. Mumbai, Delhi"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Employment Type */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Employment Type
                </label>
                <select
                  value={financialInfo.employment_type}
                  onChange={(e) =>
                    setFinancialInfo({
                      ...financialInfo,
                      employment_type: e.target.value,
                      isSalaried: e.target.value === 'Salaried',
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Salaried">Salaried (Full-time Employee)</option>
                  <option value="Self-Employed Professional">Self-Employed Professional</option>
                  <option value="Business Owner">Business Owner / Enterprise</option>
                  <option value="Freelancer / Consultant">Freelancer / Consultant</option>
                </select>
              </div>

              {/* Monthly Income */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Net Monthly Income (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 75000"
                  value={financialInfo.monthly_income}
                  onChange={(e) => setFinancialInfo({ ...financialInfo, monthly_income: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Existing EMIs / Obligations */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Existing Monthly EMIs (₹)
                </label>
                <input
                  type="number"
                  placeholder="0 if none"
                  value={financialInfo.existing_emi}
                  onChange={(e) => setFinancialInfo({ ...financialInfo, existing_emi: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Estimated CIBIL Score */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Estimated CIBIL Score
                </label>
                <input
                  type="number"
                  min={300}
                  max={900}
                  placeholder="e.g. 750"
                  value={financialInfo.cibil_score}
                  onChange={(e) => setFinancialInfo({ ...financialInfo, cibil_score: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Loan Amount Required */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Loan Amount Required (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2500000"
                  value={financialInfo.loan_amount_required}
                  onChange={(e) =>
                    setFinancialInfo({ ...financialInfo, loan_amount_required: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Preferred Tenure */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Preferred Tenure (Months)
                </label>
                <select
                  value={financialInfo.preferred_tenure}
                  onChange={(e) =>
                    setFinancialInfo({ ...financialInfo, preferred_tenure: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="12">1 Year (12 Months)</option>
                  <option value="24">2 Years (24 Months)</option>
                  <option value="36">3 Years (36 Months)</option>
                  <option value="60">5 Years (60 Months)</option>
                  <option value="120">10 Years (120 Months)</option>
                  <option value="180">15 Years (180 Months)</option>
                  <option value="240">20 Years (240 Months)</option>
                  <option value="300">25 Years (300 Months)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: PRODUCT-SPECIFIC DETAILS ────────────────────────── */}
        {step === 4 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-800 mb-1">
                {selectedProduct?.name || 'Selected Loan'}
              </div>
              <h2 className="text-xl font-bold text-slate-900">Step 4: Product Specific Details</h2>
              <p className="text-xs text-slate-500 mt-1">
                Provide the specifics required for processing your {selectedProduct?.name} request
              </p>
            </div>

            {/* IF HOME LOAN */}
            {isHomeLoan && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Property Value (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 6000000"
                    value={homeLoanDetails.property_value}
                    onChange={(e) =>
                      setHomeLoanDetails({ ...homeLoanDetails, property_value: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Down Payment (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1500000"
                    value={homeLoanDetails.down_payment}
                    onChange={(e) =>
                      setHomeLoanDetails({ ...homeLoanDetails, down_payment: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Property Location
                  </label>
                  <input
                    placeholder="e.g. Whitefield, Bangalore"
                    value={homeLoanDetails.property_location}
                    onChange={(e) =>
                      setHomeLoanDetails({ ...homeLoanDetails, property_location: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Property Usage Type
                  </label>
                  <select
                    value={homeLoanDetails.propertyUsageType}
                    onChange={(e) =>
                      setHomeLoanDetails({ ...homeLoanDetails, propertyUsageType: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Investment">Investment</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Property Requirement
                  </label>
                  <select
                    value={homeLoanDetails.propertyRequirement}
                    onChange={(e) =>
                      setHomeLoanDetails({ ...homeLoanDetails, propertyRequirement: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="Ready to Move">Ready to Move</option>
                    <option value="Under Construction">Under Construction</option>
                    <option value="Resale Property">Resale Property</option>
                    <option value="Plot Purchase + Construction">Plot + Construction</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Property Type
                  </label>
                  <select
                    value={homeLoanDetails.propertyType}
                    onChange={(e) =>
                      setHomeLoanDetails({ ...homeLoanDetails, propertyType: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="Apartment">Apartment / Flat</option>
                    <option value="Independent Villa">Independent Villa</option>
                    <option value="Row House">Row House</option>
                    <option value="Plot">Residential Plot</option>
                  </select>
                </div>

                {/* Checkboxes & Co-Applicant */}
                <div className="sm:col-span-2 lg:col-span-3 grid sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={homeLoanDetails.femaleCoApplicant}
                      onChange={(e) =>
                        setHomeLoanDetails({
                          ...homeLoanDetails,
                          femaleCoApplicant: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded text-blue-600"
                    />
                    <span>Female Co-Applicant (Special Rate Concession)</span>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={homeLoanDetails.propertyInsurance}
                      onChange={(e) =>
                        setHomeLoanDetails({
                          ...homeLoanDetails,
                          propertyInsurance: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded text-blue-600"
                    />
                    <span>Include Property Insurance</span>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={homeLoanDetails.applicantInsurance}
                      onChange={(e) =>
                        setHomeLoanDetails({
                          ...homeLoanDetails,
                          applicantInsurance: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded text-blue-600"
                    />
                    <span>Include Loan Shield Insurance</span>
                  </label>
                </div>
              </div>
            )}

            {/* IF CAR LOAN */}
            {isCarLoan && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Vehicle Condition
                  </label>
                  <select
                    value={carLoanDetails.new_or_used}
                    onChange={(e) =>
                      setCarLoanDetails({ ...carLoanDetails, new_or_used: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="New">Brand New Vehicle</option>
                    <option value="Used">Pre-Owned / Used Vehicle</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    On-Road Vehicle Value (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1200000"
                    value={carLoanDetails.car_value}
                    onChange={(e) =>
                      setCarLoanDetails({ ...carLoanDetails, car_value: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Down Payment Budget (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 250000"
                    value={carLoanDetails.down_payment}
                    onChange={(e) =>
                      setCarLoanDetails({ ...carLoanDetails, down_payment: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {carLoanDetails.new_or_used === 'Used' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Vehicle Age (Years)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      placeholder="e.g. 3"
                      value={carLoanDetails.vehicle_age}
                      onChange={(e) =>
                        setCarLoanDetails({ ...carLoanDetails, vehicle_age: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                )}
              </div>
            )}

            {/* IF PERSONAL LOAN / OTHER */}
            {isPersonalLoan && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Purpose of Loan
                  </label>
                  <select
                    value={personalLoanDetails.loan_purpose}
                    onChange={(e) =>
                      setPersonalLoanDetails({ ...personalLoanDetails, loan_purpose: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="Home Improvement">Home Improvement / Renovation</option>
                    <option value="Medical Emergency">Medical Emergency</option>
                    <option value="Wedding / Family Event">Wedding / Family Function</option>
                    <option value="Higher Education">Higher Education</option>
                    <option value="Travel & Vacation">Travel & Vacation</option>
                    <option value="Debt Consolidation">Debt Consolidation</option>
                    <option value="Business Expansion">Business Working Capital</option>
                    <option value="Other">Other Purpose</option>
                  </select>
                </div>

                {personalLoanDetails.loan_purpose === 'Other' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Specify Other Purpose
                    </label>
                    <input
                      placeholder="Describe your purpose"
                      value={personalLoanDetails.other}
                      onChange={(e) =>
                        setPersonalLoanDetails({ ...personalLoanDetails, other: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Summary Box */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Application Summary Check
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Applicant</span>
                  <span className="font-bold text-slate-800">{basicInfo.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Product</span>
                  <span className="font-bold text-blue-700">{selectedProduct?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Loan Amount</span>
                  <span className="font-bold text-emerald-700">
                    ₹{Number(financialInfo.loan_amount_required || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tenure</span>
                  <span className="font-bold text-slate-800">
                    {financialInfo.preferred_tenure} Months
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-emerald-600 py-4 text-base font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition disabled:opacity-50 active:scale-[0.99]"
            >
              {isSubmitting ? 'Submitting Application…' : 'Confirm & Submit Loan Application ✓'}
            </button>
          </form>
        )}

        {/* ── Navigation Bottom Bar ───────────────────────────────────── */}
        {step < 4 && (
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition active:scale-95"
            >
              Continue to Step {step + 1} →
            </button>
          </div>
        )}
      </div>

      {/* ── Success Modal ─────────────────────────────────────────────── */}
      {successModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl text-emerald-600 mb-4">
              🎉
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">Application Submitted!</h3>
            <p className="mt-2 text-sm text-slate-600">
              Your application for{' '}
              <span className="font-bold text-blue-700">{selectedProduct?.name}</span> has been received
              successfully under reference{' '}
              <span className="font-mono font-bold text-slate-800">#{successModal.appId}</span>.
            </p>

            <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Applicant:</span>
                <span className="font-semibold text-slate-800">{basicInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mobile:</span>
                <span className="font-semibold text-slate-800">{basicInfo.mobile}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-semibold text-amber-700">Application Received</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `${ROUTES.CUSTOMER_LOGIN}?mobile=${encodeURIComponent(basicInfo.mobile.trim())}`
                  )
                }
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition active:scale-[0.99]"
              >
                Login to view application status →
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default ApplyForLoan
