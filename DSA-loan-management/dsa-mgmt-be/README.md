# DSA Loan Management Backend (`dsa-mgmt-be`)

Robust FastAPI and PostgreSQL backend powering the **DSA (Direct Selling Agent) Loan Management Platform**. Handles product and bank catalogs, agent administration, customer loan applications, secure file storage, contact inquiries, and RAG-based vector search for bank policy documents.

---

## 📋 Features

- **FastAPI Framework**: High performance async-ready RESTful APIs with auto-generated OpenAPI documentation.
- **SQLAlchemy ORM & PostgreSQL**: Relational data modeling for products, banks, agents, commissions, and multi-category loan applications (Home, Car, Personal).
- **pgvector Vector Database**: Embeddings and semantic document search for bank policy guidelines (RAG integration).
- **Alembic Database Migrations**: Version-controlled, reproducible database schema management.
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

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

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

Database schema changes in this project are tracked and managed using **[Alembic](https://alembic.sqlalchemy.org/)**.

### How Database Migration Works

1. **Model Discovery**: SQLAlchemy models defined in `app/models/` inherit from `Base` (`app/models/base.py`). The Alembic environment configuration (`alembic/env.py`) imports all models (`app.models`) and binds `Base.metadata` to track table schemas.
2. **Version Scripts**: Each migration script inside `alembic/versions/` contains an `upgrade()` function (applying changes) and a `downgrade()` function (reverting changes).
3. **Database Tracking**: Alembic automatically creates and maintains an `alembic_version` table in PostgreSQL to track which migration revisions have been executed.

### Common Migration Commands

> Ensure your virtual environment is active and your current working directory is `DSA-loan-management/dsa-mgmt-be`.

#### 1. Generate a New Migration (Autogenerate from Models)
When you modify or add SQLAlchemy models in `app/models/`, generate a new migration script:
```bash
alembic revision --autogenerate -m "describe_your_changes_here"
```
*(Example: `alembic revision --autogenerate -m "add_status_to_loan_application"`)*

#### 2. Apply Migrations to the Database
Apply all pending migrations to bring the database schema to the latest version:
```bash
alembic upgrade head
```

#### 3. Roll Back Migrations
- Revert the most recent migration:
  ```bash
  alembic downgrade -1
  ```
- Revert all migrations back to the initial state:
  ```bash
  alembic downgrade base
  ```

#### 4. Check Current Migration Status & History
- View the currently applied revision:
  ```bash
  alembic current
  ```
- View migration history log:
  ```bash
  alembic history --verbose
  ```

---

## 🌱 Database Seeders

The platform uses a **modular seeder architecture** located under the `seeds/` directory, managed by a master orchestrator (`seed_full_database.py`). 

Instead of a single monolithic script, the database seeding has been broken down into **5 small, independent seeders**. In `seed_full_database.py`, each seeder step is invoked as an isolated function call, allowing you to easily **comment out or disable any step** that is not needed for your current environment.

---

### 1. Master Seeder Orchestrator (`seed_full_database.py`)

You can run the full database seeding workflow all-at-once:

#### Windows (PowerShell):
```powershell
.\.venv\Scripts\python.exe seed_full_database.py
```

#### Windows (Command Prompt):
```cmd
.venv\Scripts\python.exe seed_full_database.py
```

#### macOS / Linux:
```bash
source .venv/bin/activate
python seed_full_database.py
```

#### 💡 Customizing / Disabling Specific Seed Steps
If you only need certain tables seeded (e.g. only Admin and Products/Banks without demo loan applications), simply open `seed_full_database.py` and **comment out** the unwanted function calls:

```python
# 1. Seed Only One Admin User
admin = seed_admin()

# 2. Seed Products & Banks
products, banks = seed_products_banks()

# 3. Seed Agents (Comment out if not needed)
# agents = seed_agents()

# 4. Seed Product-Bank Mapping & Vector Embeddings (Comment out if not needed)
# links = seed_product_bank_mapping()

# 5. Seed Loan Applications (Comment out if not needed)
# apps = seed_loan_applications()
```

---

### 2. Run Individual Modular Seeders Directly

Each seeder script in the `seeds/` directory is completely standalone and can be executed individually from the command line:

| Step | Script | Description & Static Assets Handled | Standalone Command |
| :---: | :--- | :--- | :--- |
| **1** | `seeds/seed_1_admin.py` | **Default Admin Only**: Seeds 1 primary admin (`lokesh_dsa_admin@yopmail.com`) and copies `user-01.png`. | `python seeds/seed_1_admin.py` |
| **2** | `seeds/seed_2_products_banks.py` | **Products & Banks**: Seeds 3 Products (Home, Car, Personal) & 7 Institutions (5 Banks + 2 NBFCs), copying product images and bank logos. | `python seeds/seed_2_products_banks.py` |
| **3** | `seeds/seed_3_agents.py` | **DSA Agents**: Seeds 6 regular DSA Agents + 1 secondary admin with encrypted passwords, copying `user-02.png` to `user-08.png`. | `python seeds/seed_3_agents.py` |
| **4** | `seeds/seed_4_product_bank_mapping.py` | **Product-Bank Mapping & Vectors**: Maps products to banks with commissions and indexes bank policy PDFs into `pgvector`. | `python seeds/seed_4_product_bank_mapping.py` |
| **5** | `seeds/seed_5_loan_applications.py` | **Loan Applications**: Seeds 17 realistic applications across 8 unique customers in *Pending Review* status with linked financial details. | `python seeds/seed_5_loan_applications.py` |

---

## 🏃 Running the Application

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
├── alembic/                  # Alembic migration environment and versions
│   ├── versions/             # Auto-generated revision migration files
│   └── env.py                # Alembic runtime execution configuration
├── alembic.ini               # Alembic settings configuration file
├── app/
│   ├── api/
│   │   └── routers/          # FastAPI Route handlers (auth, products, banks, loans, etc.)
│   ├── core/
│   │   ├── config.py         # Application settings and environment variables
│   │   └── security.py       # JWT creation, PBKDF2 hashing, and role auth dependencies
│   ├── db/
│   │   └── session.py        # SQLAlchemy engine and SessionLocal setup
│   ├── models/               # SQLAlchemy ORM models
│   ├── schemas/              # Pydantic validation and serialization schemas
│   ├── services/             # Underwriting, MCP tools, pgvector RAG, and Groq chat services
│   └── main.py               # FastAPI application entrypoint & static mounts
├── dsa-file-storage/         # Static storage directory for uploads and seeded assets
│   ├── agent-photos/
│   ├── bank-documents/
│   ├── bank-logo-images/
│   └── product-images/
├── seeds/                    # Modular database seeders
│   ├── seed_1_admin.py               # 1. Primary admin seeder
│   ├── seed_2_products_banks.py      # 2. Products and banks seeder
│   ├── seed_3_agents.py              # 3. DSA agents seeder
│   ├── seed_4_product_bank_mapping.py# 4. Product-bank links & RAG vector indexer
│   └── seed_5_loan_applications.py   # 5. Customer loan applications seeder
├── sql/
│   └── init_db.sql           # Direct raw SQL schema definitions
├── seed_full_database.py     # Master database seeding orchestrator
├── requirements.txt          # Python dependencies
├── .env.example              # Sample environment variables template
└── README.md                 # Project documentation
```

---

## 📡 API Endpoints Overview

| Endpoint Prefix | Description | Auth Requirement |
| :--- | :--- | :--- |
| `/api/auth` | Agent/Admin login, Customer OTP verification, and profile lookup | Public / Bearer Token |
| `/api/products` | Loan product catalog (Home, Car, Personal loans) | Public (Read) / Admin (Write) |
| `/api/banks` | Partner banks & NBFCs, product mapping, document upload | Public (Read) / Admin (Write) |
| `/api/agents` | Agent creation, management, status toggles, and assignments | Admin / Agent (Profile) |
| `/api/loan-applications` | Loan application submission, workflow status, and customer tracking | Scoped Role Auth |
| `/api/contact` | Public contact and loan consultation inquiries | Public (Post) / Admin (Manage) |
| `/api/comparison` | Multi-bank loan comparison with CIBIL-to-ROI and DSA commissions | Admin / Agent / Customer |
| `/api/eligibility` | Multi-factor underwriting calculator & natural language explanations | Admin / Agent / Customer |
| `/api/mcp` | Model Context Protocol tools & pgvector semantic search | Admin / Agent / Customer |
| `/api/chat` | AI Underwriter Conversational Assistant powered by Groq LLM | Admin / Agent / Customer |
| `/api/files` | File storage and static asset serving | Public |
