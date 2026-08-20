"""
Comprehensive MCP Tools Suite for DSA Loan Management Platform
Includes full authorization, authentication scoping, and data serialization.
"""
from typing import Dict, Any, List, Optional, Union
from sqlalchemy.orm import Session
from fastapi import HTTPException
from decimal import Decimal

from app.models.loan_application import LoanApplication
from app.models.client_general_detail import ClientGeneralDetail
from app.models.home_loan_detail import HomeLoanDetail
from app.models.car_loan_detail import CarLoanDetail
from app.models.personal_loan_detail import PersonalLoanDetail
from app.models.product import Product
from app.models.bank import Bank
from app.models.agent import Agent
from app.models.product_bank_link import ProductBankLink
from app.models.bank_document import BankDocument
from app.rag import rag_service


# ── Helper: Serialize Loan Application with related tables ───────────────────
def serialize_loan_application(app: LoanApplication, hide_commission: bool = False) -> Dict[str, Any]:
    cgd = app.clientGeneralDetail
    hld = app.homeLoanDetail
    cld = app.carLoanDetail
    pld = app.personalLoanDetail

    data = {
        "id": app.id,
        "name": app.name,
        "email": app.email,
        "mobile": app.mobile,
        "uniqueCustomerId": app.uniqueCustomerId,
        "status": app.status,
        "productId": app.productId,
        "productName": app.product.name if app.product else None,
        "productImage": app.product.image if app.product else None,
        "agentId": app.agentId,
        "agentName": app.agent.name if app.agent else None,
        "agentEmail": app.agent.email if app.agent else None,
        "agentMobile": app.agent.mobile if app.agent else None,
        "bankId": app.bankId,
        "bankName": app.bank.name if app.bank else None,
        "bankLogo": app.bank.logo if app.bank else None,
        "description": app.description,
        "isActive": app.isActive,
        "clientGeneralDetails": {
            "name": cgd.name if cgd else None,
            "age": cgd.age if cgd else None,
            "gender": cgd.gender if cgd else None,
            "location": cgd.location if cgd else None,
            "employment_type": cgd.employment_type if cgd else None,
            "monthly_income": float(cgd.monthly_income) if cgd and cgd.monthly_income is not None else None,
            "monthly_obligation": float(cgd.monthly_obligation) if cgd and cgd.monthly_obligation is not None else None,
            "existing_emi": float(cgd.existing_emi) if cgd and cgd.existing_emi is not None else None,
            "cibil_score": cgd.cibil_score if cgd else None,
            "loan_amount_required": float(cgd.loan_amount_required) if cgd and cgd.loan_amount_required is not None else None,
            "preferred_tenure": cgd.preferred_tenure if cgd else None,
            "isSalaried": cgd.isSalaried if cgd else None,
        } if cgd else None,
        "homeLoanDetails": {
            "property_value": float(hld.property_value) if hld and hld.property_value is not None else None,
            "property_location": hld.property_location if hld else None,
            "propertyType": hld.propertyType if hld else None,
            "propertyStatus": hld.propertyStatus if hld else None,
            "femaleCoApplicant": hld.femaleCoApplicant if hld else False,
        } if hld else None,
        "carLoanDetails": {
            "car_value": float(cld.car_value) if cld and cld.car_value is not None else None,
            "new_or_used": cld.new_or_used if cld else None,
            "vehicle_age": cld.vehicle_age if cld else None,
            "down_payment": float(cld.down_payment) if cld and cld.down_payment is not None else None,
        } if cld else None,
        "personalLoanDetails": {
            "loan_purpose": pld.loan_purpose if pld else None,
            "required_amount": float(pld.required_amount) if pld and pld.required_amount is not None else None,
            "existing_obligations": float(pld.existing_obligations) if pld and pld.existing_obligations is not None else None,
        } if pld else None,
    }
    return data


