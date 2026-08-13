# DSA Loan Platform — Project Overview

## 1. Project Overview

A FinTech platform for a DSA (Direct Selling Agent) business where agents can manage customers and customers can independently submit loan requirements and explore loan products from different banks.

The first phase will focus on the complete non-AI business application. A second phase will add **RAG, MCP and AI** capabilities.

## 2. Roles

- **Admin**
- **Agent**
- **Customer**

## 3. Pages / Screens

### Auth Pages
- **Login Page**
  - Agent and Admin use the same login page.
  - If the logged-in user is an Admin, show a popup to select **Admin** or **Agent** role.
  - If the logged-in user is an Agent and is logging in for the first time, show a **Reset Password** popup.
  - After password reset, the Agent will be logged out.

### Admin Pages
- Add / Edit / Delete / List Product
  - Examples: Home Loan, Car Loan, Personal Loan
- Add / Edit / Delete / List Bank
  - Add bank documents for loans
  - Configure DSA commission as per bank
- Add / Edit / Delete / List Agents
  - Reset / Set password for Agent
- Add / Edit / Delete / List Customer

### Agent Pages
- **Apply for a Loan on Behalf of Customer**
  - Customer will be created.
  - Fields: Email, Mobile, Name
- **Customer List**
- **Customer Detail**
  - Opened when an Agent clicks a customer.

### Public Pages
#### Home Page
- DSA details
- Apply Loan button

#### Apply Loan Page
- Email
- Mobile
- Name
- OTP

Once OTP is successfully entered:

```text
Public Apply Loan
       ↓
Lead Created
       ↓
Customer Portal
       ↓
Multi-step Loan Requirement Form
```

The customer will then submit `loan-requirement-details` through a multi-step form.

### Customer Login
- Login using mobile number and static OTP

### Customer Pages
- Apply Loan
  - `loan-requirement-details` through a multi-step form
- List of Loans
- Loan Details
  - Opened when the customer clicks a loan

### Second Phase — RAG, MCP and AI
#### Agent
- Chat with AI
- Loan Comparison
- Check Eligibility

#### Customer
- Loan Comparison
- Check Eligibility

## 4. High-Level Flow

### Customer Flow

```text
Public Home
    ↓
Apply Loan
    ↓
Email + Mobile + Name + OTP
    ↓
Lead Created
    ↓
Customer Portal
    ↓
Loan Requirement Multi-step Form
    ↓
Loan Created
    ↓
Customer Loan List
    ↓
Loan Details
```

### Agent Flow

```text
Agent Login
    ↓
Customer List
    ↓
Customer Details
    ↓
Apply Loan on Behalf of Customer
    ↓
Customer Created
    ↓
Loan Requirement
    ↓
Loan Created
```

### Admin Flow

```text
Admin Login
    ↓
Select Admin / Agent Role
    ↓
Admin Dashboard
    ↓
Manage Products
Manage Banks
Manage Bank Documents
Manage Agents
Manage Customers
```

## 5. AI Phase Flow

```text
Customer / Agent
       ↓
Loan / Customer Information
       ↓
Eligibility + Loan Comparison
       ↓
RAG → Bank Policy / Loan Documents
       ↓
MCP → Application / Customer / Bank Data
       ↓
AI / LLM
       ↓
Recommendation / Explanation
```

The deterministic application and database remain the foundation. AI is added as a second phase on top of the existing application.



## 7. Finalized Field Notes

- Product image is optional / nullable.
- Bank logo is optional / nullable.
- Agent `tempPassword` can be null.
- Agent `tempPasswordReset` is boolean.
- Customer `agentId` can be null.
- Customer `LoanId` can be null.
- Customer status values:
  - `not-started`
  - `inprogress`
  - `rejected`
  - `forwardedToBank`
- Car loan `Vehicle Age` is nullable.
- Home loan uses `PropertyUsageType` for:
  - commercial
  - semi-commercial
  - residential
