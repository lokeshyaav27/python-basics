import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchCustomerLoanApplications, LoanApplication } from '../../services/loanApplications'
import { useAuth } from '../../auth/AuthProvider'
import ApplicationDetailModal from '../../components/ApplicationDetailModal'
import { ROUTES } from '../../constants'
import {
  CustomerHeaderBanner,
  CustomerLoanCard,
} from './components'

const CustomerLoanList: React.FC = () => {
  const { user } = useAuth()
  const customerIdentifier = user?.mobile || user?.email || user?.name || ''

  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Fetch loans specific to this customer
  const { data: loans = [], isLoading, refetch } = useQuery<LoanApplication[]>({
    queryKey: ['customer-loans', customerIdentifier],
    queryFn: () => fetchCustomerLoanApplications(customerIdentifier),
  })

  const totalCount = loans.length
  const approvedCount = loans.filter((l) => (l.status || '').toLowerCase() === 'approved').length
  const inReviewCount = loans.filter(
    (l) =>
      !l.status ||
      ((l.status || '').toLowerCase() !== 'approved' &&
        (l.status || '').toLowerCase() !== 'rejected')
  ).length
  const rejectedCount = loans.filter((l) => (l.status || '').toLowerCase() === 'rejected').length

  const openDetails = (loan: LoanApplication) => {
    setSelectedLoan(loan)
    setShowDetailModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <CustomerHeaderBanner
        customerIdentifier={customerIdentifier}
        totalCount={totalCount}
        inReviewCount={inReviewCount}
        approvedCount={approvedCount}
        rejectedCount={rejectedCount}
      />

      {/* Applications Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          All Submitted Applications ({loans.length})
        </h2>

        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
            Loading your loan applications…
          </div>
        ) : loans.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
              📂
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">No active applications yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                You haven't submitted any loan inquiries yet. Fill out our multi-step application to find the best bank interest rates.
              </p>
            </div>
            <Link
              to={ROUTES.APPLY_FOR_LOAN}
              className="inline-block rounded-2xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition"
            >
              Start New Loan Application →
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loans.map((loan) => (
              <CustomerLoanCard key={loan.id} loan={loan} onOpenDetails={openDetails} />
            ))}
          </div>
        )}
      </div>

      {/* Modal Detail View */}
      {showDetailModal && selectedLoan && (
        <ApplicationDetailModal
          application={selectedLoan}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedLoan(null)
          }}
          onUpdated={() => refetch()}
          canEdit={true}
        />
      )}
    </div>
  )
}

export default CustomerLoanList
