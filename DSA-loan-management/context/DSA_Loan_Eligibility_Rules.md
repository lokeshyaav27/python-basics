# DSA Loan Eligibility Rules

## Common Eligibility Checks

These checks will apply to Home Loan, Personal Loan and Car Loan:

- Minimum CIBIL score, reject if below 600
- Minimum applicant age, reject if below 18
- Maximum applicant age, reject if above 60
- Minimum income, reject if les then 15 thousand
- Employment/income eligibility
- Existing loans and EMI
- Existing monthly obligations
- Required loan amount
- Preferred tenure
- FOIR calculation
- Product minimum/maximum loan amount

### FOIR

```text
FOIR = (Total Monthly Debt Payments ÷ Gross Monthly Income) × 100

Total Monthly Debt Payments =
Existing EMI + Existing Monthly Obligations + Proposed Loan EMI
```

### FOIR Rules

- If FOIR is 50% or below → normal eligibility
- If FOIR is between 50 to 65% → max loan amount will be reduced based on our configured rules
- If FOIR is above 65% → reject application

Example configured rules:

```text
FOIR Range       Loan Reduction
50–55%           10%
56–60%           20%
61–65%           30%
```

---

# Home Loan

### Tenure

- Maximum tenure will be based on customer's age.
- Private bank → loan should be completed by age 60.
- Public bank / NBFC → loan should be completed by age 65.
- Final tenure will be based on customer age, preferred tenure and product maximum tenure.

### Property / LTV

- Maximum loan can be 70% of property value for our eligibility calculator.
- Property is under construction or read-to-move then upto 80% of property value.
- if property in flat then max loan can be 60% of property value
- LTV formula:

```text
LTV = (Loan Amount ÷ Appraised Property Value) × 100
```

### Interest Rate

- Interest rate can vary based on CIBIL score.
- Interest rate will be configurable.
- Interest rate will be used to calculate proposed EMI.

### Female Co-applicant

- If female co-applicant is available, 0.5% rebate can be applied on interest rate.

### Maximum Eligible Loan Amount

Maximum eligible loan amount will be calculated based on:

- FOIR based eligible amount
- LTV based eligible amount
- Product maximum loan amount

Whichever is lower will be the maximum eligible loan amount.

### Rejection / Reduction

- CIBIL below minimum → reject application
- Age/tenure criteria not satisfied → reject application
- Income eligibility not satisfied → reject application
- FOIR above 65% → reject application
- FOIR between 50 to 65% → reduce maximum eligible loan amount
- LTV criteria not satisfied → reduce maximum eligible loan amount
- Property eligibility criteria not satisfied → reject application

---

# Personal Loan

### Tenure

- Maximum tenure can be 5 years.
- Final tenure will be based on customer's preferred tenure and product maximum tenure.

### Interest Rate

- Interest rate can vary based on CIBIL score and bank policy.
- Interest rate will be configurable.
- Interest rate will be used to calculate proposed EMI.

### Eligibility

We will check:

- CIBIL score
- Minimum income
- Applicant age
- Employment/income eligibility
- Existing loans and EMI
- Existing monthly obligations
- Required loan amount
- Preferred tenure
- FOIR

### Maximum Eligible Loan Amount

Maximum eligible loan amount will be calculated based on:

- FOIR based eligible amount
- Product maximum loan amount

Whichever is lower will be the maximum eligible loan amount.

### Rejection / Reduction

- CIBIL below minimum → reject application
- Age criteria not satisfied → reject application
- Income eligibility not satisfied → reject application
- FOIR above 65% → reject application
- FOIR between 50 to 65% → reduce maximum eligible loan amount
- Product loan amount limit not satisfied → reject or reduce eligible amount

---

# Car Loan

### Tenure

- Maximum tenure can be 5 years.
- Final tenure will be based on customer's preferred tenure and product maximum tenure.

### New Car

- Maximum loan can be 100% of car value for our eligibility calculator.
- Final eligible amount will also depend on FOIR and product maximum loan amount.

### Used Car

- Used car eligibility will depend on vehicle age and configured rules.
- If vehicle age is more than 15 years → reject application.
- For our eligibility calculator, maximum loan can be 50% of car value for an eligible used car.
- Used car valuation should also be considered.

### Interest Rate

- Interest rate can vary based on CIBIL score and bank policy.
- Interest rate will be configurable.
- Interest rate will be used to calculate proposed EMI.

### Eligibility

We will check:

- CIBIL score
- Minimum income
- Applicant age
- Employment/income eligibility
- Existing loans and EMI
- Existing monthly obligations
- Required loan amount
- Preferred tenure
- FOIR
- Vehicle type
- New/used status
- Vehicle age
- Vehicle value

### Maximum Eligible Loan Amount

For a new car:

```text
Maximum Eligible Amount =
MIN(
    FOIR based eligible amount,
    Car Value,
    Product maximum loan amount
)
```

For a used car:

```text
Maximum Eligible Amount =
MIN(
    FOIR based eligible amount,
    50% of Car Value,
    Product maximum loan amount
)
```

### Rejection / Reduction

- CIBIL below minimum → reject application
- Age criteria not satisfied → reject application
- Income eligibility not satisfied → reject application
- FOIR above 65% → reject application
- FOIR between 50 to 65% → reduce maximum eligible loan amount
- Vehicle age more than 15 years → reject application
- Vehicle eligibility/valuation criteria not satisfied → reject or reduce eligible amount

---

# Final Eligibility Flow

```text
Loan Requirement
       ↓
Basic Validation
       ↓
Age Eligibility
       ↓
CIBIL Eligibility
       ↓
Income Eligibility
       ↓
Existing EMI / Obligations
       ↓
Calculate Proposed EMI
       ↓
Calculate FOIR
       ↓
FOIR Check
       ↓
Product Specific Rules
       ↓
LTV / Vehicle Value / Product Limits
       ↓
Calculate Maximum Eligible Amount
       ↓
Final Decision
```

## Final Result

### Eligible

```text
Requested Amount: ₹50,00,000
Eligible Amount: ₹50,00,000
Status: ELIGIBLE
```

### Partially Eligible

```text
Requested Amount: ₹50,00,000
Eligible Amount: ₹42,00,000
Status: PARTIALLY_ELIGIBLE
Reason:
FOIR is between 50 to 65%, so maximum loan amount is reduced.
```

### Not Eligible

```text
Requested Amount: ₹50,00,000
Eligible Amount: ₹0
Status: NOT_ELIGIBLE
Reasons:
- CIBIL below minimum
- FOIR above 65%
```

---

# Architecture

Eligibility calculation will be done using Python business logic. LLM will not calculate the eligibility amount directly.

```text
LLM
 ↓
MCP: Get Customer Information
 ↓
Python Eligibility Logic
 ↓
Eligibility Result
 ↓
LLM
 ↓
Natural Language Explanation
```

Bank comparison will be a separate feature and will use bank-specific interest rates, LTV, tenure and other bank policies.
