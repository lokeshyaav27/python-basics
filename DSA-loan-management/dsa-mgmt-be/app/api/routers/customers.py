# Forwarding to loan_applications.py
from app.api.routers.loan_applications import (
    router,
    get_db,
    LoanApplicationCreate,
    LoanApplicationUpdate,
    CustomerCreate,
    CustomerUpdate,
    AssignAgentPayload,
    ApplicationStatusPayload,
    _serialize,
)
