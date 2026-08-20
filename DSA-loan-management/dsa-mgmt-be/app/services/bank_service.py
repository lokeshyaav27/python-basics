import os
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, UploadFile
from app.models.bank import Bank
from app.models.product_bank_link import ProductBankLink
from app.models.bank_document import BankDocument
from app.repositories.bank_repository import BankRepository
from app.schemas.bank import BankRead
from app.rag import rag_service
from app.core.config import settings
from app.core.storage import (
    get_storage_path,
    validate_and_save_image,
    validate_and_save_document,
    delete_storage_file,
)


class BankService:
    def __init__(self, bank_repo: BankRepository):
        self.bank_repo = bank_repo

    def list_banks(self, include_inactive: bool = False, product_id: Optional[int] = None) -> List[BankRead]:
        banks = self.bank_repo.list_banks(include_inactive=include_inactive, product_id=product_id)
        return [BankRead.from_orm(b) for b in banks]

    def get_bank_by_id(self, bank_id: int) -> BankRead:
        bank = self.bank_repo.get_by_id(bank_id)
        if not bank:
            raise HTTPException(status_code=404, detail='Bank not found')
        return BankRead.from_orm(bank)

    def create_bank(
        self,
        name: str,
        is_nationalize: bool = False,
        is_private: bool = False,
        is_nbfc: bool = False,
        file: Optional[UploadFile] = None,
    ) -> BankRead:
        logo_fname: Optional[str] = None
        if file is not None and file.filename:
            logo_fname = validate_and_save_image(file, subfolder=settings.STORAGE_BANK_LOGOS_DIR)

        bank = self.bank_repo.create(
            name=name,
            is_nationalize=is_nationalize,
            is_private=is_private,
            is_nbfc=is_nbfc,
            logo=logo_fname,
        )
        return BankRead.from_orm(bank)

    def update_bank(
        self,
        bank_id: int,
        name: str,
        is_nationalize: bool = False,
        is_private: bool = False,
        is_nbfc: bool = False,
        file: Optional[UploadFile] = None,
        remove_logo: bool = False,
    ) -> BankRead:
        bank = self.bank_repo.get_by_id(bank_id)
        if not bank:
            raise HTTPException(status_code=404, detail='Bank not found')

        logo_fname = bank.logo
        update_logo = False
        if file is not None and file.filename:
            logo_fname = validate_and_save_image(file, subfolder=settings.STORAGE_BANK_LOGOS_DIR)
            update_logo = True
        elif remove_logo:
            if bank.logo:
                delete_storage_file(bank.logo, subfolder=settings.STORAGE_BANK_LOGOS_DIR)
            logo_fname = None
            update_logo = True

        updated = self.bank_repo.update(
            bank=bank,
            name=name,
            is_nationalize=is_nationalize,
            is_private=is_private,
            is_nbfc=is_nbfc,
            logo=logo_fname,
            update_logo=update_logo,
        )
        return BankRead.from_orm(updated)

    def delete_bank(self, bank_id: int) -> dict:
        bank = self.bank_repo.get_by_id(bank_id)
        if not bank:
            raise HTTPException(status_code=404, detail='Bank not found')
        self.bank_repo.soft_delete(bank)
        return {"id": bank_id, "deleted": True}

    def get_bank_products(self, bank_id: int) -> List[Dict[str, Any]]:
        bank = self.bank_repo.get_by_id(bank_id)
        if not bank:
            raise HTTPException(status_code=404, detail='Bank not found')

        product_links = self.bank_repo.get_product_links_with_products(bank_id)
        result = []
        for product, link in product_links:
            item = {
                "productId": product.id,
                "productName": product.name,
                "productDescription": product.description,
                "productImage": product.image,
                "isLinked": link is not None,
                "commission": float(link.commission) if (link and link.commission is not None) else None,
                "linkId": link.id if link else None,
                "documents": [],
            }
            if link:
                docs = self.bank_repo.get_documents_by_link_id(link.id)
                item["documents"] = [
                    {
                        "id": d.id,
                        "documentName": d.documentName,
                        "name": d.documentName,
                        "documentLocation": d.documentLocation,
                        "fileName": d.documentLocation,
                        "createdAt": d.createdAt.isoformat() if d.createdAt else None,
                    }
                    for d in docs
                ]
            result.append(item)
        return result

    def link_product(
        self,
        bank_id: int,
        product_id: int,
        is_linked: bool,
        commission: Optional[float] = None,
    ) -> Dict[str, Any]:
        bank = self.bank_repo.get_by_id(bank_id)
        if not bank:
            raise HTTPException(status_code=404, detail='Bank not found')

        existing_link = self.bank_repo.get_product_bank_link(bank_id, product_id)

        if not is_linked:
            if existing_link:
                # Remove document chunks from RAG vector index
                docs = self.bank_repo.get_documents_by_link_id(existing_link.id)
                for d in docs:
                    try:
                        rag_service.remove_document_chunks(self.bank_repo.db, d.id)
                    except Exception:
                        pass
                self.bank_repo.delete_product_bank_link(existing_link)
            return {"bankId": bank_id, "productId": product_id, "isLinked": False}

        if existing_link:
            self.bank_repo.update_product_bank_link(existing_link, commission)
            return {
                "bankId": bank_id,
                "productId": product_id,
                "isLinked": True,
                "commission": commission,
                "linkId": existing_link.id,
            }

        new_link = self.bank_repo.create_product_bank_link(bank_id, product_id, commission)
        return {
            "bankId": bank_id,
            "productId": product_id,
            "isLinked": True,
            "commission": commission,
            "linkId": new_link.id,
        }

    def upload_document(
        self,
        bank_id: int,
        product_id: int,
        file: UploadFile,
        document_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        link = self.bank_repo.get_product_bank_link(bank_id, product_id)
        if not link:
            raise HTTPException(status_code=400, detail='Product must be linked to bank before uploading policy docs')

        doc_fname = validate_and_save_document(file, subfolder=settings.STORAGE_BANK_DOCS_DIR)
        file_path = get_storage_path(settings.STORAGE_BANK_DOCS_DIR) / doc_fname

        doc_title = document_name.strip() if (document_name and document_name.strip()) else file.filename
        doc = self.bank_repo.create_document(link.id, doc_title, doc_fname)

        # Index PDF / text into RAG vector embeddings
        try:
            rag_service.index_pdf_document(
                db=self.bank_repo.db,
                bank_document_id=doc.id,
                bank_id=bank_id,
                product_id=product_id,
                pdf_path=str(file_path),
            )
        except Exception as e:
            print(f"[RAG Index Warning] Could not index document chunks: {e}")

        return {
            "id": doc.id,
            "documentName": doc.documentName,
            "name": doc.documentName,
            "documentLocation": doc.documentLocation,
            "fileName": doc.documentLocation,
            "linkId": link.id,
        }

    def delete_document(self, bank_id: int, product_id: int, document_id: int) -> dict:
        link = self.bank_repo.get_product_bank_link(bank_id, product_id)
        if not link:
            raise HTTPException(status_code=404, detail='Product bank link not found')

        doc = self.bank_repo.get_document_by_id(document_id)
        if not doc or doc.productBankLinkId != link.id:
            raise HTTPException(status_code=404, detail='Document not found')

        # Remove RAG chunks
        try:
            rag_service.remove_document_chunks(self.bank_repo.db, doc.id)
        except Exception:
            pass

        # Remove physical file
        delete_storage_file(doc.documentLocation, subfolder=settings.STORAGE_BANK_DOCS_DIR)

        self.bank_repo.delete_document(doc)
        return {"id": document_id, "deleted": True}
