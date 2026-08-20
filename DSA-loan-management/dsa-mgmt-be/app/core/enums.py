from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    AGENT = "agent"
    CUSTOMER = "customer"


class LoanApplicationStatus(str, Enum):
    LEAD_CREATED = "Lead Created"
    IN_REVIEW = "In Review"
    DOCS_PENDING = "Documents Pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ContactEnquiryStatus(str, Enum):
    NEW = "New"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    CLOSED = "Closed"


class EligibilityStatus(str, Enum):
    ELIGIBLE = "ELIGIBLE"
    PARTIALLY_ELIGIBLE = "PARTIALLY_ELIGIBLE"
    NOT_ELIGIBLE = "NOT_ELIGIBLE"
    INCOMPLETE_DETAILS = "INCOMPLETE_DETAILS"
    ERROR = "ERROR"


class LoanProductType(str, Enum):
    HOME_LOAN = "Home Loan"
    CAR_LOAN = "Car Loan"
    PERSONAL_LOAN = "Personal Loan"
    BUSINESS_LOAN = "Business Loan"
    LOAN_AGAINST_PROPERTY = "Loan Against Property"
    OTHER = "Other"


class EmploymentType(str, Enum):
    SALARIED = "Salaried"
    SELF_EMPLOYED_PROFESSIONAL = "Self Employed Professional"
    SELF_EMPLOYED_BUSINESS = "Self Employed Business"
    OTHER = "Other"


class Gender(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"


class PropertyUsageType(str, Enum):
    RESIDENTIAL = "Residential"
    COMMERCIAL = "Commercial"


class PropertyRequirement(str, Enum):
    READY_TO_MOVE = "Ready to Move"
    UNDER_CONSTRUCTION = "Under Construction"


class PropertyType(str, Enum):
    APARTMENT = "Apartment"
    INDEPENDENT_HOUSE = "Independent House"
    PLOT = "Plot"


class PropertyStatus(str, Enum):
    FREEHOLD = "Freehold"
    LEASEHOLD = "Leasehold"


class CarCondition(str, Enum):
    NEW = "New"
    USED = "Used"
