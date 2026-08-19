import React from 'react'
import { SaveOutlined } from '@ant-design/icons'
import { LoanApplication } from '../../services/loanApplications'
import { useApplicationDetailModal } from './hooks/useApplicationDetailModal'
import {
  ApplicantContactInfo,
  GeneralDetailsTab,
  HomeLoanDetailsTab,
  CarLoanDetailsTab,
  PersonalLoanDetailsTab,
  AssignedAdvisorCard,
  ModalHeader,
  ModalStatusBanner,
} from './components'

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

  const {
    isEditing,
    setIsEditing,
    isSaving,
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
  } = useApplicationDetailModal(application, onUpdated)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 my-8 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <ModalHeader
          application={application}
          productName={productName}
          allowEditing={allowEditing}
          isEditing={isEditing}
          onStartEdit={() => setIsEditing(true)}
          onClose={onClose}
        />

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <ModalStatusBanner
            application={application}
            isEditing={isEditing}
            onDiscardEdits={() => setIsEditing(false)}
          />

          <form onSubmit={handleSave} className="space-y-6">
            <ApplicantContactInfo
              application={application}
              isEditing={isEditing}
              name={name}
              email={email}
              mobile={mobile}
              setName={setName}
              setEmail={setEmail}
              setMobile={setMobile}
            />

            <GeneralDetailsTab
              generalDetails={generalDetails}
              setGeneralDetails={setGeneralDetails}
              isEditing={isEditing}
            />

            {isHomeLoan && (
              <HomeLoanDetailsTab
                homeDetails={homeDetails}
                setHomeDetails={setHomeDetails}
                isEditing={isEditing}
              />
            )}

            {isCarLoan && (
              <CarLoanDetailsTab
                carDetails={carDetails}
                setCarDetails={setCarDetails}
                isEditing={isEditing}
              />
            )}

            {isPersonalLoan && (
              <PersonalLoanDetailsTab
                personalDetails={personalDetails}
                setPersonalDetails={setPersonalDetails}
                isEditing={isEditing}
              />
            )}

            <AssignedAdvisorCard application={application} />

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
