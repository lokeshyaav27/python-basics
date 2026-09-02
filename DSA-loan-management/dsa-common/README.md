# DSA Common Package (`dsa-common`)

Shared core domain models, underwriting math engines, constants, and database repositories for the **DSA Loan Management Platform**.

## Installation

In development (editable mode):
```bash
pip install -e ../dsa-common
```

## Structure
- `dsa_common.constants`: Benchmark thresholds, FOIR/LTV caps, CIBIL tiers.
- `dsa_common.models`: Single source of truth for all SQLAlchemy ORM models.
- `dsa_common.services.eligibility`: Credit underwriting calculation engine.
- `dsa_common.services.comparison`: Multi-bank comparison matrix evaluation.
- `dsa_common.repositories`: Standard database access layers for loans, agents, and contacts.
