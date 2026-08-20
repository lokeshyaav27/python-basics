import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchProducts } from '../../services/products'
import { useAuth } from '../../auth/AuthProvider'
import { useApplyLoanForm } from './hooks/useApplyLoanForm'
import {
  StepIndicator,
  Step1SelectProduct,
  Step2ApplicantDetails,
  Step3FinancialDetails,
  Step4ProductSpecificDetails,
  ApplicationSuccessModal,
} from './components'

const ApplyForLoan: React.FC = () => {
  const { user } = useAuth()

  // Fetch available products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-list'],
    queryFn: fetchProducts,
  })

  const {
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
  } = useApplyLoanForm(products, user)

  const isUserLoggedInCustomer = !!user && user.role === 'customer'

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:py-14">
      {/* Top Header & Wizard Stepper */}
      <StepIndicator currentStep={step} />

      {/* Main Step Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-10 shadow-xl">
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="text-rose-500 font-bold ml-4">
              ×
            </button>
          </div>
        )}

        {/* STEP 1: SELECT PRODUCT */}
        {step === 1 && (
          <Step1SelectProduct
            products={products}
            isLoadingProducts={isLoadingProducts}
            selectedProductId={selectedProductId}
            setSelectedProductId={setSelectedProductId}
            onNext={handleStep1Next}
          />
        )}

        {/* STEP 2: BASIC CONTACT DETAILS */}
        {step === 2 && (
          <Step2ApplicantDetails
            basicInfo={basicInfo}
            setBasicInfo={setBasicInfo}
            isUserLoggedInCustomer={isUserLoggedInCustomer}
            onNext={handleStep2Next}
            onPrev={() => setStep(1)}
          />
        )}

        {/* STEP 3: FINANCIAL PROFILE */}
        {step === 3 && (
          <Step3FinancialDetails
            financialInfo={financialInfo}
            setFinancialInfo={setFinancialInfo}
            onNext={handleStep3Next}
            onPrev={() => setStep(2)}
          />
        )}

        {/* STEP 4: PRODUCT SPECIFIC DETAILS */}
        {step === 4 && (
          <Step4ProductSpecificDetails
            isHomeLoan={isHomeLoan}
            isCarLoan={isCarLoan}
            isPersonalLoan={isPersonalLoan}
            homeLoanDetails={homeLoanDetails}
            setHomeLoanDetails={setHomeLoanDetails}
            carLoanDetails={carLoanDetails}
            setCarLoanDetails={setCarLoanDetails}
            personalLoanDetails={personalLoanDetails}
            setPersonalLoanDetails={setPersonalLoanDetails}
            isSubmitting={isSubmitting}
            onPrev={() => setStep(3)}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      {/* Success Modal Confirmation */}
      {successModal?.open && (
        <ApplicationSuccessModal
          applicationId={successModal.applicationId}
          isUserLoggedInCustomer={isUserLoggedInCustomer}
        />
      )}
    </main>
  )
}

export default ApplyForLoan
