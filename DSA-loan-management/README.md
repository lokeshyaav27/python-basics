# DSA Loan Management System

Enterprise-grade Loan Aggregator & Distribution Platform featuring automated credit underwriting, partner bank product catalogs, AI-powered document intelligence, and a dedicated **Model Context Protocol (MCP)** server.

---

## 🏛️ Project Architecture

```
DSA-loan-management/
├── dsa-common/                        # 📦 Shared Python Library (Single Source of Truth)
│   ├── constants.py                   # Credit underwriting limits, FOIR/LTV benchmarks
│   ├── models/                        # 13 Unified SQLAlchemy ORM database models
│   ├── services/                      # Pure underwriting math & bank comparison engines
│   └── repositories/                  # All 5 Database Data-Access Repositories
│
├── dsa-mgmt-be/                       # 🌐 FastAPI Main Backend Service (Port :8000)
│   ├── app/
│   │   ├── api/routers/               # REST Endpoints (Auth, Loans, Banks, Products, Chat)
│   │   ├── ai/                        # Multi-agent AI Orchestrator & Groq/OpenAI integration
│   │   ├── core/                      # Application security & JWT tokens
│   │   └── services/                  # High-level HTTP business workflows
│   └── seed_full_database.py          # Master modular database seeder
│
├── dsa-mgmt-mcp/                      # 🤖 Standalone MCP Server (Port :8001)
│   ├── core/                          # JWT Auth & Role-Based Access Control (RBAC)
│   ├── rag/                           # pgvector semantic credit policy search
│   ├── tools/                         # 8 Standardized MCP Tools (@mcp.tool)
│   ├── resources/                     # Dynamic JSON catalog resources (dsa://)
│   └── server.py                      # FastMCP Application Entrypoint (SSE / Stdio)
│
└── dsa-mgmt-fe/                       # 💻 Next.js / React Frontend Application (Port :3000)
    ├── src/
    │   ├── app/                       # App router pages (Customer, Agent & Admin portals)
    │   ├── components/                # UI design system & components
    │   └── services/                  # API client integrations
```

---

## 🚀 Quick Setup & Installation (3 Steps)

### Step 1: Clone & Setup PostgreSQL Database
Ensure PostgreSQL (14+) is running on your machine with `pgvector` extension enabled:
```sql
CREATE DATABASE "dsa-mgmt";
\c "dsa-mgmt"
CREATE EXTENSION IF NOT EXISTS vector;
```

---

### Step 2: Setup Python Backend & Install `dsa-common`

```bash
# Navigate to backend directory
cd dsa-mgmt-be

# Create & activate virtual environment (Windows PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install backend dependencies (automatically installs dsa-common in editable mode)
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env

# Run database seeder (Seeds Admin, Banks, Products, Agents & Policies)
python seed_full_database.py

# Start Backend Server (:8000)
uvicorn app.main:app --reload --port 8000
```

---

### Step 3: Start the MCP Server

In a new terminal window:
```bash
# Navigate to MCP server directory
cd dsa-mgmt-mcp

# Activate virtual environment
..\dsa-mgmt-be\.venv\Scripts\Activate.ps1

# Configure environment variables
copy .env.example .env

# Start MCP Server on Port 8001 (SSE Transport)
python server.py --transport sse --port 8001
```

---

### Step 4 (Optional): Start Frontend Application

In a new terminal window:
```bash
cd dsa-mgmt-fe
npm install
npm run dev
```
Access the application at [http://localhost:3000](http://localhost:3000).

---

## 🧪 Testing & Verification

* **Verify MCP Tools & RBAC**:
  ```bash
  cd dsa-mgmt-mcp
  python tests/test_mcp_server.py
  ```
* **Verify Backend API**:
  Visit Swagger UI at [http://localhost:8000/docs](http://localhost:8000/docs).
