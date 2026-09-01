import React from 'react'

export const checkApplicationCompleteness = (app: any): { isComplete: boolean; message: string } => {
  if (!app) return { isComplete: false, message: 'Application details missing' }
  const missing: string[] = []

  const cgd = app.clientGeneralDetails
  if (!cgd) {
    missing.push('Personal Details')
  } else {
    if (!cgd.name && !app.name) missing.push('Applicant Name')
    if (cgd.age == null) missing.push('Age')
    if (!cgd.gender) missing.push('Gender')
    if (!cgd.location) missing.push('Location')
    if (cgd.monthly_income == null && cgd.monthlyIncome == null) missing.push('Monthly Income')
    if (cgd.cibil_score == null && cgd.cibilScore == null) missing.push('CIBIL Score')
  }

  const pName = (app.productName || '').toLowerCase()
  if (pName.includes('home')) {
    const hd = app.homeLoanDetails
    if (!hd) {
      missing.push('Home Loan Details')
    } else {
      if (hd.loan_amount_required == null && hd.loanAmountRequired == null && app.loanAmountRequired == null)
        missing.push('Required Loan Amount')
      if (hd.preferred_tenure == null && hd.preferredTenure == null && app.preferredTenure == null)
        missing.push('Preferred Tenure')
      if (hd.property_value == null && hd.propertyValue == null) missing.push('Property Value')
      if (hd.down_payment == null && hd.downPayment == null) missing.push('Down Payment')
      if (!hd.property_location && !hd.propertyLocation) missing.push('Property Location')
    }
  } else if (pName.includes('car') || pName.includes('vehicle')) {
    const cd = app.carLoanDetails
    if (!cd) {
      missing.push('Car Loan Details')
    } else {
      if (cd.loan_amount_required == null && cd.loanAmountRequired == null && app.loanAmountRequired == null)
        missing.push('Required Loan Amount')
      if (cd.preferred_tenure == null && cd.preferredTenure == null && app.preferredTenure == null)
        missing.push('Preferred Tenure')
      if (cd.car_value == null && cd.carValue == null) missing.push('Car Quotation Value')
      if (cd.down_payment == null && cd.downPayment == null) missing.push('Down Payment')
    }
  } else {
    const pd = app.personalLoanDetails
    if (!pd) {
      missing.push('Personal Loan Details')
    } else {
      if (pd.loan_amount_required == null && pd.required_amount == null && pd.requiredAmount == null && app.loanAmountRequired == null)
        missing.push('Required Loan Amount')
      if (pd.preferred_tenure == null && pd.preferredTenure == null && app.preferredTenure == null)
        missing.push('Preferred Tenure')
      if (!pd.loan_purpose && !pd.loanPurpose) missing.push('Loan Purpose')
    }
  }

  if (missing.length > 0) {
    return {
      isComplete: false,
      message: `Incomplete application: Missing [${missing.slice(0, 3).join(', ')}${
        missing.length > 3 ? '...' : ''
      }]. Please edit and complete all parameters before approving.`,
    }
  }

  return { isComplete: true, message: 'All parameters complete' }
}

export const StatusBadge: React.FC<{ status?: string | null; bankName?: string | null }> = ({
  status,
  bankName,
}) => {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
        <span>⏳</span> Pending Review
      </span>
    )
  }

  const s = status.toLowerCase()
  if (s === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
        <span>✅</span> Forwarded to {bankName || 'Partner Bank'}
      </span>
    )
  }
  if (s === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 border border-red-200">
        <span>❌</span> Rejected
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
      <span>⏳</span> Pending Review
    </span>
  )
}
