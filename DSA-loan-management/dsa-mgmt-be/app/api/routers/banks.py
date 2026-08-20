from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.repositories.bank_repository import BankRepository
from app.services.bank_service import BankService
from app.schemas.bank import BankRead
from app.core.security import require_role, CurrentUser
from app.core.response import success_response

router = APIRouter()


def get_bank_service(db: Session = Depends(get_db)) -> BankService:
    repo = BankRepository(db)
    return BankService(repo)


class ProductLinkPayload(BaseModel):
    isLinked: bool
    commission: Optional[float] = None


# ── Bank CRUD ─────────────────────────────────────────────────────────────────

@router.get("")
def list_banks(
    include_inactive: bool = False,
    bank_service: BankService = Depends(get_bank_service),
):
    banks = bank_service.list_banks(include_inactive=include_inactive)
    return success_response(
        result=banks,
        message="Banks fetched successfully",
    )


@router.get("/{bank_id}")
def get_bank(
    bank_id: int,
    bank_service: BankService = Depends(get_bank_service),
):
    bank = bank_service.get_bank_by_id(bank_id)
    return success_response(
        result=bank,
        message="Bank fetched successfully",
    )


@router.post("")
def create_bank(
    name: str = Form(...),
    isNationalize: bool = Form(False),
    isPrivate: bool = Form(False),
    isnbfc: bool = Form(False),
    file: UploadFile | None = File(None),
    current_user: CurrentUser = Depends(require_role(["admin"])),
    bank_service: BankService = Depends(get_bank_service),
):
    bank = bank_service.create_bank(
        name=name,
        is_nationalize=isNationalize,
        is_private=isPrivate,
        is_nbfc=isnbfc,
        file=file,
    )
    return success_response(
        result=bank,
        message="Bank created successfully",
        status_code=201,
    )


@router.put("/{bank_id}")
def update_bank(
    bank_id: int,
    name: str = Form(...),
    isNationalize: bool = Form(False),
    isPrivate: bool = Form(False),
    isnbfc: bool = Form(False),
    file: UploadFile | None = File(None),
    remove_logo: bool = Form(False),
    current_user: CurrentUser = Depends(require_role(["admin"])),
    bank_service: BankService = Depends(get_bank_service),
):
    bank = bank_service.update_bank(
        bank_id=bank_id,
        name=name,
        is_nationalize=isNationalize,
        is_private=isPrivate,
        is_nbfc=isnbfc,
        file=file,
        remove_logo=remove_logo,
    )
    return success_response(
        result=bank,
        message="Bank updated successfully",
    )


@router.delete("/{bank_id}")
def delete_bank(
    bank_id: int,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    bank_service: BankService = Depends(get_bank_service),
):
    res = bank_service.delete_bank(bank_id)
    return success_response(
        result=res,
        message="Bank deactivated successfully",
    )


# ── Product-Bank Mapping & Documents ──────────────────────────────────────────

@router.get("/{bank_id}/products")
def get_bank_products(
    bank_id: int,
    bank_service: BankService = Depends(get_bank_service),
):
    products = bank_service.get_bank_products(bank_id)
    return success_response(
        result=products,
        message="Bank product mappings fetched successfully",
    )


@router.put("/{bank_id}/products/{product_id}")
def link_bank_product(
    bank_id: int,
    product_id: int,
    payload: ProductLinkPayload,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    bank_service: BankService = Depends(get_bank_service),
):
    result = bank_service.link_product(
        bank_id=bank_id,
        product_id=product_id,
        is_linked=payload.isLinked,
        commission=payload.commission,
    )
    msg = "Product linked successfully" if payload.isLinked else "Product unlinked successfully"
    return success_response(
        result=result,
        message=msg,
    )


@router.post("/{bank_id}/products/{product_id}/documents")
def upload_bank_document(
    bank_id: int,
    product_id: int,
    file: UploadFile = File(...),
    document_name: str | None = Form(None),
    current_user: CurrentUser = Depends(require_role(["admin"])),
    bank_service: BankService = Depends(get_bank_service),
):
    result = bank_service.upload_document(
        bank_id=bank_id,
        product_id=product_id,
        file=file,
        document_name=document_name,
    )
    return success_response(
        result=result,
        message="Bank policy document uploaded and indexed successfully",
        status_code=201,
    )


@router.delete("/{bank_id}/products/{product_id}/documents/{document_id}")
def delete_bank_document(
    bank_id: int,
    product_id: int,
    document_id: int,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    bank_service: BankService = Depends(get_bank_service),
):
    res = bank_service.delete_document(
        bank_id=bank_id,
        product_id=product_id,
        document_id=document_id,
    )
    return success_response(
        result=res,
        message="Bank policy document deleted successfully",
    )