# ── Auth Verification Helper ────────────────────────────────────────────────
def check_auth_permission(
    auth_user: Optional[Dict[str, Any]],
    target_customer_id: Optional[str] = None,
    target_agent_id: Optional[int] = None,
    target_app: Optional[LoanApplication] = None,
) -> None:
    """
    Validates role-based access control:
    - Admin: Full access.
    - Agent: Can access resources assigned to or associated with their agent_id.
    - Customer: Can access ONLY their own records.
    """
    if not auth_user:
        # Default permissive for internal CLI/MCP calls if no auth context passed,
        # but enforce strict when role is explicitly passed.
        return

    role = str(auth_user.get("role", "customer")).lower()
    caller_user_id = auth_user.get("userId") or auth_user.get("user_id") or auth_user.get("id")
    caller_identifier = str(auth_user.get("identifier") or auth_user.get("mobile") or caller_user_id or "").strip().lower()

    if role == "admin":
        return  # Admin has unrestricted access

    if role == "agent":
        if target_agent_id is not None and caller_user_id is not None:
            if int(target_agent_id) != int(caller_user_id):
                raise HTTPException(status_code=403, detail="Forbidden: You can only access resources assigned to your agent account.")
        if target_app is not None and caller_user_id is not None:
            if target_app.agentId is not None and int(target_app.agentId) != int(caller_user_id):
                raise HTTPException(status_code=403, detail="Forbidden: This loan application is assigned to another agent.")
        return

    if role == "customer":
        if target_agent_id is not None:
            raise HTTPException(status_code=403, detail="Forbidden: Customers cannot access agent-level rosters or loans.")

        if target_customer_id is not None and caller_identifier:
            t_cust = str(target_customer_id).strip().lower()
            if caller_identifier != t_cust:
                raise HTTPException(status_code=403, detail="Forbidden: You can only access your own customer account details.")

        if target_app is not None and caller_identifier:
            app_cust_id = str(target_app.uniqueCustomerId or "").strip().lower()
            app_mobile = str(target_app.mobile or "").strip().lower()
            app_email = str(target_app.email or "").strip().lower()

            if caller_identifier not in [app_cust_id, app_mobile, app_email, str(target_app.id)]:
                raise HTTPException(status_code=403, detail="Forbidden: You can only view your own loan applications.")


