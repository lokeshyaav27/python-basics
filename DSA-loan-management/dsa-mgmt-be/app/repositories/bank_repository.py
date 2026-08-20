from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.bank import Bank
from app.models.product_bank_link import ProductBankLink
from app.models.bank_document import BankDocument
from app.models.product import Product


class BankRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_banks(self, include_inactive: bool = False, product_id: Optional[int] = None) -> List[Bank]:
        query = self.db.query(Bank)
        if product_id is not None:
            query = query.join(ProductBankLink, ProductBankLink.bankId == Bank.id).filter(
                ProductBankLink.productId == product_id,
                ProductBankLink.isActive != False,
            )
        if not include_inactive:
            query = query.filter(Bank.isActive != False)
        return query.order_by(Bank.name.asc()).all()

    def get_by_id(self, bank_id: int) -> Optional[Bank]:
        return self.db.query(Bank).filter(Bank.id == bank_id).first()

    def create(
        self,
        name: str,
        is_nationalize: bool = False,
        is_private: bool = False,
        is_nbfc: bool = False,
        logo: Optional[str] = None,
    ) -> Bank:
        bank = Bank(
            name=name,
            isNationalize=is_nationalize,
            isPrivate=is_private,
            isnbfc=is_nbfc,
            logo=logo,
        )
        self.db.add(bank)
        self.db.commit()
        self.db.refresh(bank)
        return bank

    def update(
        self,
        bank: Bank,
        name: str,
        is_nationalize: bool,
        is_private: bool,
        is_nbfc: bool,
        logo: Optional[str] = None,
        update_logo: bool = False,
    ) -> Bank:
        bank.name = name
        bank.isNationalize = is_nationalize
        bank.isPrivate = is_private
        bank.isnbfc = is_nbfc
        if update_logo:
            bank.logo = logo
        self.db.add(bank)
        self.db.commit()
        self.db.refresh(bank)
        return bank

    def soft_delete(self, bank: Bank) -> Bank:
        bank.isActive = False
        self.db.add(bank)
        self.db.commit()
        return bank

    def get_product_links_with_products(self, bank_id: int) -> List[Tuple[Product, Optional[ProductBankLink]]]:
        all_products = self.db.query(Product).filter(Product.isActive != False).all()
        links = self.db.query(ProductBankLink).filter(ProductBankLink.bankId == bank_id).all()
        links_by_product_id = {link.productId: link for link in links}
        return [(p, links_by_product_id.get(p.id)) for p in all_products]

    def get_product_bank_link(self, bank_id: int, product_id: int) -> Optional[ProductBankLink]:
        return (
            self.db.query(ProductBankLink)
            .filter(ProductBankLink.bankId == bank_id, ProductBankLink.productId == product_id)
            .first()
        )

    def create_product_bank_link(self, bank_id: int, product_id: int, commission: Optional[float] = None) -> ProductBankLink:
        link = ProductBankLink(bankId=bank_id, productId=product_id, commission=commission)
        self.db.add(link)
        self.db.commit()
        self.db.refresh(link)
        return link

    def update_product_bank_link(self, link: ProductBankLink, commission: Optional[float]) -> ProductBankLink:
        link.commission = commission
        self.db.add(link)
        self.db.commit()
        self.db.refresh(link)
        return link

    def delete_product_bank_link(self, link: ProductBankLink) -> None:
        self.db.delete(link)
        self.db.commit()

    def get_documents_by_link_id(self, link_id: int) -> List[BankDocument]:
        return self.db.query(BankDocument).filter(BankDocument.productBankLinkId == link_id).all()

    def get_document_by_id(self, doc_id: int) -> Optional[BankDocument]:
        return self.db.query(BankDocument).filter(BankDocument.id == doc_id).first()

    def create_document(self, link_id: int, doc_name: str, doc_location: str) -> BankDocument:
        doc = BankDocument(
            productBankLinkId=link_id,
            documentName=doc_name,
            documentLocation=doc_location,
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def delete_document(self, doc: BankDocument) -> None:
        self.db.delete(doc)
        self.db.commit()
