# DSA Loan Platform — Database Schema

## 1. Product Table

**Table:** `Product`

| Field | Notes |
|---|---|
| name | Required |
| description | Required |
| image | Optional / nullable |

Examples:
- Home Loan
- Car Loan
- Personal Loan

## 2. Bank Table

**Table:** `Bank`

| Field | Notes |
|---|---|
| name | Required |
| isNationalize | Required |
| isPrivate | Required |
| isnbfc | Required |
| logo | Optional / nullable |

## 3. Agent Table

**Table:** `Agent`

| Field | Notes |
|---|---|
| name | Required |
| email | Required |
| mobile | Required |
| tempPassword | Optional / nullable |
| tempPasswordReset | Boolean |
| isAdmin | Required |

## 4. Product-Bank-Link Table

**Table:** `ProductBankLink`

Links a Product with a Bank.

| Field |
|---|
| bankid |
| productid |
| commission |

## 5. Bank Document Table

**Table:** `BankDocument`

| Field |
|---|
| productBankLinkId |
| nameOfDocuments |
| documentLocation |

### Bank documents
- Policy
- Interest Rate
- Property Guidelines
- Eligibility Guidelines

## 6. Customer Table

**Table:** `Customer`

| Field | Notes |
|---|---|
| email | Required |
| name | Required |
| mobile | Required |
| agentId | Optional / nullable |
| LoanId | Optional / nullable |
| status | Required |

### Customer Status

- `not-started`
- `inprogress`
- `rejected`
- `forwardedToBank`

## 7. Loan Table

**Table:** `LoanTable`

| Field |
|---|
| CustomerId |
| ClientGeneralDetailTableId |
| HomeLoanDetailId |
| CarLoanDetailId |
| personalLoanDetailId |

The relevant loan-detail table is used based on the selected Product.

## 8. Client General Detail Table

**Table:** `ClientGeneralDetailTable`

| Field |
|---|
| Name / age |
| gender |
| Location |
| Employment type |
| Monthly income |
| monthly obligation |
| Existing EMI |
| CIBIL score |
| Loan amount required |
| Preferred tenure |
| isSalaried |

## 9. Home Loan Client Detail Table

**Table:** `HomeLoanClientDetailTable`

| Field |
|---|
| Property value |
| Property location |
| PropertyUsageType |
| Down payment |
| isPartProperty |
| Property Requirement |
| Property Type |
| Property Status |
| femaleCoApplicant |
| propertyInsurance |
| applicantInsurance |

### Property Usage Type

**Field:** `PropertyUsageType`

- commercial
- semi-commercial
- residential

### Property Requirement

- Purchase
- Construction
- Plot + Construction
- Renovation
- Balance Transfer

### Property Type

- Apartment
- Independent House
- Villa
- Plot

### Property Status

- Ready to Move
- Under Construction
- Resale
- Self Construction

## 10. Car Loan Client Detail Table

**Table:** `CarLoanClientDetailTable`

| Field | Notes |
|---|---|
| New/used | Required |
| Car value | Required |
| Down payment | Required |
| Vehicle Age — if used | Optional / nullable |

## 11. Personal Loan Client Detail Table

**Table:** `PersonalLoanClientDetailTable`

| Field |
|---|
| Loan purpose |
| Other |
| Required amount |
| Existing obligations |

### Loan Purpose

- Medical
- Education
- Marriage
- Travel
- Home Renovation
- Debt Consolidation
- Business
- Other

## 12. Main Relationships

```text
Product
   │
   └── ProductBankLink
          │
          ├── Bank
          │
          └── BankDocument


Agent
   │
   └── Customer
          │
          └── LoanTable
                 │
                 ├── ClientGeneralDetailTable
                 ├── HomeLoanDetailTable
                 ├── CarLoanDetailTable
                 └── PersonalLoanDetailTable
```

## 13. AI Phase Data Usage

### RAG

`BankDocument` will provide bank knowledge such as:
- Policy
- Interest Rate
- Property Guidelines
- Eligibility Guidelines

### MCP

MCP can later expose:
- Customer
- Loan
- Product
- Bank
- Bank documents
- Agent

### AI

The AI layer can later use customer loan details, bank information and RAG knowledge for:
- Loan comparison
- Eligibility assistance
- Recommendations
- Agent/customer chat
