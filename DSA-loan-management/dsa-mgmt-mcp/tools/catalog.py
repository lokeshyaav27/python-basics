import logging
from typing import Dict, Any, Optional
from db.session import get_db_session
from core.auth import resolve_auth_user, enforce_tool_rbac
from dsa_common.models import Bank, Product, ProductBankLink, BankDocument

logger = logging.getLogger("mcp_tools.catalog")


def handle_get_bank_product_catalog(
    product_id: Optional[int] = None,
    bank_id: Optional[int] = None,
    auth_token: Optional[str] = None,
    auth_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Fetches partner bank and product catalogs. Can retrieve:
    (1) all partner banks offering a specific loan product (pass product_id),
    (2) a bank's detailed profile and commission structure (pass bank_id), or
    (3) all active loan products and partner lending institutions.
    """
    logger.info(f"🔹 [get_bank_product_catalog] Request with ProductId={product_id}, BankId={bank_id}")

    user = resolve_auth_user(auth_token=auth_token, auth_context=auth_context)
    enforce_tool_rbac("get_bank_product_catalog", user)

    role = user.get("role", "customer")
    show_comm = role in ["admin", "agent"]
    logger.debug(f"ℹ️ [get_bank_product_catalog] Caller Role='{role}' | Show Commissions: {show_comm}")

    with get_db_session() as db:
        # Case 1: Specific Bank Profile & Commission Slab Lookup
        if bank_id is not None and int(bank_id) > 0:
            logger.debug(f"🔍 [get_bank_product_catalog] Looking up Bank #{bank_id}")
            bank = db.query(Bank).filter(Bank.id == int(bank_id)).first()
            if not bank:
                logger.error(f"❌ [get_bank_product_catalog] Bank #{bank_id} not found.")
                raise ValueError(f"Bank #{bank_id} not found.")

            links = db.query(ProductBankLink).filter(ProductBankLink.bankId == int(bank_id)).all()
            products_offered = []
            for l in links:
                item = {
                    "productId": l.productId,
                    "productName": l.product.name if l.product else None,
                }
                if show_comm:
                    item["dsaCommissionPct"] = float(l.commission) if l.commission is not None else None
                products_offered.append(item)

            logger.info(f"✅ [get_bank_product_catalog] Bank '{bank.name}' offers {len(products_offered)} loan products.")
            return {
                "catalogType": "single_bank",
                "bankId": bank.id,
                "bankName": bank.name,
                "isNationalize": bank.isNationalize,
                "isPrivate": bank.isPrivate,
                "isNbfc": bank.isNbfc,
                "productsOffered": products_offered,
            }

        # Case 2: Banks by Specific Product
        if product_id is not None and int(product_id) > 0:
            logger.debug(f"🔍 [get_bank_product_catalog] Querying partner banks offering Product #{product_id}")
            product = db.query(Product).filter(Product.id == int(product_id)).first()
            links = (
                db.query(ProductBankLink, Bank)
                .join(Bank, Bank.id == ProductBankLink.bankId)
                .filter(ProductBankLink.productId == int(product_id), Bank.isActive != False)
                .all()
            )

            banks_list = []
            for link, bank in links:
                doc_count = db.query(BankDocument).filter(BankDocument.productBankLinkId == link.id).count()
                item = {
                    "bankId": bank.id,
                    "bankName": bank.name,
                    "isNationalize": bank.isNationalize,
                    "isPrivate": bank.isPrivate,
                    "isNbfc": bank.isNbfc,
                    "hasPolicyDocs": doc_count > 0,
                }
                if show_comm:
                    item["dsaCommissionPct"] = float(link.commission) if link.commission is not None else None
                if link.policyParameters:
                    item["policyParameters"] = link.policyParameters
                banks_list.append(item)

            logger.info(f"✅ [get_bank_product_catalog] Product '{product.name if product else product_id}' offered by {len(banks_list)} banks.")
            return {
                "catalogType": "product_banks",
                "productId": product_id,
                "productName": product.name if product else None,
                "totalPartnerBanks": len(banks_list),
                "partnerBanks": banks_list,
            }

        # Case 3: Complete Platform Catalog (All Products & Banks)
        logger.debug("🔍 [get_bank_product_catalog] Fetching complete platform product and bank catalog...")
        products = db.query(Product).filter(Product.isActive != False).order_by(Product.id.asc()).all()
        banks = db.query(Bank).filter(Bank.isActive != False).order_by(Bank.id.asc()).all()

        logger.info(f"✅ [get_bank_product_catalog] Full catalog returned: {len(products)} products, {len(banks)} active banks.")
        return {
            "catalogType": "full_catalog",
            "totalProducts": len(products),
            "products": [{"id": p.id, "name": p.name, "description": p.description} for p in products],
            "totalBanks": len(banks),
            "banks": [
                {
                    "id": b.id,
                    "name": b.name,
                    "isNationalize": b.isNationalize,
                    "isPrivate": b.isPrivate,
                    "isNbfc": b.isNbfc,
                }
                for b in banks
            ],
        }
