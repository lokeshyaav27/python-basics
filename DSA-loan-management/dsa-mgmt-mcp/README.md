# DSA Loan Management MCP Server (`dsa-mgmt-mcp`)

Production-grade **Model Context Protocol (MCP)** server for the DSA Loan Management Platform, implementing the open MCP specification using the official Python SDK.

---

## 🏛️ Architecture & Highlights

* **Protocol Support**: Standard JSON-RPC 2.0 over `stdio`, `sse`, or `streamable-http`.
* **Universal Compatibility**: Connects seamlessly with **Antigravity**, **Cursor**, **Claude Desktop**, and backend agent microservices.
* **Authentication & RBAC**:
  * Accepts signed JWT tokens (`Bearer <jwt>`) or structured auth contexts.
  * Enforces Role-Based Access Control (**Customer**, **Agent**, **Admin**).
  * Data-level ownership checks (Borrowers can only inspect their own loan records; Agents only see their assigned leads).
* **RAG Semantic Search**: Cosine similarity vector search over bank credit policy guidelines using `pgvector` & `sentence-transformers`.
* **Dynamic Resources**: Exposes live bank catalogs and policy documents via standard `dsa://` URI schemes.
* **Prompt Templates**: Provides standardized credit underwriting and multi-bank comparison prompts.

---

## 🛠️ Registered MCP Tools

| Tool Name | Permitted Roles | Description |
| :--- | :--- | :--- |
| `search_bank_policies` | Customer, Agent, Admin | RAG semantic vector search over bank credit policy PDFs, KYC rules, and LTV/FOIR limits. |
| `check_loan_eligibility` | Customer (own), Agent, Admin | Evaluates FOIR, LTV, EMI, net disposable income, and bank underwriting rules. |
| `compare_bank_offers` | Customer, Agent, Admin | Multi-bank quote comparison matrix with ROIs, EMIs, fees, and commissions (Agent/Admin). |
| `get_loan_dossier` | Customer (own), Agent, Admin | Unified borrower lookup, single application dossier, or agent pipeline list. |
| `get_bank_product_catalog` | Customer, Agent, Admin | Partner lending institutions, products offered, and commission slabs. |
| `get_agent_directory` | **Admin Only** | Agent roster, team workload distribution, and assigned loan volumes. |
| `get_commission_analytics` | **Agent** (own), **Admin** (all) | Realized and pipeline DSA revenue, bank-wise splits, and payouts. |
| `get_portfolio_kpis` | **Agent** (own), **Admin** (all) | High-level portfolio KPIs, status distributions, and active customer counts. |
| `get_contact_enquiries` | **Agent**, **Admin** | Public contact leads and loan consultation enquiries. |

---

## 📂 Live MCP Resources

* `dsa://catalog/banks` - Live JSON catalog of all active partner banks and institution profiles.
* `dsa://catalog/products` - Live catalog of active loan products (Home, Car, Personal Loan).
* `dsa://policies/{bank_id}` - Indexed credit policy documentation metadata for a specific bank.

---

## 📝 Prompt Templates

* `underwriting_review` - Standardized prompt for comprehensive borrower credit assessment and risk analysis.
* `compare_bank_offers` - Multi-bank rate comparison prompt for personalized borrower advisory.

---

## 🚀 How to Run

### 1. Stdio Mode (CLI / Claude Desktop / Cursor / Antigravity)
```bash
python server.py --transport stdio
```

### 2. SSE HTTP Mode (Microservice)
```bash
python server.py --transport sse --host 0.0.0.0 --port 8001
```

---

## ⚙️ Connecting to Claude Desktop / Cursor / Antigravity

Add the following to your `claude_desktop_config.json` or Antigravity IDE configuration:

```json
{
  "mcpServers": {
    "dsa-loan-management": {
      "command": "python",
      "args": [
        "-m",
        "server",
        "--transport",
        "stdio"
      ],
      "cwd": "C:/Users/lokeshyadav/Documents/Lokesh\Projects/learning/python-basics/DSA-loan-management/dsa-mgmt-mcp",
      "env": {
        "PYTHONPATH": "C:/Users/lokeshyadav/Documents/Lokesh/Projects/learning/python-basics/DSA-loan-management/dsa-mgmt-be;C:/Users/lokeshyadav/Documents/Lokesh/Projects/learning/python-basics/DSA-loan-management/dsa-mgmt-mcp"
      }
    }
  }
}
```

---

## 🧪 Running Tests

```bash
python tests/test_mcp_server.py
```
