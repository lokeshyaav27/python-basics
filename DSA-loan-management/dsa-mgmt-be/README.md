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

## 🌱 Database Seeder

The project includes an automated database seeder (`seed_full_database.py`) that sets up the database with realistic demo data and syncs image assets.

### Run the Seeder Command
```bash
python seed_full_database.py
```

### What the Seeder Does
1. **Syncs Static Assets**: Copies product images, bank logos, and agent photos from `../dsa-loan-mgmt-images/` into `dsa-file-storage/`.
2. **Enables Vector Extension**: Executes `CREATE EXTENSION IF NOT EXISTS vector;` in PostgreSQL.
3. **Creates Tables**: Ensures all database tables are created via SQLAlchemy metadata if not already present.
4. **Cleans Existing Records**: Resets previous demo data cleanly in dependency order.
5. **Populates Core Data**:
   - **3 Products**: Home Loan, Car Loan, Personal Loan.
   - **7 Financial Institutions**: SBI, HDFC Bank, ICICI Bank, Axis Bank, PNB, Bajaj Finserv, Tata Capital.
   - **Product-Bank Links**: Bank-specific loan products with commission rates (e.g. 1.25%, 0.85%).
   - **8 Agents & Admins**: 2 Admin accounts and 6 Agent accounts with profile pictures and default passwords.
   - **Demo Loan Applications**: 6 realistic applications across distinct customers with status set to *Pending Review*.
   - **Contact Enquiries**: Sample customer inquiries and consultation requests.

---

## 🔑 Seeded Demo Credentials

Use these pre-configured credentials to test authentication in the API or Frontend portal:

### Admin Accounts
| Name | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Lokesh Admin** | `lokesh_dsa_admin@yopmail.com` | `azilen@123` | Administrator |
| **Rajesh Sharma** | `rajesh.admin@dsafinance.com` | `azilen@123` | Administrator |

### Agent Accounts
| Name | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Lokesh Agent** | `lokesh_agent@yopmail.com` | `azilen@123` | Agent |
| **Priya Verma** | `priya.verma@dsafinance.com` | `azilen@123` | Agent |
| **Amitabh Sen** | `amitabh.sen@dsafinance.com` | `azilen@123` | Agent |
| **Sneha Kulkarni** | `sneha.k@dsafinance.com` | `azilen@123` | Agent |
| **Vikram Malhotra** | `vikram.m@dsafinance.com` | `azilen@123` | Agent |
| **Ananya Roy** | `ananya.roy@dsafinance.com` | `azilen@123` | Agent |

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
│   │   └── config.py         # Application settings and environment variables
│   ├── db/
│   │   └── session.py        # SQLAlchemy engine and SessionLocal setup
│   ├── models/               # SQLAlchemy ORM models
│   ├── schemas/              # Pydantic validation and serialization schemas
│   └── main.py               # FastAPI application entrypoint & static mounts
├── dsa-file-storage/         # Static storage directory for uploads and seeded assets
│   ├── agent-photos/
│   ├── bank-documents/
│   ├── bank-logo-images/
│   └── product-images/
├── sql/
│   └── init_db.sql           # Direct raw SQL schema definitions
├── seed_full_database.py     # Master database seeding script
├── requirements.txt          # Python dependencies
├── .env.example              # Sample environment variables template
└── README.md                 # Project documentation
```

---

## 📡 API Endpoints Overview

| Endpoint Prefix | Description |
| :--- | :--- |
| `/api/auth` | Agent/Admin authentication, login, and profile info |
| `/api/products` | Loan product catalog (Home, Car, Personal loans) |
| `/api/banks` | Bank details, product-bank associations, and commission rates |
| `/api/agents` | Agent creation, management, status toggles, and assignments |
| `/api/loan-applications` | Loan application submission, status workflow, and customer tracking |
| `/api/contact` | Public contact and loan consultation inquiries |
| `/api/files` | File uploads for applicant documents and static asset handling |
| `/api/rag` | Semantic similarity search and Q&A over bank policy documents |