# ─────────────────────────────────────────────────────────────────────────────
# 1. get_customer_details_by_id
# ─────────────────────────────────────────────────────────────────────────────
def get_customer_details_by_id(
    db: Session,
    customer_id: Union[str, int],
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Fetches full customer profile and aggregated loan statistics by customer identifier
    (Accepts uniqueCustomerId, mobile, or primary application ID).
    """
    cust_str = str(customer_id).strip()
    check_auth_permission(auth_user, target_customer_id=cust_str)

    apps = db.query(LoanApplication).filter(
        (LoanApplication.uniqueCustomerId == cust_str) |
        (LoanApplication.mobile == cust_str) |
        (LoanApplication.id == (int(cust_str) if cust_str.isdigit() else -1))
    ).all()

    if not apps:
        raise HTTPException(status_code=404, detail=f"Customer '{customer_id}' not found.")

    primary_app = apps[0]
    check_auth_permission(auth_user, target_app=primary_app)

    cgd = primary_app.clientGeneralDetail
    active_loans_count = len([a for a in apps if a.status in ["approved", "in-progress", "pending review", "submitted"]])

    return {
        "customerId": primary_app.uniqueCustomerId or str(primary_app.id),
        "uniqueCustomerId": primary_app.uniqueCustomerId,
        "name": (cgd.name if cgd and cgd.name else primary_app.name) or "Customer",
        "email": primary_app.email,
        "mobile": primary_app.mobile,
        "age": cgd.age if cgd else None,
        "gender": cgd.gender if cgd else None,
        "location": cgd.location if cgd else None,
        "employmentType": cgd.employment_type if cgd else None,
        "monthlyIncome": float(cgd.monthly_income) if cgd and cgd.monthly_income is not None else None,
        "existingEmi": float(cgd.existing_emi) if cgd and cgd.existing_emi is not None else None,
        "monthlyObligation": float(cgd.monthly_obligation) if cgd and cgd.monthly_obligation is not None else None,
        "cibilScore": cgd.cibil_score if cgd else None,
        "totalApplicationsCount": len(apps),
        "activeLoansCount": active_loans_count,
        "applicationIds": [a.id for a in apps],
        "assignedAgent": {
            "id": primary_app.agent.id,
            "name": primary_app.agent.name,
            "email": primary_app.agent.email,
            "mobile": primary_app.agent.mobile,
        } if primary_app.agent else None,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 2. get_loan_details_by_customer_id
# ─────────────────────────────────────────────────────────────────────────────
def get_loan_details_by_customer_id(
    db: Session,
    customer_id: Union[str, int],
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Fetches all loan records belonging to a given customer.
    """
    cust_str = str(customer_id).strip()
    check_auth_permission(auth_user, target_customer_id=cust_str)

    apps = db.query(LoanApplication).filter(
        (LoanApplication.uniqueCustomerId == cust_str) |
        (LoanApplication.mobile == cust_str) |
        (LoanApplication.id == (int(cust_str) if cust_str.isdigit() else -1))
    ).order_by(LoanApplication.id.desc()).all()

    if not apps:
        raise HTTPException(status_code=404, detail=f"No loans found for customer '{customer_id}'.")

    hide_comm = auth_user.get("role") == "customer" if auth_user else False
    serialized_loans = []
    for a in apps:
        check_auth_permission(auth_user, target_app=a)
        serialized_loans.append(serialize_loan_application(a, hide_commission=hide_comm))

    return {
        "customerId": cust_str,
        "totalLoans": len(serialized_loans),
        "loans": serialized_loans,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 3. get_all_customer_of_agent
# ─────────────────────────────────────────────────────────────────────────────
def get_all_customer_of_agent(
    db: Session,
    agent_id: int,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Fetches distinct customers assigned to or managed by an agent.
    """
    check_auth_permission(auth_user, target_agent_id=agent_id)

    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent #{agent_id} not found.")

    apps = db.query(LoanApplication).filter(LoanApplication.agentId == agent_id).all()

    customers_map: Dict[str, Dict[str, Any]] = {}
    for a in apps:
        c_key = a.uniqueCustomerId or a.mobile or str(a.id)
        if c_key not in customers_map:
            cgd = a.clientGeneralDetail
            customers_map[c_key] = {
                "uniqueCustomerId": a.uniqueCustomerId,
                "name": a.name,
                "email": a.email,
                "mobile": a.mobile,
                "cibilScore": cgd.cibil_score if cgd else None,
                "monthlyIncome": float(cgd.monthly_income) if cgd and cgd.monthly_income is not None else None,
                "loansCount": 0,
                "applicationIds": [],
            }
        customers_map[c_key]["loansCount"] += 1
        customers_map[c_key]["applicationIds"].append(a.id)

    return {
        "agentId": agent.id,
        "agentName": agent.name,
        "agentEmail": agent.email,
        "totalCustomers": len(customers_map),
        "customers": list(customers_map.values()),
    }


# ─────────────────────────────────────────────────────────────────────────────
# 4. get_all_loans_of_agent
# ─────────────────────────────────────────────────────────────────────────────
def get_all_loans_of_agent(
    db: Session,
    agent_id: int,
    status_filter: Optional[str] = None,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Fetches all loan applications assigned to a specific agent.
    """
    check_auth_permission(auth_user, target_agent_id=agent_id)

    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent #{agent_id} not found.")

    query = db.query(LoanApplication).filter(LoanApplication.agentId == agent_id)
    if status_filter:
        query = query.filter(LoanApplication.status.ilike(f"%{status_filter}%"))

    apps = query.order_by(LoanApplication.id.desc()).all()
    loans = [serialize_loan_application(a, hide_commission=False) for a in apps]

    return {
        "agentId": agent.id,
        "agentName": agent.name,
        "totalLoans": len(loans),
        "loans": loans,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 5. get_loan_by_id
# ─────────────────────────────────────────────────────────────────────────────
def get_loan_by_id(
    db: Session,
    loan_id: int,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Fetches complete loan application details by Loan/Application ID.
    """
    app = db.query(LoanApplication).filter(LoanApplication.id == loan_id).first()
    if not app:
        raise HTTPException(status_code=404, detail=f"Loan Application #{loan_id} not found.")

    check_auth_permission(auth_user, target_app=app)
    hide_comm = auth_user.get("role") == "customer" if auth_user else False
    return serialize_loan_application(app, hide_commission=hide_comm)


# ─────────────────────────────────────────────────────────────────────────────
# 6. get_products
# ─────────────────────────────────────────────────────────────────────────────
def get_products(
    db: Session,
    is_active: bool = True,
) -> Dict[str, Any]:
    """
    Fetches the catalog of available loan products (Home Loan, Car Loan, Personal Loan).
    """
    query = db.query(Product)
    if is_active:
        query = query.filter(Product.isActive == True)
    products = query.order_by(Product.id.asc()).all()

    return {
        "totalProducts": len(products),
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "image": p.image,
                "isActive": p.isActive,
            }
            for p in products
        ],
    }


# ─────────────────────────────────────────────────────────────────────────────
# 7. get_product_by_id
# ─────────────────────────────────────────────────────────────────────────────
def get_product_by_id(
    db: Session,
    product_id: int,
) -> Dict[str, Any]:
    """
    Fetches a specific loan product and its linked partner banks.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product #{product_id} not found.")

    links = db.query(ProductBankLink).filter(
        ProductBankLink.productId == product.id,
        ProductBankLink.isActive == True,
    ).all()

    partner_banks = []
    for l in links:
        if l.bank and l.bank.isActive:
            partner_banks.append({
                "bankId": l.bank.id,
                "bankName": l.bank.name,
                "bankLogo": l.bank.logo,
                "isNationalize": l.bank.isNationalize,
                "isPrivate": l.bank.isPrivate,
                "isNbfc": l.bank.isNbfc,
                "commission": float(l.commission) if l.commission is not None else None,
            })

    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "image": product.image,
        "isActive": product.isActive,
        "totalPartnerBanks": len(partner_banks),
        "partnerBanks": partner_banks,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 8. get_banks
# ─────────────────────────────────────────────────────────────────────────────
def get_banks(
    db: Session,
    product_id: Optional[int] = None,
    is_active: bool = True,
) -> Dict[str, Any]:
    """
    Fetches active partner banks and financial institutions, optionally filtered by product.
    """
    if product_id is not None:
        links = db.query(ProductBankLink).filter(
            ProductBankLink.productId == product_id,
            ProductBankLink.isActive == True,
        ).all()
        bank_ids = [l.bankId for l in links]
        query = db.query(Bank).filter(Bank.id.in_(bank_ids))
    else:
        query = db.query(Bank)

    if is_active:
        query = query.filter(Bank.isActive == True)

    banks = query.order_by(Bank.id.asc()).all()

    return {
        "totalBanks": len(banks),
        "banks": [
            {
                "id": b.id,
                "name": b.name,
                "isNationalize": b.isNationalize,
                "isPrivate": b.isPrivate,
                "isNbfc": b.isNbfc,
                "logo": b.logo,
                "isActive": b.isActive,
            }
            for b in banks
        ],
    }


# ─────────────────────────────────────────────────────────────────────────────
# 9. get_bank_by_id
# ─────────────────────────────────────────────────────────────────────────────
def get_bank_by_id(
    db: Session,
    bank_id: int,
) -> Dict[str, Any]:
    """
    Fetches specific bank profile, linked products, and policy document summary.
    """
    bank = db.query(Bank).filter(Bank.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail=f"Bank #{bank_id} not found.")

    links = db.query(ProductBankLink).filter(
        ProductBankLink.bankId == bank.id,
        ProductBankLink.isActive == True,
    ).all()

    offered_products = []
    for l in links:
        if l.product and l.product.isActive:
            docs_count = db.query(BankDocument).filter(BankDocument.productBankLinkId == l.id).count()
            offered_products.append({
                "productId": l.product.id,
                "productName": l.product.name,
                "commission": float(l.commission) if l.commission is not None else None,
                "policyDocumentsCount": docs_count,
            })

    return {
        "id": bank.id,
        "name": bank.name,
        "isNationalize": bank.isNationalize,
        "isPrivate": bank.isPrivate,
        "isNbfc": bank.isNbfc,
        "logo": bank.logo,
        "isActive": bank.isActive,
        "totalProductsOffered": len(offered_products),
        "products": offered_products,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 10. get_all_loans_of_customers
# ─────────────────────────────────────────────────────────────────────────────
def get_all_loans_of_customers(
    db: Session,
    customer_identifier: Optional[str] = None,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Fetches all loan records across customers, respecting role-based filtering.
    """
    role = str(auth_user.get("role", "customer")).lower() if auth_user else "admin"
    caller_id = str(auth_user.get("userId") or auth_user.get("user_id") or auth_user.get("id") or "").strip()
    caller_ident = str(auth_user.get("identifier") or auth_user.get("mobile") or caller_id).strip()

    query = db.query(LoanApplication)

    if role == "customer":
        # Customer can only view their own loans
        search_term = caller_ident or customer_identifier
        if not search_term:
            raise HTTPException(status_code=400, detail="Customer identifier is required.")
        query = query.filter(
            (LoanApplication.uniqueCustomerId == search_term) |
            (LoanApplication.mobile == search_term) |
            (LoanApplication.email.ilike(search_term))
        )
    elif role == "agent":
        # Agent can view loans assigned to them
        if caller_id.isdigit():
            query = query.filter(LoanApplication.agentId == int(caller_id))
        if customer_identifier:
            query = query.filter(
                (LoanApplication.uniqueCustomerId == customer_identifier) |
                (LoanApplication.mobile == customer_identifier) |
                (LoanApplication.name.ilike(f"%{customer_identifier}%"))
            )
    else:
        # Admin can view all, optionally filtered by customer_identifier
        if customer_identifier:
            query = query.filter(
                (LoanApplication.uniqueCustomerId == customer_identifier) |
                (LoanApplication.mobile == customer_identifier) |
                (LoanApplication.name.ilike(f"%{customer_identifier}%"))
            )

    apps = query.order_by(LoanApplication.id.desc()).all()
    hide_comm = role == "customer"
    loans = [serialize_loan_application(a, hide_commission=hide_comm) for a in apps]

    return {
        "totalLoans": len(loans),
        "loans": loans,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 11. search_bank_documents (RAG Semantic Vector Search)
# ─────────────────────────────────────────────────────────────────────────────
def search_bank_documents(
    db: Session,
    query: str,
    bank_id: Optional[int] = None,
    product_id: Optional[int] = None,
    top_k: int = 5,
) -> Dict[str, Any]:
    """
    Performs semantic vector search over bank policy & guideline PDF chunks using pgvector.
    Provides structured excerpts and formatted LLM knowledge context.
    """
    matches = rag_service.search_relevant_chunks(
        db=db,
        query_text=query,
        bank_id=bank_id,
        product_id=product_id,
        top_k=top_k,
    )

    # Format into ready-to-use LLM prompt context
    context_blocks = []
    for idx, m in enumerate(matches, 1):
        text_snippet = m['chunkText']
        if len(text_snippet) > 400:
            text_snippet = text_snippet[:400] + "..."
        doc_header = f"[{idx}] {m['bankName']} - {m['documentName']} (Page {m['pageNumber'] or '1'})"
        context_blocks.append(f"{doc_header}\n{text_snippet}")

    llm_context = "\n\n---\n\n".join(context_blocks) if context_blocks else "No relevant bank policy document excerpts found."

    return {
        "query": query,
        "totalMatches": len(matches),
        "llmContext": llm_context,
        "results": matches,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Master MCP Tools Specifications Registry
# ─────────────────────────────────────────────────────────────────────────────
MCP_DSA_TOOLS_SPECS: List[Dict[str, Any]] = [
    {
        "name": "get_customer_details_by_id",
        "description": "Fetches complete customer profile, financials, and application count by customer ID, mobile, or application ID.",
        "parameters": {
            "type": "object",
            "properties": {
                "customer_id": {"type": "string", "description": "Unique customer ID, mobile number, or primary application ID."}
            },
            "required": ["customer_id"]
        }
    },
    {
        "name": "get_loan_details_by_customer_id",
        "description": "Fetches all loan applications associated with a given customer ID or mobile number.",
        "parameters": {
            "type": "object",
            "properties": {
                "customer_id": {"type": "string", "description": "Unique customer ID or mobile number."}
            },
            "required": ["customer_id"]
        }
    },
    {
        "name": "get_all_customer_of_agent",
        "description": "Fetches list of all distinct customers assigned to a given agent ID (Agent/Admin access only).",
        "parameters": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "integer", "description": "Agent ID to query customers for."}
            },
            "required": ["agent_id"]
        }
    },
    {
        "name": "get_all_loans_of_agent",
        "description": "Fetches all loan applications managed by a specific agent ID (Agent/Admin access only).",
        "parameters": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "integer", "description": "Agent ID to query loans for."},
                "status_filter": {"type": ["string", "null"], "description": "Optional status filter (e.g. 'Pending Review', 'approved')."}
            },
            "required": ["agent_id"]
        }
    },
    {
        "name": "get_loan_by_id",
        "description": "Fetches full loan application record, applicant profile, and product-specific data by Loan ID.",
        "parameters": {
            "type": "object",
            "properties": {
                "loan_id": {"type": "integer", "description": "Unique loan application ID."}
            },
            "required": ["loan_id"]
        }
    },
    {
        "name": "get_products",
        "description": "Fetches list of all active loan products (Home Loan, Car Loan, Personal Loan) with descriptions.",
        "parameters": {
            "type": "object",
            "properties": {
                "is_active": {"type": ["boolean", "null"], "description": "Filter by active status (default: true)."}
            }
        }
    },
    {
        "name": "get_product_by_id",
        "description": "Fetches detailed information about a specific loan product and its linked partner banks.",
        "parameters": {
            "type": "object",
            "properties": {
                "product_id": {"type": "integer", "description": "Product ID to query."}
            },
            "required": ["product_id"]
        }
    },
    {
        "name": "get_banks",
        "description": "Fetches list of active partner banks and NBFCs, optionally filtered by loan product.",
        "parameters": {
            "type": "object",
            "properties": {
                "product_id": {"type": ["integer", "null"], "description": "Optional product ID filter."},
                "is_active": {"type": ["boolean", "null"], "description": "Filter by active status (default: true)."}
            }
        }
    },
    {
        "name": "get_bank_by_id",
        "description": "Fetches bank profile, institution type, offered products, and policy document counts by Bank ID.",
        "parameters": {
            "type": "object",
            "properties": {
                "bank_id": {"type": "integer", "description": "Bank ID to query."}
            },
            "required": ["bank_id"]
        }
    },
    {
        "name": "get_all_loans_of_customers",
        "description": "Fetches loan records across customers with role-based scoping (customers see own loans, agents see assigned loans, admin sees all).",
        "parameters": {
            "type": "object",
            "properties": {
                "customer_identifier": {"type": ["string", "null"], "description": "Optional customer ID, mobile, or name filter."}
            }
        }
    },
    {
        "name": "search_bank_documents",
        "description": "Performs semantic RAG search across indexed partner bank policy PDFs (interest rates, guidelines, age rules, insurance, prepayment penalties) using vector embeddings.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query or natural language policy question."},
                "bank_id": {"type": ["integer", "null"], "description": "Optional bank ID to filter search."},
                "product_id": {"type": ["integer", "null"], "description": "Optional product ID to filter search."},
                "top_k": {"type": ["integer", "null"], "description": "Number of relevant policy chunks to return (default: 5)."}
            },
            "required": ["query"]
        }
    }
]


# ── Generic Tool Dispatcher ──────────────────────────────────────────────────
def execute_dsa_mcp_tool(
    db: Session,
    tool_name: str,
    arguments: Dict[str, Any],
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Executes an MCP tool by name with arguments and authorization scoping.
    """
    if tool_name == "get_customer_details_by_id":
        return get_customer_details_by_id(db, customer_id=arguments.get("customer_id") or arguments.get("customerId"), auth_user=auth_user)

    elif tool_name == "get_loan_details_by_customer_id":
        return get_loan_details_by_customer_id(db, customer_id=arguments.get("customer_id") or arguments.get("customerId"), auth_user=auth_user)

    elif tool_name == "get_all_customer_of_agent":
        return get_all_customer_of_agent(db, agent_id=int(arguments.get("agent_id") or arguments.get("agentId")), auth_user=auth_user)

    elif tool_name == "get_all_loans_of_agent":
        return get_all_loans_of_agent(
            db,
            agent_id=int(arguments.get("agent_id") or arguments.get("agentId")),
            status_filter=arguments.get("status_filter") or arguments.get("statusFilter"),
            auth_user=auth_user
        )

    elif tool_name == "get_loan_by_id":
        return get_loan_by_id(db, loan_id=int(arguments.get("loan_id") or arguments.get("loanId") or arguments.get("application_id") or arguments.get("applicationId")), auth_user=auth_user)

    elif tool_name == "get_products":
        return get_products(db, is_active=arguments.get("is_active", True))

    elif tool_name == "get_product_by_id":
        return get_product_by_id(db, product_id=int(arguments.get("product_id") or arguments.get("productId")))

    elif tool_name == "get_banks":
        p_id = arguments.get("product_id") or arguments.get("productId")
        return get_banks(db, product_id=int(p_id) if p_id else None, is_active=arguments.get("is_active", True))

    elif tool_name == "get_bank_by_id":
        return get_bank_by_id(db, bank_id=int(arguments.get("bank_id") or arguments.get("bankId")))

    elif tool_name == "get_all_loans_of_customers":
        return get_all_loans_of_customers(
            db,
            customer_identifier=arguments.get("customer_identifier") or arguments.get("customerIdentifier"),
            auth_user=auth_user
        )

    elif tool_name in ["search_bank_documents", "search_bank_policies", "semantic_search"]:
        b_id = arguments.get("bank_id") or arguments.get("bankId")
        p_id = arguments.get("product_id") or arguments.get("productId")
        return search_bank_documents(
            db,
            query=str(arguments.get("query") or arguments.get("query_text") or "").strip(),
            bank_id=int(b_id) if b_id else None,
            product_id=int(p_id) if p_id else None,
            top_k=int(arguments.get("top_k") or arguments.get("topK") or 5),
        )

    else:
        raise HTTPException(status_code=400, detail=f"Unknown MCP tool '{tool_name}'.")
