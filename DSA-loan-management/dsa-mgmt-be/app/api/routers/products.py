from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.repositories.product_repository import ProductRepository
from app.services.product_service import ProductService
from app.schemas.product import ProductRead
from app.core.security import require_role, CurrentUser
from app.core.response import success_response

router = APIRouter()


def get_product_service(db: Session = Depends(get_db)) -> ProductService:
    repo = ProductRepository(db)
    return ProductService(repo)


@router.get("")
def list_products(
    include_inactive: bool = False,
    product_service: ProductService = Depends(get_product_service),
):
    products = product_service.list_products(include_inactive=include_inactive)
    return success_response(
        result=products,
        message="Products fetched successfully",
    )


@router.get("/{product_id}")
def get_product(
    product_id: int,
    product_service: ProductService = Depends(get_product_service),
):
    product = product_service.get_product_by_id(product_id)
    return success_response(
        result=product,
        message="Product fetched successfully",
    )


@router.post("")
def create_product(
    name: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(require_role(["admin"])),
    product_service: ProductService = Depends(get_product_service),
):
    product = product_service.create_product(name=name, description=description, file=file)
    return success_response(
        result=product,
        message="Product created successfully",
        status_code=201,
    )


@router.put("/{product_id}")
def update_product(
    product_id: int,
    name: str = Form(...),
    description: str = Form(...),
    file: UploadFile | None = File(None),
    remove_image: bool = Form(False),
    current_user: CurrentUser = Depends(require_role(["admin"])),
    product_service: ProductService = Depends(get_product_service),
):
    product = product_service.update_product(
        product_id=product_id,
        name=name,
        description=description,
        file=file,
        remove_image=remove_image,
    )
    return success_response(
        result=product,
        message="Product updated successfully",
    )


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    current_user: CurrentUser = Depends(require_role(["admin"])),
    product_service: ProductService = Depends(get_product_service),
):
    res = product_service.delete_product(product_id)
    return success_response(
        result=res,
        message="Product deactivated successfully",
    )
