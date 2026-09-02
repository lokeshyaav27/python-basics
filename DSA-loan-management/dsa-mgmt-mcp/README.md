# DSA Loan Management MCP Server (`dsa-mgmt-mcp`)

Production-grade **Model Context Protocol (MCP)** server for the DSA Loan Management Platform, implementing the open MCP specification using the official Python SDK.

> 📖 **Full Architectural Guide**: See [MCP_ARCHITECTURE_GUIDE.md](./MCP_ARCHITECTURE_GUIDE.md) for sequence diagrams, client connection steps, and visual inspection using `npx @modelcontextprotocol/inspector`.

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

## 💻 Setup & Installation

### Option 1: Dedicated Virtual Environment inside `dsa-mgmt-mcp` (Recommended)

1. Open PowerShell and navigate to the directory:
   ```powershell
   cd C:\Users\lokeshyadav\Documents\Lokesh\Projects\learning\python-basics\DSA-loan-management\dsa-mgmt-mcp
   ```

2. Create a dedicated virtual environment:
   ```powershell
   python -m venv .venv
   ```

3. Activate the environment:
   * **PowerShell:**
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
     *(If script execution is disabled on your machine, run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` once)*
   * **Command Prompt (CMD):**
     ```cmd
     .\.venv\Scripts\activate.bat
     ```

4. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

---

### Option 2: Reusing the Backend Virtual Environment (`dsa-mgmt-be/.venv`)

If you prefer to share the existing `.venv` without downloading packages again:

```powershell
cd C:\Users\lokeshyadav\Documents\Lokesh\Projects\learning\python-basics\DSA-loan-management\dsa-mgmt-mcp
..\dsa-mgmt-be\.venv\Scripts\Activate.ps1
```

---

## 🚀 Running the Server

### 1. SSE HTTP Mode (Microservice on port 8001)
```powershell
python server.py --transport sse --host 0.0.0.0 --port 8001
```
*The server will listen at `http://localhost:8001/sse` and handle JSON-RPC MCP requests.*

### 2. Stdio Mode (CLI / Desktop AI Clients)
```powershell
python server.py --transport stdio
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
      "cwd": "C:/Users/lokeshyadav/Documents/Lokesh/Projects/learning/python-basics/DSA-loan-management/dsa-mgmt-mcp",
      "env": {
        "PYTHONPATH": "C:/Users/lokeshyadav/Documents/Lokesh/Projects/learning/python-basics/DSA-loan-management/dsa-mgmt-be;C:/Users/lokeshyadav/Documents/Lokesh/Projects/learning/python-basics/DSA-loan-management/dsa-mgmt-mcp"
      }
    }
  }
}
```

---

## 🧪 Running Automated Tests

Run the test suite to verify token resolution, RBAC authorization, tools, and resources:

```powershell
python tests/test_mcp_server.py
```
