# DSA Loan Management MCP Server (`dsa-mgmt-mcp`)

Production-grade **Model Context Protocol (MCP)** server for the DSA Loan Management Platform, implementing the open MCP specification using the official Python SDK.

Core models, underwriting math engines, and database repositories are powered by the shared [`dsa-common`](../dsa-common) package.

> 📖 **Full Architectural Guide**: See [MCP_ARCHITECTURE_GUIDE.md](./MCP_ARCHITECTURE_GUIDE.md) for sequence diagrams, client connection steps, and visual inspection using `npx @modelcontextprotocol/inspector`.

---

## 🏛️ Architecture & Highlights

* **Protocol Support**: Standard JSON-RPC 2.0 over `sse` (HTTP stream) or `stdio` (CLI/Desktop).
* **Shared Core Domain (`dsa-common`)**: Uses identical database models, repositories, and underwriting logic as the main backend.
* **Universal Compatibility**: Connects seamlessly with **Antigravity**, **Cursor**, **Claude Desktop**, and backend AI agent microservices.
* **Authentication & RBAC**:
  * Accepts signed JWT tokens (`Bearer <jwt>`) or structured auth contexts.
  * Enforces Role-Based Access Control (**Customer**, **Agent**, **Admin**).
  * Data-level ownership checks (Borrowers only inspect their own loan records; Agents only see their assigned leads).
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

## 💻 Setup & Installation

### 1. Navigate to the MCP server directory
```bash
cd DSA-loan-management/dsa-mgmt-mcp
```

### 2. Create and activate a virtual environment

- **Windows (PowerShell):**
  ```powershell
  python -m venv .venv
  .venv\Scripts\Activate.ps1
  ```
- **Windows (Command Prompt):**
  ```cmd
  python -m venv .venv
  .venv\Scripts\activate.bat
  ```
- **macOS / Linux:**
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate
  ```

*(Alternatively, you can reuse the backend virtual environment by running `..\dsa-mgmt-be\.venv\Scripts\Activate.ps1`)*

### 3. Install dependencies & `dsa-common`
```bash
pip install -r requirements.txt
```
*(This automatically installs `dsa-common` in editable mode `-e ../dsa-common` along with MCP SDK, FastMCP, and pgvector).*

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```

---

## 🚀 Running the Server

### 1. SSE HTTP Mode (Microservice on port 8001 - Recommended)
```bash
python server.py --transport sse --host 0.0.0.0 --port 8001
```
*The server will listen at `http://localhost:8001/sse` and handle JSON-RPC MCP requests from backend AI agents.*

### 2. Stdio Mode (CLI / Desktop AI Clients)
```bash
python server.py --transport stdio
```

---

## 🧪 Running Automated Tests

Run the test suite to verify token resolution, RBAC authorization, tools, and resources:

```bash
python tests/test_mcp_server.py
```
