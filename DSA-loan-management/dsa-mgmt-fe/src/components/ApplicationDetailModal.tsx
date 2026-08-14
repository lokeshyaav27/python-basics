import React, { useState, useEffect } from 'react'
import { message } from 'antd'
import {
  LoanApplication,
  updateLoanApplication,
  ClientGeneralDetailsData,
  HomeLoanDetailsData,
  CarLoanDetailsData,
  PersonalLoanDetailsData,
} from '../services/loanApplications'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function StatusBadge({ status, bankName }: { status?: string | null; bankName?: string | null }) {
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

interface ApplicationDetailModalProps {
  application: LoanApplication | null
  onClose: () => void
  onUpdated?: () => void
  canEdit?: boolean
}

export default function ApplicationDetailModal({
  application,
  onClose,
  onUpdated,
  canEdit = true,
}: ApplicationDetailModalProps) {
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
  const isHomeLoan = productName.toLowerCase().includes('home')
  const isCarLoan = productName.toLowerCase().includes('car')
  const isPersonalLoan = productName.toLowerCase().includes('personal')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/80">
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
                <h3 className="text-lg font-bold text-slate-800">{productName} Details</h3>
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
                className="rounded-xl bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 border border-blue-200 hover:bg-blue-100 transition flex items-center gap-1"
              >
                <span>✏️</span> Edit Details
              </button>
            )}

            {isFinalized && (
              <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 flex items-center gap-1">
                <span>🔒</span> Decision Finalized (Read-only)
              </span>
            )}

            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 text-xl leading-none transition"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status / Sanction Banner */}
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
                    Sanctioned by {application.bankName || 'Partner Bank'}
                  </h4>
                  {application.description ? (
                    <p className="text-xs text-emerald-700 mt-0.5">{application.description}</p>
                  ) : (
                    <p className="text-xs text-emerald-700 mt-0.5">Loan approved with priority processing.</p>
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
                  <strong>Edit Mode Active:</strong> Modify the information below and click Save Changes when finished.
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
            {/* 1. Contact Info Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <span>👤</span> Applicant Contact Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Full Name</label>
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
              </div>
            </div>

            {/* 2. Client General & Financial Details */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <span>📊</span> Personal & Financial Profile (Client General Details)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Age</label>
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
                    <span className="font-bold text-slate-800">{generalDetails.age ?? '—'} Yrs</span>
                  )}
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Gender</label>
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
                    <span className="font-bold text-slate-800">{generalDetails.gender ?? '—'}</span>
                  )}
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Location / City</label>
                  {isEditing ? (
                    <input
                      value={generalDetails.location ?? ''}
                      onChange={(e) => setGeneralDetails({ ...generalDetails, location: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                    />
                  ) : (
                    <span className="font-bold text-slate-800">{generalDetails.location ?? '—'}</span>
                  )}
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Employment</label>
                  {isEditing ? (
                    <select
                      value={generalDetails.employment_type ?? ''}
                      onChange={(e) =>
                        setGeneralDetails({ ...generalDetails, employment_type: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                    >
                      <option value="Salaried">Salaried</option>
                      <option value="Self-Employed">Self-Employed</option>
                      <option value="Business">Business Owner</option>
                    </select>
                  ) : (
                    <span className="font-bold text-slate-800">{generalDetails.employment_type ?? 'Salaried'}</span>
                  )}
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Monthly Income</label>
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
                    <span className="font-bold text-emerald-700">
                      {generalDetails.monthly_income
                        ? `₹ ${Number(generalDetails.monthly_income).toLocaleString('en-IN')}`
                        : '—'}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Monthly Obligations</label>
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
                    <span className="font-bold text-slate-800">
                      {generalDetails.monthly_obligation
                        ? `₹ ${Number(generalDetails.monthly_obligation).toLocaleString('en-IN')}`
                        : '—'}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">CIBIL Score</label>
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
                    <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {generalDetails.cibil_score ?? '—'}
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Loan Required</label>
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
                    <span className="font-bold text-blue-700">
                      {generalDetails.loan_amount_required
                        ? `₹ ${Number(generalDetails.loan_amount_required).toLocaleString('en-IN')}`
                        : '—'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Product-Specific Loan Details */}
            {isHomeLoan && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <span>🏠</span> Home Loan Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Property Value</label>
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
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">
                        {homeDetails.property_value
                          ? `₹ ${Number(homeDetails.property_value).toLocaleString('en-IN')}`
                          : '—'}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Down Payment</label>
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
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">
                        {homeDetails.down_payment
                          ? `₹ ${Number(homeDetails.down_payment).toLocaleString('en-IN')}`
                          : '—'}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Property Location</label>
                    {isEditing ? (
                      <input
                        value={homeDetails.property_location ?? ''}
                        onChange={(e) =>
                          setHomeDetails({ ...homeDetails, property_location: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">{homeDetails.property_location ?? '—'}</span>
                    )}
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Usage Type</label>
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
                      <span className="font-bold text-slate-800">{homeDetails.propertyUsageType ?? 'Residential'}</span>
                    )}
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Female Co-Applicant</label>
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={!!homeDetails.femaleCoApplicant}
                        onChange={(e) =>
                          setHomeDetails({ ...homeDetails, femaleCoApplicant: e.target.checked })
                        }
                        className="h-4 w-4 rounded text-blue-600 mt-1"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">
                        {homeDetails.femaleCoApplicant ? 'Yes (Discount Eligible)' : 'No'}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Property Insurance</label>
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={homeDetails.propertyInsurance !== false}
                        onChange={(e) =>
                          setHomeDetails({ ...homeDetails, propertyInsurance: e.target.checked })
                        }
                        className="h-4 w-4 rounded text-blue-600 mt-1"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">
                        {homeDetails.propertyInsurance !== false ? 'Opted' : 'Not Opted'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isCarLoan && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <span>🚗</span> Car Loan Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Vehicle Type</label>
                    {isEditing ? (
                      <select
                        value={carDetails.new_or_used ?? 'New'}
                        onChange={(e) => setCarDetails({ ...carDetails, new_or_used: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      >
                        <option value="New">Brand New Car</option>
                        <option value="Used">Pre-Owned / Used</option>
                      </select>
                    ) : (
                      <span className="font-bold text-slate-800">{carDetails.new_or_used ?? 'New'}</span>
                    )}
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Car Value</label>
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
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">
                        {carDetails.car_value
                          ? `₹ ${Number(carDetails.car_value).toLocaleString('en-IN')}`
                          : '—'}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Down Payment</label>
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
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">
                        {carDetails.down_payment
                          ? `₹ ${Number(carDetails.down_payment).toLocaleString('en-IN')}`
                          : '—'}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Vehicle Age (Yrs)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={carDetails.vehicle_age ?? 0}
                        onChange={(e) =>
                          setCarDetails({ ...carDetails, vehicle_age: Number(e.target.value) })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">{carDetails.vehicle_age ?? 0} Yrs</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isPersonalLoan && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <span>💼</span> Personal Loan Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Loan Purpose</label>
                    {isEditing ? (
                      <input
                        value={personalDetails.loan_purpose ?? ''}
                        onChange={(e) =>
                          setPersonalDetails({ ...personalDetails, loan_purpose: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">{personalDetails.loan_purpose ?? '—'}</span>
                    )}
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Required Amount</label>
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
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">
                        {personalDetails.required_amount
                          ? `₹ ${Number(personalDetails.required_amount).toLocaleString('en-IN')}`
                          : '—'}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Existing Obligations</label>
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
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    ) : (
                      <span className="font-bold text-slate-800">
                        {personalDetails.existing_obligations
                          ? `₹ ${Number(personalDetails.existing_obligations).toLocaleString('en-IN')}`
                          : '—'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. Assigned Advisor Info (Read-only) */}
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
                    <span className="text-[11px] text-slate-400 block">Assigned DSA Advisor</span>
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
                  className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {isSaving ? 'Saving Changes…' : '💾 Save Changes'}
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
