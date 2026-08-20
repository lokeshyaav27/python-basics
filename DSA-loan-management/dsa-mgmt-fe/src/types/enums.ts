export enum UserRole {
  ADMIN = 'admin',
  AGENT = 'agent',
  CUSTOMER = 'customer',
}

export enum LoanApplicationStatus {
  LEAD_CREATED = 'Lead Created',
  IN_REVIEW = 'In Review',
  DOCS_PENDING = 'Documents Pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ContactEnquiryStatus {
  NEW = 'New',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed',
}

export enum EligibilityStatus {
  ELIGIBLE = 'ELIGIBLE',
  PARTIALLY_ELIGIBLE = 'PARTIALLY_ELIGIBLE',
  NOT_ELIGIBLE = 'NOT_ELIGIBLE',
  INCOMPLETE_DETAILS = 'INCOMPLETE_DETAILS',
  ERROR = 'ERROR',
}

export enum LoanProductType {
  HOME_LOAN = 'Home Loan',
  CAR_LOAN = 'Car Loan',
  PERSONAL_LOAN = 'Personal Loan',
  BUSINESS_LOAN = 'Business Loan',
  LOAN_AGAINST_PROPERTY = 'Loan Against Property',
  OTHER = 'Other',
}

export enum EmploymentType {
  SALARIED = 'Salaried',
  SELF_EMPLOYED_PROFESSIONAL = 'Self Employed Professional',
  SELF_EMPLOYED_BUSINESS = 'Self Employed Business',
  OTHER = 'Other',
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

export enum PropertyUsageType {
  RESIDENTIAL = 'Residential',
  COMMERCIAL = 'Commercial',
}

export enum PropertyRequirement {
  READY_TO_MOVE = 'Ready to Move',
  UNDER_CONSTRUCTION = 'Under Construction',
}

export enum PropertyType {
  APARTMENT = 'Apartment',
  INDEPENDENT_HOUSE = 'Independent House',
  PLOT = 'Plot',
}

export enum PropertyStatus {
  FREEHOLD = 'Freehold',
  LEASEHOLD = 'Leasehold',
}

export enum CarCondition {
  NEW = 'New',
  USED = 'Used',
}
