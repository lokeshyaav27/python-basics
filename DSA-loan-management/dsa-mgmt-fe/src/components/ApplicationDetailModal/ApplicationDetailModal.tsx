import React, { useState, useEffect } from 'react'
import { message } from 'antd'
import { EditOutlined, CloseOutlined, SaveOutlined } from '@ant-design/icons'
import {
  LoanApplication,
  updateLoanApplication,
  ClientGeneralDetailsData,
  HomeLoanDetailsData,
  CarLoanDetailsData,
  PersonalLoanDetailsData,
} from '../../services/loanApplications'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const StatusBadge: React.FC<{ status?: string | null; bankName?: string | null }> = ({
  status,
  bankName,
}) => {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
        <span>⏳</span> Pending Review
      </span>
    )
  }

  const s = status.toLowerCase()
  if (s === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
        <span>✅</span> Approved {bankName ? `(${bankName})` : ''}
      </span>
    )
  }
  if (s === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">
        <span>❌</span> Rejected
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
      <span>⏳</span> Pending Review
    </span>
  )
}

const CibilBadge: React.FC<{ score?: number | null }> = ({ score }) => {
  if (!score) return <span className="text-slate-400 font-medium">Not provided</span>
  if (score >= 750) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700 border border-emerald-200">
        <span>🟢</span> {score} (Excellent)
      </span>
    )
  }
  if (score >= 680) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-extrabold text-blue-700 border border-blue-200">
        <span>🔵</span> {score} (Good)
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-700 border border-amber-200">
      <span>🟡</span> {score} (Fair / Average)
    </span>
  )
}

const formatCurrency = (val?: number | string | null): string => {
  if (val === null || val === undefined || val === '') return '—'
  const num = Number(val)
  if (isNaN(num)) return '—'
  return `₹ ${num.toLocaleString('en-IN')}`
}

export interface ApplicationDetailModalProps {
  application: LoanApplication | null
  onClose: () => void
  onUpdated?: () => void
  canEdit?: boolean
}

