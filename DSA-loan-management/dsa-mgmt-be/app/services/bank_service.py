import os
from io import BytesIO
from pathlib import Path
from typing import List, Optional, Dict, Any
from uuid import uuid4
from PIL import Image
from fastapi import HTTPException, UploadFile
from app.models.bank import Bank
from app.models.product_bank_link import ProductBankLink
from app.models.bank_document import BankDocument
from app.repositories.bank_repository import BankRepository
from app.schemas.bank import BankRead
from app.services import rag_service


class BankService:
    def __init__(self, bank_repo: BankRepository):
        self.bank_repo = bank_repo

    @staticmethod
    def get_logo_storage() -> Path:
        project_root = Path(__file__).resolve().parents[2]
        storage = project_root / 'dsa-file-storage' / 'bank-logo-images'
        storage.mkdir(parents=True, exist_ok=True)
        return storage

    @staticmethod
    def get_document_storage() -> Path:
        project_root = Path(__file__).resolve().parents[2]
        storage = project_root / 'dsa-file-storage' / 'bank-documents'
        storage.mkdir(parents=True, exist_ok=True)
        return storage

    def validate_and_save_logo(self, file: UploadFile) -> str:
        contents = file.file.read()
        size_limit = 3 * 1024 * 1024
        if len(contents) > size_limit:
            raise HTTPException(status_code=400, detail='File too large; max 3MB')
        try:
            img = Image.open(BytesIO(contents))
            _ = img.size
        except Exception:
            raise HTTPException(status_code=400, detail='Invalid image file')

        ext = os.path.splitext(file.filename)[1] or '.jpg'
        logo_fname = f"{uuid4().hex}{ext}"
        storage = self.get_logo_storage()
        with open(storage / logo_fname, 'wb') as f:
            f.write(contents)
        return logo_fname

    def list_banks(self, include_inactive: bool = False) -> List[BankRead]:
        banks = self.bank_repo.list_banks(include_inactive=include_inactive)
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
            logo_fname = self.validate_and_save_logo(file)

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
            logo_fname = self.validate_and_save_logo(file)
            update_logo = True
        elif remove_logo:
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
                        "documentLocation": d.documentLocation,
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

        if not file or not file.filename:
            raise HTTPException(status_code=400, detail='File is required')

        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ['.pdf', '.txt', '.doc', '.docx']:
            raise HTTPException(status_code=400, detail='Only PDF, TXT, DOC, and DOCX documents are accepted')

        contents = file.file.read()
        if len(contents) > 25 * 1024 * 1024:
            raise HTTPException(status_code=400, detail='Document too large; max 25MB')

        doc_fname = f"{uuid4().hex}{ext}"
        storage = self.get_document_storage()
        file_path = storage / doc_fname
        with open(file_path, 'wb') as f:
            f.write(contents)

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
            "documentLocation": doc.documentLocation,
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
        try:
            storage = self.get_document_storage()
            p = storage / doc.documentLocation
            if p.exists():
                p.unlink()
        except Exception:
            pass

        self.bank_repo.delete_document(doc)
        return {"id": document_id, "deleted": True}
