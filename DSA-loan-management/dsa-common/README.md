# DSA Common Package (`dsa-common`)

Shared core domain models, underwriting calculation engines, policy constants, and database repositories for the **DSA Loan Management Platform**.

This package serves as the **Single Source of Truth** for both the FastAPI Backend (`dsa-mgmt-be`) and the Model Context Protocol Server (`dsa-mgmt-mcp`), eliminating code duplication and preventing schema/formula drift.

---

## 📦 Package Modules

| Module | Import Path | Description |
| :--- | :--- | :--- |
| **Constants** | `from dsa_common.constants import ...` | Credit underwriting thresholds, FOIR/LTV benchmarks, CIBIL tiers, and interest rate matrices. |
| **Models** | `from dsa_common.models import ...` | SQLAlchemy ORM database models (`Base`, `LoanApplication`, `Bank`, `Product`, `Agent`, `AIIssueReport`, etc.). |
| **Underwriting Services** | `from dsa_common.services.eligibility import ...` | Pure underwriting mathematical formulas (FOIR, LTV, EMI) and multi-product eligibility evaluator (`evaluate_loan_application`). |
| **Comparison Services** | `from dsa_common.services.comparison import ...` | Multi-bank rate & quote evaluation engine (`compare_banks_for_application`, `evaluate_single_bank_offer`). |
| **Repositories** | `from dsa_common.repositories import ...` | Database data-access layers (`LoanApplicationRepository`, `BankRepository`, `ProductRepository`, `AgentRepository`, `ContactRepository`). |

---

## 💻 Installation

### Development Mode (Editable Install)
To install `dsa-common` so that changes made to its source code take effect immediately across all services without reinstalling:

```bash
# From within dsa-mgmt-be or dsa-mgmt-mcp:
pip install -e ../dsa-common

# Or from the project root (DSA-loan-management):
pip install -e ./dsa-common
```

---

## 🏗️ Structure

```
dsa-common/
├── pyproject.toml                     # Package metadata & dependencies (SQLAlchemy, pgvector, pydantic)
├── README.md
└── dsa_common/
    ├── __init__.py
    ├── constants.py                   # Central domain constants
    ├── models/                        # 13 SQLAlchemy ORM Models
    │   ├── base.py
    │   ├── bank.py
    │   ├── product.py
    │   ├── product_bank_link.py
    │   ├── bank_document.py
    │   ├── bank_document_chunk.py
    │   ├── agent.py
    │   ├── contact_enquiry.py
    │   ├── client_general_detail.py
    │   ├── home_loan_detail.py
    │   ├── car_loan_detail.py
    │   ├── personal_loan_detail.py
    │   ├── loan_application.py
    │   └── ai_issue_report.py
    ├── services/
    │   ├── eligibility/               # Underwriting math & product eligibility
    │   └── comparison/                # Multi-bank offer evaluator & comparison
    └── repositories/                  # All 5 Database Repositories
        ├── agent_repository.py
        ├── loan_application_repository.py
        ├── contact_repository.py
        ├── bank_repository.py
        └── product_repository.py
```
