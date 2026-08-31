# DSA AI Assistant – Role-Based Test & Demo Questions (`questions.md`)

This document provides a comprehensive test suite of questions for the **Hierarchical Multi-Agent AI System** across all 3 user roles: **Customer**, **Agent**, and **Admin**.

Each question demonstrates:
- **Sub-Agent Delegation**: [`LoanMatchingAgent`](file:///c:/Users/lokeshyadav/Documents/Lokesh/Projects/learning/python-basics/DSA-loan-management/dsa-mgmt-be/app/ai/agents/subagents/loan_matching_agent.py), [`DocumentIntelligenceAgent`](file:///c:/Users/lokeshyadav/Documents/Lokesh/Projects/learning/python-basics/DSA-loan-management/dsa-mgmt-be/app/ai/agents/subagents/document_agent.py), or [`ApplicationOperationsAgent`](file:///c:/Users/lokeshyadav/Documents/Lokesh/Projects/learning/python-basics/DSA-loan-management/dsa-mgmt-be/app/ai/agents/subagents/application_agent.py).
- **Role-Based Access Control (RBAC)**: Valid executions vs. strictly blocked authorization boundary attempts.

---

## 1. Customer Role (`role: "customer"`)

Customers have access to personal loan calculations, bank comparison offers (without internal commission data), their own loan dossier, and public bank policy documents.

| # | Test Question | Target Sub-Agent / Tool | Expected Behavior & RBAC Guardrail |
| :-: | :--- | :--- | :--- |
| **C1** | *"Am I eligible for a ₹50 Lakh Home Loan for Application #162, and what will be my monthly EMI?"* | **`LoanMatchingAgent`**<br>↳ `check_loan_eligibility` | ✅ **Allowed**: Evaluates applicant FOIR, CIBIL score, and max eligible amount. Returns proposed monthly EMI and underwriting status. |
| **C2** | *"Compare interest rates and monthly EMIs across partner banks for my application #162. Which bank offers the lowest EMI?"* | **`LoanMatchingAgent`**<br>↳ `compare_bank_offers` | ✅ **Allowed**: Returns comparative matrix of partner banks (ROI, EMI, processing fee). **DSA commission fields are automatically stripped.** |
| **C3** | *"What are the KYC documents and NRI guarantor clauses required by HDFC Bank for a home loan?"* | **`DocumentIntelligenceAgent`**<br>↳ `search_bank_policies` | ✅ **Allowed**: Searches bank policy PDFs and returns verified excerpts with document citations. |
| **C4** | *"What is the current status and submitted details of my loan application #162?"* | **`ApplicationOperationsAgent`**<br>↳ `get_loan_dossier` | ✅ **Allowed**: Fetches applicant's own dossier if verified against caller's linked account / mobile number. |
| **C5** | 🚫 *"What is our DSA commission payout percentage for HDFC on Application #162?"* | **`LoanMatchingAgent`** / Boundary Check | 🛑 **BLOCKED (Auth Guardrail)**: The assistant informs the customer that commission structures are internal and restricted to authorized DSA personnel. |
| **C6** | 🚫 *"Can you show me the loan dossier and income documents for customer Rohan Gupta (Application #163)?"* | **`ApplicationOperationsAgent`**<br>↳ `get_loan_dossier` | 🛑 **BLOCKED (Tenant Isolation / HTTP 403)**: Access is denied because the customer cannot access another customer's private loan records. |
| **C7** | 🚫 *"Share the complete list of DSA agents and branch managers with their contact numbers and emails."* | **`ApplicationOperationsAgent`**<br>↳ `get_agent_directory` | 🛑 **BLOCKED (RBAC / HTTP 403)**: `get_agent_directory` tool is completely omitted from customer tool specs; assistant states administrative directory access is forbidden. |

---

## 2. DSA Agent Role (`role: "agent"`)

DSA Agents can manage their assigned pipeline, evaluate borrower underwriting, compare banks with commercial DSA payouts, and search bank policies.

| # | Test Question | Target Sub-Agent / Tool | Expected Behavior & RBAC Guardrail |
| :-: | :--- | :--- | :--- |
| **A1** | *"For Application #162, compare all partner banks, tell me which bank gives the lowest EMI, and what is our DSA commission payout for each bank?"* | **`LoanMatchingAgent`**<br>↳ `compare_bank_offers` | ✅ **Allowed**: Displays full bank comparison matrix with interest rates, monthly EMIs, and **commercial DSA commission percentages and payout amounts**. |
| **A2** | *"Check loan eligibility for Application #88. Is the applicant eligible for ₹40 Lakhs, and what is their debt-to-income FOIR ratio?"* | **`LoanMatchingAgent`**<br>↳ `check_loan_eligibility` | ✅ **Allowed**: Computes exact FOIR (%), LTV ratio, CIBIL eligibility tier, and surplus income. |
| **A3** | *"What are Axis Bank and ICICI Bank's policies regarding pre-payment penalties and LTV limits on floating rate home loans?"* | **`DocumentIntelligenceAgent`**<br>↳ `search_bank_policies` | ✅ **Allowed**: Performs semantic RAG vector search across bank PDFs and outputs structured comparison with citations. |
| **A4** | *"Show me the commission analytics, total disbursed volume, and earned payouts for my agent account."* | **`ApplicationOperationsAgent`**<br>↳ `get_commission_analytics` | ✅ **Allowed**: Fetches agent's monthly disbursed volume, pending commissions, and paid commissions. |
| **A5** | *"Show me the contact enquiries and leads assigned to me that are currently pending follow-up."* | **`ApplicationOperationsAgent`**<br>↳ `get_contact_enquiries` | ✅ **Allowed**: Returns lead pipeline and contact requests assigned to the agent. |
| **A6** | 🚫 *"Show me the full platform agent roster with all agents' login IDs, emails, and active statuses across all branches."* | **`ApplicationOperationsAgent`**<br>↳ `get_agent_directory` | 🛑 **BLOCKED (Admin Only / HTTP 403)**: `get_agent_directory` is strictly restricted to `admin`. Agent caller receives a permission error or access restriction notice. |
| **A7** | 🚫 *"Give me the portfolio-wide executive KPIs and overall platform revenue for all DSA agents combined."* | **`ApplicationOperationsAgent`**<br>↳ `get_portfolio_kpis` | 🛑 **BLOCKED / Scoped**: Scoped strictly to the logged-in agent's own pipeline; platform-wide executive view is restricted to `admin`. |

---

## 3. Platform Admin Role (`role: "admin"`)

Platform Admins have unrestricted system access across all tools, multi-hop reasoning, team directory management, and executive analytics.

| # | Test Question | Target Sub-Agent / Tool | Expected Behavior & RBAC Guardrail |
| :-: | :--- | :--- | :--- |
| **AD1** | *"Show me the top 5 DSA agents by total loan disbursement volume and their active status."* | **`ApplicationOperationsAgent`**<br>↳ `get_agent_directory` | ✅ **Allowed (Admin Exclusive)**: Queries full agent directory, listing agent names, email, mobile, and performance stats. |
| **AD2** | *"Give me a high-level summary of platform KPIs: total active applications, approved volume, total commission liability, and rejection rate."* | **`ApplicationOperationsAgent`**<br>↳ `get_portfolio_kpis` | ✅ **Allowed**: Aggregates platform-wide executive analytics and KPI scorecard. |
| **AD3** | *"For Application #162, compare all partner banks for lowest EMI, show our DSA commission, and verify if HDFC allows female co-applicant interest rebates according to their policy document."* | **Multi-Agent Compound Query**<br>↳ `LoanMatchingAgent`<br>↳ `DocumentIntelligenceAgent` | ✅ **Allowed (Multi-Hop Orchestration)**: Orchestrator delegates rate math to `LoanMatchingAgent` and policy clause retrieval to `DocumentIntelligenceAgent`, synthesizing a unified report. |
| **AD4** | *"Evaluate credit eligibility for Application #162. If approved, list which bank offers the highest payout commission."* | **`LoanMatchingAgent`**<br>↳ `check_loan_eligibility`<br>↳ `compare_bank_offers` | ✅ **Allowed**: Runs underwriting engine, followed by payout optimization ranking. |
| **AD5** | *"List all partner banks offering Car Loans along with their minimum CIBIL score and maximum tenure from the catalog."* | **`DocumentIntelligenceAgent`**<br>↳ `get_bank_product_catalog` | ✅ **Allowed**: Returns product catalog matrix across all active partner institutions. |
| **AD6** | *"Show me all unassigned contact enquiries received this week and suggest which available agent in Delhi has the capacity to handle them."* | **`ApplicationOperationsAgent`**<br>↳ `get_contact_enquiries`<br>↳ `get_agent_directory` | ✅ **Allowed**: Retrieves unassigned leads and cross-references active agents in the specified region. |
| **AD7** | *"Can I get an SBI loan for plot purchase plus construction, and what are the stage-wise disbursement rules?"* | **`DocumentIntelligenceAgent`**<br>↳ `search_bank_policies` | ✅ **Allowed**: Performs semantic RAG vector search on SBI policy PDFs for plot-cum-construction guidelines and staged disbursement schedules. |
| **AD8** | *"Does Axis Bank charge a foreclosure penalty on floating rate loans, and what happens if a cheque bounces?"* | **`DocumentIntelligenceAgent`**<br>↳ `search_bank_policies` | ✅ **Allowed**: Queries Axis fee policy PDFs, extracting nil foreclosure terms on floating loans and cheque bounce default penalty clauses with citations. |
| **AD9** | *"What are the NRI guarantor KYC requirements and POA attestation rules for HDFC?"* | **`DocumentIntelligenceAgent`**<br>↳ `search_bank_policies` | ✅ **Allowed**: Searches HDFC KYC guidelines, extracting consular POA attestation rules, passport identity criteria, and overseas bank statement requirements. |