const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  application,
  onClose,
  onUpdated,
  canEdit = true,
}) => {
  if (!application) return null

  const isFinalized = application.status === 'approved' || application.status === 'rejected'
  const allowEditing = canEdit && !isFinalized

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Edit form state
  const [name, setName] = useState(application.name || '')
  const [email, setEmail] = useState(application.email || '')
  const [mobile, setMobile] = useState(application.mobile || '')

  const [generalDetails, setGeneralDetails] = useState<ClientGeneralDetailsData>(
    application.clientGeneralDetails || {}
  )
  const [homeDetails, setHomeDetails] = useState<HomeLoanDetailsData>(
    application.homeLoanDetails || {}
  )
  const [carDetails, setCarDetails] = useState<CarLoanDetailsData>(
    application.carLoanDetails || {}
  )
  const [personalDetails, setPersonalDetails] = useState<PersonalLoanDetailsData>(
    application.personalLoanDetails || {}
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updateLoanApplication(application.id, {
        name,
        email,
        mobile,
        clientGeneralDetails: generalDetails,
        homeLoanDetails: homeDetails,
        carLoanDetails: carDetails,
        personalLoanDetails: personalDetails,
      })
      message.success('Application details updated successfully!')
      setIsEditing(false)
      if (onUpdated) onUpdated()
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to update application details')
    } finally {
      setIsSaving(false)
    }
  }

  const productName = application.productName || 'Loan Application'
  const isHomeLoan =
    productName.toLowerCase().includes('home') || productName.toLowerCase().includes('housing')
  const isCarLoan =
    productName.toLowerCase().includes('car') ||
    productName.toLowerCase().includes('auto') ||
    productName.toLowerCase().includes('vehicle')
  const isPersonalLoan = productName.toLowerCase().includes('personal') || (!isHomeLoan && !isCarLoan)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 my-8 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/90">
          <div className="flex items-center gap-3">
            {application.productImage ? (
              <img
                src={`${API_BASE_URL}/static/product-images/${application.productImage}`}
                alt={productName}
                className="h-11 w-11 rounded-xl object-cover border border-slate-200 bg-white p-1"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white text-lg font-bold">
                💳
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">{productName}</h3>
                <StatusBadge status={application.status} bankName={application.bankName} />
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Application #{application.id} • Customer: {application.name} ({application.mobile})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {allowEditing && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition flex items-center gap-1.5"
              >
                <EditOutlined /> Edit Details
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 text-sm flex items-center justify-center transition"
            >
              <CloseOutlined />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status / Forwarded Partner Banner */}
          {application.status === 'approved' && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
              <div className="flex items-center gap-3">
                {application.bankLogo ? (
                  <img
                    src={`${API_BASE_URL}/static/bank-logo-images/${application.bankLogo}`}
                    alt={application.bankName || 'Bank'}
                    className="h-10 w-10 rounded-xl object-contain bg-white border border-emerald-200 p-1"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    🏦
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">
                    Approved & Forwarded to {application.bankName || 'Partner Bank'}
                  </h4>
                  {application.description ? (
                    <p className="text-xs text-emerald-700 mt-0.5">{application.description}</p>
                  ) : (
                    <p className="text-xs text-emerald-700 mt-0.5">Application forwarded to partner bank for processing.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {application.status === 'rejected' && application.description && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
              <div className="text-xs font-bold text-rose-900 mb-0.5">Decision Remarks:</div>
              <p className="text-xs text-rose-700">{application.description}</p>
            </div>
          )}

          {/* Edit Mode Notice */}
          {isEditing && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>✏️</span>
                <span>
                  <strong>Edit Mode Active:</strong> You can edit customer general details and product requirements below.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs font-bold text-amber-900 underline hover:no-underline"
              >
                Discard Edits
              </button>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* ── Section 1: Basic Customer Info ──────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <span>👤</span> Applicant Contact Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Applicant Name</label>
                  {isEditing ? (
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
                    />
                  ) : (
                    <span className="text-sm font-bold text-slate-800">{name}</span>
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Email Address</label>
                  {isEditing ? (
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
                    />
                  ) : (
                    <span className="text-sm font-medium text-slate-700">{email}</span>
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Mobile Number</label>
                  {isEditing ? (
                    <input
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
                    />
                  ) : (
                    <span className="text-sm font-medium text-slate-700">{mobile}</span>
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Unique Customer ID</label>
                  <span className="text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg block w-fit mt-1">
                    {application.uniqueCustomerId || application.mobile}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Section 2: Client General Details (All 11 Fields) ────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span>📊</span> Personal & Financial Profile (11 Captured Fields)
                </h4>
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Client General Details
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                {/* 1. Age */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">1. Applicant Age</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={generalDetails.age ?? ''}
                      onChange={(e) =>
                        setGeneralDetails({
                          ...generalDetails,
                          age: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                    />
                  ) : (
                    <span className="font-bold text-slate-800">{generalDetails.age ? `${generalDetails.age} Years` : '—'}</span>
                  )}
                </div>

                {/* 2. Gender */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">2. Gender</label>
                  {isEditing ? (
                    <select
                      value={generalDetails.gender ?? ''}
                      onChange={(e) => setGeneralDetails({ ...generalDetails, gender: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <span className="font-bold text-slate-800">{generalDetails.gender || '—'}</span>
                  )}
                </div>

                {/* 3. Location / City */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">3. Location / City</label>
                  {isEditing ? (
                    <input
                      value={generalDetails.location ?? ''}
                      onChange={(e) => setGeneralDetails({ ...generalDetails, location: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                    />
                  ) : (
                    <span className="font-bold text-slate-800">{generalDetails.location || '—'}</span>
                  )}
                </div>

                {/* 4. Employment Type */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">4. Employment Type</label>
                  {isEditing ? (
                    <select
                      value={generalDetails.employment_type ?? 'Salaried'}
                      onChange={(e) =>
                        setGeneralDetails({ ...generalDetails, employment_type: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                    >
                      <option value="Salaried">Salaried</option>
                      <option value="Self-Employed">Self-Employed Professional</option>
                      <option value="Business">Business Owner / Trader</option>
                    </select>
                  ) : (
                    <span className="font-bold text-slate-800">{generalDetails.employment_type || 'Salaried'}</span>
                  )}
                </div>

                {/* 5. Salaried Flag */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">5. Salaried / Self-Employed</label>
                  {isEditing ? (
                    <select
                      value={generalDetails.isSalaried !== false ? 'true' : 'false'}
                      onChange={(e) =>
                        setGeneralDetails({ ...generalDetails, isSalaried: e.target.value === 'true' })
                      }
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                    >
                      <option value="true">Salaried (W-2 / Monthly Payroll)</option>
                      <option value="false">Self-Employed / Business</option>
                    </select>
                  ) : (
                    <span className="font-bold text-slate-800">
                      {generalDetails.isSalaried !== false ? 'Salaried Employee' : 'Self-Employed / Business'}
                    </span>
                  )}
                </div>

                {/* 6. Monthly Net Income */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">6. Monthly Net Income</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={generalDetails.monthly_income ?? ''}
                      onChange={(e) =>
                        setGeneralDetails({
                          ...generalDetails,
                          monthly_income: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                    />
                  ) : (
                    <span className="font-bold text-emerald-700">{formatCurrency(generalDetails.monthly_income)}</span>
                  )}
                </div>

                {/* 7. Monthly Household Obligations */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">7. Monthly Obligations</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={generalDetails.monthly_obligation ?? ''}
                      onChange={(e) =>
                        setGeneralDetails({
                          ...generalDetails,
                          monthly_obligation: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                    />
                  ) : (
                    <span className="font-bold text-slate-800">{formatCurrency(generalDetails.monthly_obligation)}</span>
                  )}
                </div>

                {/* 8. Existing Ongoing EMIs */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">8. Existing EMIs</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={generalDetails.existing_emi ?? ''}
                      onChange={(e) =>
                        setGeneralDetails({
                          ...generalDetails,
                          existing_emi: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                    />
                  ) : (
                    <span className="font-bold text-slate-800">{formatCurrency(generalDetails.existing_emi)}</span>
                  )}
                </div>

                {/* 9. CIBIL Score */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">9. CIBIL Score</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={generalDetails.cibil_score ?? ''}
                      onChange={(e) =>
                        setGeneralDetails({
                          ...generalDetails,
                          cibil_score: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                    />
                  ) : (
                    <CibilBadge score={generalDetails.cibil_score} />
                  )}
                </div>

                {/* 10. Required Loan Amount */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">10. Loan Amount Required</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={generalDetails.loan_amount_required ?? ''}
                      onChange={(e) =>
                        setGeneralDetails({
                          ...generalDetails,
                          loan_amount_required: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                    />
                  ) : (
                    <span className="font-extrabold text-blue-700">{formatCurrency(generalDetails.loan_amount_required)}</span>
                  )}
                </div>

                {/* 11. Preferred Tenure */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">11. Preferred Tenure</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={generalDetails.preferred_tenure ?? ''}
                      onChange={(e) =>
                        setGeneralDetails({
                          ...generalDetails,
                          preferred_tenure: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                    />
                  ) : (
                    <span className="font-bold text-slate-800">
                      {generalDetails.preferred_tenure
                        ? `${generalDetails.preferred_tenure} Months (${(generalDetails.preferred_tenure / 12).toFixed(1)} Yrs)`
                        : '—'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Section 3: Product-Specific Details (Home / Car / Personal) ── */}
            {isHomeLoan && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <span>🏠</span> Home Loan Details (All Captured Fields)
                  </h4>
                  <span className="text-[11px] font-semibold text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded">
                    Property Evaluation
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  {/* 1. Property Value */}
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">1. Property Value</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={homeDetails.property_value ?? ''}
                        onChange={(e) =>
                          setHomeDetails({
                            ...homeDetails,
                            property_value: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">{formatCurrency(homeDetails.property_value)}</span>
                    )}
                  </div>

                  {/* 2. Down Payment */}
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">2. Down Payment</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={homeDetails.down_payment ?? ''}
                        onChange={(e) =>
                          setHomeDetails({
                            ...homeDetails,
                            down_payment: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">{formatCurrency(homeDetails.down_payment)}</span>
                    )}
                  </div>

                  {/* 3. Property Location */}
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">3. Property Location</label>
                    {isEditing ? (
                      <input
                        value={homeDetails.property_location ?? ''}
                        onChange={(e) =>
                          setHomeDetails({ ...homeDetails, property_location: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">{homeDetails.property_location || '—'}</span>
                    )}
                  </div>

                  {/* 4. Property Usage Type */}
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">4. Property Usage</label>
                    {isEditing ? (
                      <select
                        value={homeDetails.propertyUsageType ?? 'Residential'}
                        onChange={(e) =>
                          setHomeDetails({ ...homeDetails, propertyUsageType: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      >
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    ) : (
                      <span className="font-bold text-slate-800">{homeDetails.propertyUsageType || 'Residential'}</span>
                    )}
                  </div>

                  {/* 5. Property Requirement */}
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">5. Property Requirement</label>
                    {isEditing ? (
                      <select
                        value={homeDetails.propertyRequirement ?? 'Ready to Move'}
                        onChange={(e) =>
                          setHomeDetails({ ...homeDetails, propertyRequirement: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      >
                        <option value="Ready to Move">Ready to Move</option>
                        <option value="Under Construction">Under Construction</option>
                        <option value="Resale">Resale Property</option>
                        <option value="Plot + Construction">Plot + Construction</option>
                      </select>
                    ) : (
                      <span className="font-bold text-slate-800">{homeDetails.propertyRequirement || 'Ready to Move'}</span>
                    )}
                  </div>

                  {/* 6. Property Type */}
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">6. Property Type</label>
                    {isEditing ? (
                      <select
                        value={homeDetails.propertyType ?? 'Apartment'}
                        onChange={(e) =>
                          setHomeDetails({ ...homeDetails, propertyType: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      >
                        <option value="Apartment">Apartment / Flat</option>
                        <option value="Independent House / Villa">Independent House / Villa</option>
                        <option value="Commercial Shop / Office">Commercial Shop / Office</option>
                        <option value="Residential Plot">Residential Plot</option>
                      </select>
                    ) : (
                      <span className="font-bold text-slate-800">{homeDetails.propertyType || 'Apartment'}</span>
                    )}
                  </div>

                  {/* 7. Property Ownership / Status */}
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">7. Property Ownership / Title</label>
                    {isEditing ? (
                      <select
                        value={homeDetails.propertyStatus ?? 'Freehold'}
                        onChange={(e) =>
                          setHomeDetails({ ...homeDetails, propertyStatus: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      >
                        <option value="Freehold">Freehold Title</option>
                        <option value="Leasehold">Leasehold Authority</option>
                        <option value="Power of Attorney">Power of Attorney (POA)</option>
                      </select>
                    ) : (
                      <span className="font-bold text-slate-800">{homeDetails.propertyStatus || 'Freehold'}</span>
                    )}
                  </div>

                  {/* 8. Part Property */}
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">8. Part Property</label>
                    {isEditing ? (
                      <select
                        value={homeDetails.isPartProperty ? 'true' : 'false'}
                        onChange={(e) =>
                          setHomeDetails({ ...homeDetails, isPartProperty: e.target.value === 'true' })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      >
                        <option value="false">No (Entire Property)</option>
                        <option value="true">Yes (Sub-divided portion)</option>
                      </select>
                    ) : (
                      <span className="font-bold text-slate-800">
                        {homeDetails.isPartProperty ? 'Yes (Sub-divided)' : 'No (Entire Unit)'}
                      </span>
                    )}
                  </div>

                  {/* 9. Female Co-Applicant */}
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">9. Female Co-Applicant</label>
                    {isEditing ? (
                      <select
                        value={homeDetails.femaleCoApplicant ? 'true' : 'false'}
                        onChange={(e) =>
                          setHomeDetails({ ...homeDetails, femaleCoApplicant: e.target.value === 'true' })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      >
                        <option value="false">No</option>
                        <option value="true">Yes (0.05% Interest Concession)</option>
                      </select>
                    ) : (
                      <span className="font-bold text-slate-800">
                        {homeDetails.femaleCoApplicant ? '✅ Yes (Concession Applied)' : 'No'}
                      </span>
                    )}
                  </div>

                  {/* 10. Property Insurance */}
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">10. Property Insurance</label>
                    {isEditing ? (
                      <select
                        value={homeDetails.propertyInsurance !== false ? 'true' : 'false'}
                        onChange={(e) =>
                          setHomeDetails({ ...homeDetails, propertyInsurance: e.target.value === 'true' })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      >
                        <option value="true">Opted</option>
                        <option value="false">Not Opted</option>
                      </select>
                    ) : (
                      <span className="font-bold text-slate-800">
                        {homeDetails.propertyInsurance !== false ? '✅ Opted' : 'Not Opted'}
                      </span>
                    )}
                  </div>

                  {/* 11. Applicant Insurance */}
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">11. Loan Suraksha Life Cover</label>
                    {isEditing ? (
                      <select
                        value={homeDetails.applicantInsurance !== false ? 'true' : 'false'}
                        onChange={(e) =>
                          setHomeDetails({ ...homeDetails, applicantInsurance: e.target.value === 'true' })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      >
                        <option value="true">Opted</option>
                        <option value="false">Not Opted</option>
                      </select>
                    ) : (
                      <span className="font-bold text-slate-800">
                        {homeDetails.applicantInsurance !== false ? '✅ Opted' : 'Not Opted'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isCarLoan && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <span>🚗</span> Car Loan Details (All Captured Fields)
                  </h4>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded">
                    Vehicle Details
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  {/* 1. Vehicle Type */}
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">1. Vehicle Condition</label>
                    {isEditing ? (
                      <select
                        value={carDetails.new_or_used ?? 'New'}
                        onChange={(e) => setCarDetails({ ...carDetails, new_or_used: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      >
                        <option value="New">Brand New Car</option>
                        <option value="Used">Pre-Owned / Used Car</option>
                      </select>
                    ) : (
                      <span className="font-bold text-slate-800">{carDetails.new_or_used || 'New'}</span>
                    )}
                  </div>

                  {/* 2. Car Value */}
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">2. Vehicle Value / Quotation</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={carDetails.car_value ?? ''}
                        onChange={(e) =>
                          setCarDetails({
                            ...carDetails,
                            car_value: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">{formatCurrency(carDetails.car_value)}</span>
                    )}
                  </div>

                  {/* 3. Down Payment */}
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">3. Down Payment</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={carDetails.down_payment ?? ''}
                        onChange={(e) =>
                          setCarDetails({
                            ...carDetails,
                            down_payment: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">{formatCurrency(carDetails.down_payment)}</span>
                    )}
                  </div>

                  {/* 4. Vehicle Age */}
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">4. Vehicle Age</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={carDetails.vehicle_age ?? 0}
                        onChange={(e) =>
                          setCarDetails({ ...carDetails, vehicle_age: Number(e.target.value) })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">
                        {carDetails.vehicle_age ? `${carDetails.vehicle_age} Years` : '0 (Brand New)'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isPersonalLoan && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <span>💼</span> Personal Loan Details (All Captured Fields)
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded">
                    Unsecured Credit
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  {/* 1. Loan Purpose */}
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">1. Loan Purpose</label>
                    {isEditing ? (
                      <select
                        value={personalDetails.loan_purpose ?? 'Home Improvement'}
                        onChange={(e) =>
                          setPersonalDetails({ ...personalDetails, loan_purpose: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      >
                        <option value="Home Improvement">Home Renovation</option>
                        <option value="Medical Emergency">Medical Emergency</option>
                        <option value="Wedding / Family Event">Wedding / Family Event</option>
                        <option value="Higher Education">Higher Education</option>
                        <option value="Debt Consolidation">Debt Consolidation</option>
                        <option value="Travel / Vacation">Travel / Vacation</option>
                        <option value="Business Expansion">Business Expansion</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <span className="font-bold text-slate-800">{personalDetails.loan_purpose || '—'}</span>
                    )}
                  </div>

                  {/* 2. Other Details / Remarks */}
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">2. Purpose Description / Remarks</label>
                    {isEditing ? (
                      <input
                        value={personalDetails.other ?? ''}
                        onChange={(e) =>
                          setPersonalDetails({ ...personalDetails, other: e.target.value })
                        }
                        placeholder="Additional remarks"
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">{personalDetails.other || '—'}</span>
                    )}
                  </div>

                  {/* 3. Required Amount */}
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">3. Required Amount</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={personalDetails.required_amount ?? ''}
                        onChange={(e) =>
                          setPersonalDetails({
                            ...personalDetails,
                            required_amount: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      />
                    ) : (
                      <span className="font-extrabold text-emerald-700">
                        {formatCurrency(personalDetails.required_amount)}
                      </span>
                    )}
                  </div>

                  {/* 4. Existing Obligations */}
                  <div>
                    <label className="text-slate-500 block mb-1 font-medium">4. Existing Obligations / EMIs</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={personalDetails.existing_obligations ?? ''}
                        onChange={(e) =>
                          setPersonalDetails({
                            ...personalDetails,
                            existing_obligations: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">
                        {formatCurrency(personalDetails.existing_obligations)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Section 4: Assigned Loan Advisor (Read-only) ─────────────── */}
            {application.agentName && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {application.agentPhoto ? (
                    <img
                      src={`${API_BASE_URL}/static/agent-photos/${application.agentPhoto}`}
                      alt={application.agentName}
                      className="h-10 w-10 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      {application.agentName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <span className="text-[11px] text-slate-400 block">Assigned DSA Loan Advisor</span>
                    <span className="text-xs font-bold text-slate-800">{application.agentName}</span>
                    <span className="text-[11px] text-slate-500 block">{application.agentEmail}</span>
                  </div>
                </div>
                {application.agentMobile && (
                  <a
                    href={`tel:${application.agentMobile}`}
                    className="rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-blue-600 border border-slate-200 hover:bg-blue-50 transition shadow-2xs"
                  >
                    📞 Call {application.agentMobile}
                  </a>
                )}
              </div>
            )}

            {/* Save Buttons when Editing */}
            {isEditing && (
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  <SaveOutlined /> {isSaving ? 'Saving Changes…' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        {!isEditing && (
          <div className="flex justify-end border-t border-slate-100 px-6 py-4 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ApplicationDetailModal
