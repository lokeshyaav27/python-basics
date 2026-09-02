import sys
import unittest
from pathlib import Path
from datetime import datetime, timedelta, timezone
import jwt

CURRENT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(CURRENT_DIR))

from core.config import mcp_config
from core.auth import resolve_auth_user, enforce_tool_rbac, enforce_record_ownership, MCPAuthError
from tools.catalog import handle_get_bank_product_catalog
from tools.policy_search import handle_search_bank_policies
from tools.directory import handle_get_agent_directory
from tools.analytics import handle_get_commission_analytics
from resources.bank_catalog import get_bank_catalog_resource, get_product_catalog_resource
from prompts.underwriting import get_underwriting_review_prompt


def generate_test_jwt(role: str, user_id: int = 1, name: str = "Test User") -> str:
    """Helper to generate signed JWT tokens for tests."""
    payload = {
        "userId": user_id,
        "id": user_id,
        "role": role,
        "name": name,
        "email": f"{role}@test.com",
        "mobile": "9999999999",
        "uniqueCustomerId": "CUST-001" if role == "customer" else None,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, mcp_config.JWT_SECRET_KEY, algorithm=mcp_config.JWT_ALGORITHM)


class TestMCPServer(unittest.TestCase):

    def setUp(self):
        self.customer_token = generate_test_jwt("customer", user_id=10, name="Customer Bob")
        self.agent_token = generate_test_jwt("agent", user_id=2, name="Agent Alice")
        self.admin_token = generate_test_jwt("admin", user_id=1, name="Admin Boss")

    def test_01_token_resolution(self):
        """Verify JWT decoding and role extraction."""
        cust_user = resolve_auth_user(auth_token=self.customer_token)
        self.assertEqual(cust_user["role"], "customer")
        self.assertEqual(cust_user["userId"], 10)

        agent_user = resolve_auth_user(auth_token=self.agent_token)
        self.assertEqual(agent_user["role"], "agent")
        self.assertEqual(agent_user["userId"], 2)

        admin_user = resolve_auth_user(auth_token=self.admin_token)
        self.assertEqual(admin_user["role"], "admin")

    def test_02_customer_rbac_denials(self):
        """Verify customer is blocked from agent directory and commissions."""
        cust_user = resolve_auth_user(auth_token=self.customer_token)
        
        # Customer should NOT have access to get_agent_directory
        with self.assertRaises(MCPAuthError):
            enforce_tool_rbac("get_agent_directory", cust_user)

        # Customer should NOT have access to get_commission_analytics
        with self.assertRaises(MCPAuthError):
            enforce_tool_rbac("get_commission_analytics", cust_user)

        # Customer should NOT have access to get_portfolio_kpis
        with self.assertRaises(MCPAuthError):
            enforce_tool_rbac("get_portfolio_kpis", cust_user)

    def test_03_customer_permitted_tools(self):
        """Verify customer is permitted for policy search, eligibility, and catalog."""
        cust_user = resolve_auth_user(auth_token=self.customer_token)
        try:
            enforce_tool_rbac("search_bank_policies", cust_user)
            enforce_tool_rbac("check_loan_eligibility", cust_user)
            enforce_tool_rbac("compare_bank_offers", cust_user)
            enforce_tool_rbac("get_bank_product_catalog", cust_user)
            enforce_tool_rbac("get_loan_dossier", cust_user)
        except MCPAuthError as e:
            self.fail(f"Customer should have access to public tools: {e}")

    def test_04_agent_permissions(self):
        """Verify agent can access commissions and leads, but not admin agent directory."""
        agent_user = resolve_auth_user(auth_token=self.agent_token)
        
        # Agent should have access to commission analytics
        try:
            enforce_tool_rbac("get_commission_analytics", agent_user)
            enforce_tool_rbac("get_contact_enquiries", agent_user)
            enforce_tool_rbac("get_portfolio_kpis", agent_user)
        except MCPAuthError as e:
            self.fail(f"Agent should have access to agent tools: {e}")

        # Agent should NOT have access to get_agent_directory
        with self.assertRaises(MCPAuthError):
            enforce_tool_rbac("get_agent_directory", agent_user)

    def test_05_admin_unrestricted(self):
        """Verify admin has unrestricted access to all 9 tools."""
        admin_user = resolve_auth_user(auth_token=self.admin_token)
        for tool in [
            "search_bank_policies", "check_loan_eligibility", "compare_bank_offers",
            "get_loan_dossier", "get_bank_product_catalog", "get_agent_directory",
            "get_commission_analytics", "get_portfolio_kpis", "get_contact_enquiries"
        ]:
            try:
                enforce_tool_rbac(tool, admin_user)
            except MCPAuthError as e:
                self.fail(f"Admin should have unrestricted access: {e}")

    def test_06_resources(self):
        """Verify MCP Resources return valid serialized JSON strings."""
        bank_res = get_bank_catalog_resource()
        self.assertIn("dsa://catalog/banks", bank_res)

        prod_res = get_product_catalog_resource()
        self.assertIn("dsa://catalog/products", prod_res)

    def test_07_prompt_templates(self):
        """Verify prompt templates render correctly."""
        prompt = get_underwriting_review_prompt(18)
        self.assertIn("Loan Application #18", prompt)
        self.assertIn("check_loan_eligibility", prompt)


if __name__ == "__main__":
    unittest.main()
