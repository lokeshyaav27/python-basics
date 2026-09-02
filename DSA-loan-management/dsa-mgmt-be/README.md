# DSA Loan Management Backend (`dsa-mgmt-be`)

Robust FastAPI and PostgreSQL backend powering the **DSA (Direct Selling Agent) Loan Management Platform**. Handles product and bank catalogs, agent administration, customer loan applications, secure file storage, contact inquiries, and RAG-based vector search for bank policy documents.

Core models, underwriting math engines, and database repositories are powered by the shared [`dsa-common`](../dsa-common) package.

---

## 📋 Features

- **FastAPI Framework**: High performance async-ready RESTful APIs with auto-generated OpenAPI documentation.
- **Shared Core Domain (`dsa-common`)**: Unified models, underwriting formulas, and database repositories shared with the MCP server.
- **SQLAlchemy ORM & PostgreSQL**: Relational data modeling for products, banks, agents, commissions, and multi-category loan applications (Home, Car, Personal).
- **pgvector Vector Database**: Embeddings and semantic document search for bank policy guidelines (RAG integration).
- **Alembic Database Migrations**: Version-controlled, reproducible database schema management driven directly by `dsa_common.models.Base`.
- **Automated Full Database Seeder**: Single-command database population with demo products, banks, agents, applications, and synchronized static assets.
- **Static Asset Serving**: Built-in endpoints for product images, bank logos, agent profile photos, and uploaded loan documents.

---

## 🛠️ Prerequisites

- **Python**: Version `3.10` or higher
- **PostgreSQL**: Version `14+` with the `pgvector` extension enabled
- **Git** (optional, for version control)

---

## 🚀 Quick Start & Installation

### 1. Navigate to the backend directory
```bash
cd DSA-loan-management/dsa-mgmt-be
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

### 3. Install dependencies & `dsa-common` package
```bash
pip install -r requirements.txt
```
*(This automatically installs `dsa-common` in editable mode `-e ../dsa-common` along with FastAPI and database drivers).*

### 4. Configure Environment Variables
Copy `.env.example` to `.env` and configure your database connection string:

```bash
# Windows PowerShell / CMD:
copy .env.example .env

# macOS / Linux:
cp .env.example .env
```

Open `.env` and set your PostgreSQL connection string:
```env
DATABASE_URL=postgresql://postgres:admin@localhost:5432/dsa-mgmt
```
> **Note:** Ensure the target database (e.g. `dsa-mgmt`) exists in your PostgreSQL server before running migrations or seeding.

---

## 🗄️ Database Migrations (Alembic)

Database schema versioning and incremental table migrations are managed using **[Alembic](https://alembic.sqlalchemy.org/)** pointed directly at `dsa_common.models.Base.metadata`.

### 1. Apply Existing Migrations
```bash
alembic upgrade head
```

### 2. Generate New Migrations (When adding/modifying models in `dsa-common`)
```bash
alembic revision --autogenerate -m "describe_your_changes"
alembic upgrade head
```

---

## 🌱 Database Seeders

The platform includes modular database seeders:

```bash
# Run full seeding workflow (Admin, Products, Banks, Agents, Embeddings & Loans)
python seed_full_database.py
```

---

## 🏃 Running the Backend Server

Start the FastAPI development server with hot-reload:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Once running, access the interactive API docs:
- **Interactive Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check Endpoint**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

---

## 📁 Directory Structure

```text
dsa-mgmt-be/
├── alembic/                  # Alembic migration environment and version files
├── alembic.ini               # Alembic configuration
├── app/
│   ├── api/
│   │   └── routers/          # FastAPI Route handlers (auth, products, banks, loans, etc.)
│   ├── core/
│   │   ├── config.py         # Application settings and environment variables
│   │   ├── constants.py      # Re-exports from dsa_common.constants
│   │   └── security.py       # JWT creation, PBKDF2 hashing, and role auth dependencies
│   ├── db/
│   │   ├── db_utils.py       # Auto database creation utility
│   │   └── session.py        # SQLAlchemy engine and SessionLocal setup
│   ├── schemas/              # Pydantic validation and serialization schemas
│   ├── services/             # Application services (comparison_service, product_service, etc.)
│   ├── ai/                   # AI Orchestrator, Sub-agents & MCP client connection
│   └── main.py               # FastAPI application entrypoint & static mounts
├── dsa-file-storage/         # Static storage directory for uploads and seeded assets
├── seeds/                    # Modular database seeders
├── seed_full_database.py     # Master database seeding orchestrator
├── requirements.txt          # Python dependencies (includes -e ../dsa-common)
├── .env.example              # Sample environment variables template
└── README.md                 # Backend documentation
```
