# 🐍 Python Packages Guide (DSA Loan Management Backend)

This document provides a comprehensive explanation of every important Python package used in the `dsa-mgmt-be` backend, why it was chosen, and how it is used in the project.

---

## 📋 Table of Contents
1. [Core Web Framework & ASGI Server](#1-core-web-framework--asgi-server)
   - `fastapi`
   - `uvicorn`
2. [Data Validation & Settings Management](#2-data-validation--settings-management)
   - `pydantic`
   - `pydantic-settings`
3. [Database & Migrations](#3-database--migrations)
   - `SQLAlchemy`
   - `alembic`
   - `psycopg2-binary`
4. [Security, Auth & File Processing](#4-security-auth--file-processing)
   - `pyjwt`
   - `python-multipart`
   - `Pillow (PIL)`
   - `python-dotenv`
5. [AI, Vector Search & RAG](#5-ai-vector-search--rag)
   - `groq`
   - `sentence-transformers`
   - `PyMuPDF (fitz)`
   - `pgvector`
6. [Testing](#6-testing)
   - `pytest` & `fastapi.testclient`

---

## 1. Core Web Framework & ASGI Server

### 🚀 `fastapi`
- **What is it?**: A modern, high-performance, asynchronous web framework for building APIs with Python based on standard Python type hints.
- **Why we use it**:
  - Extremely fast execution speed (comparable to NodeJS and Go).
  - Automatic Interactive Swagger UI (`/swagger`) and ReDoc (`/redoc`) documentation generation.
  - Built-in Dependency Injection system (`Depends()`) for clean architecture.
  - Native integration with Pydantic for request validation and response serialization.
- **Where in our project**: Used across all routers in `app/api/routers/` and `app/main.py`.

```python
# Example from app/main.py
from fastapi import FastAPI
app = FastAPI(title="DSA Management API", version="1.0.0")
```

---

### ⚡ `uvicorn`
- **What is it?**: An ultra-fast ASGI (Asynchronous Server Gateway Interface) web server implementation for Python.
- **Why we use it**:
  - FastAPI is a framework/application, but it requires an ASGI server like Uvicorn to listen on network ports (e.g. `http://localhost:8000`), receive raw HTTP requests, and pass them to FastAPI.
  - Supports hot-reloading during development (`--reload`).
- **Where in our project**: Used in `run_server.py` or command line: `uvicorn app.main:app --reload --port 8000`.

---

## 2. Data Validation & Settings Management

### 🛡️ `pydantic`
- **What is it?**: Data validation and parsing library using Python type annotations.
- **Why we use it**:
  - Enforces type safety at runtime.
  - Automatically parses incoming JSON request bodies into strongly-typed Python objects.
  - If a user sends invalid data (e.g., a string instead of an integer, or a missing required field), Pydantic automatically generates descriptive 422 Unprocessable Entity error messages.
- **Where in our project**: Defined in `app/schemas/` (e.g., `app/schemas/product.py`, `app/schemas/bank.py`, `app/schemas/chat.py`).

```python
# Example from app/schemas/product.py
from pydantic import BaseModel

class ProductRead(BaseModel):
    id: int
    name: str
    description: str
    image: str | None = None
    isActive: bool = True
    
    class Config:
        from_attributes = True  # Allows conversion from SQLAlchemy ORM models
```

---

### ⚙️ `pydantic-settings`
- **What is it?**: Extension of Pydantic for loading and validating environment variables from `.env` files and OS environment.
- **Why we use it**:
  - Guarantees that essential configuration (like `DATABASE_URL`, `JWT_SECRET_KEY`, `GROQ_API_KEY`) is present and valid before the application boots up.
- **Where in our project**: `app/core/config.py`.

```python
# Example from app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    GROQ_API_KEY: str | None = None

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 3. Database & Migrations

### 🗄️ `SQLAlchemy`
- **What is it?**: The standard Object Relational Mapper (ORM) and SQL toolkit for Python.
- **Why we use it**:
  - Allows querying and manipulating the PostgreSQL database using Python classes and methods instead of writing raw SQL strings.
  - Manages database connection pools, transactions, commits, and rollbacks.
  - Defines table schemas in Python (`Base.metadata`).
- **Where in our project**: `app/models/` (table models), `app/db/session.py` (engine and session), and `app/repositories/` (database queries).

```python
# Example from app/repositories/product_repository.py
def list_products(self, include_inactive: bool = False):
    query = self.db.query(Product)
    if not include_inactive:
        query = query.filter(Product.isActive != False)
    return query.order_by(Product.id.asc()).all()
```

---

### 🔄 `alembic`
- **What is it?**: Database migration tool built specifically for SQLAlchemy.
- **Why we use it**:
  - Tracks versioned changes to the database schema over time (like Git for your database).
  - Inspects differences between your Python models (`Base.metadata`) and the live PostgreSQL database (`alembic revision --autogenerate`).
  - Safely upgrades or downgrades database tables without losing existing data.
- **Where in our project**: `alembic.ini`, `alembic/env.py`, and `alembic/versions/`.

---

### 🔌 `psycopg2-binary`
- **What is it?**: The low-level PostgreSQL database adapter/driver for Python.
- **Why we use it**:
  - SQLAlchemy doesn't speak directly to PostgreSQL over TCP/IP; it relies on `psycopg2` under the hood to send raw wire protocol commands to PostgreSQL.
- **Where in our project**: Referenced automatically by the connection string `postgresql://...` in `app/core/config.py`.

---

## 4. Security, Auth & File Processing

### 🔑 `pyjwt`
- **What is it?**: Python implementation of JSON Web Tokens (JWT).
- **Why we use it**:
  - Generates secure, cryptographically signed access tokens when Admins, Agents, or Customers log in.
  - Decodes and validates tokens on incoming API requests to identify the user and their role (`admin`, `agent`, `customer`).
- **Where in our project**: `app/core/security.py` and `app/services/auth_service.py`.

```python
# Example from app/core/security.py
encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
```

---

### 📁 `python-multipart`
- **What is it?**: Streaming multipart/form-data parser for Python.
- **Why we use it**:
  - Required by FastAPI to handle file uploads (`UploadFile`, `File(...)`) and form fields (`Form(...)`) in HTTP POST/PUT requests.
- **Where in our project**: Used in `app/api/routers/products.py`, `banks.py`, `agents.py` for uploading photos and PDFs.

---

### 🖼️ `Pillow (PIL)`
- **What is it?**: The Python Imaging Library for image processing.
- **Why we use it**:
  - Validates image dimensions, checks aspect ratios (e.g. enforcing 2:3 ratio for product banner cards), inspects file sizes, and verifies that uploaded files are valid image formats (PNG/JPEG/WebP).
- **Where in our project**: `app/core/storage.py`.

```python
# Example from app/core/storage.py
img = Image.open(BytesIO(contents))
width, height = img.size
ratio = width / height
```

---

### 🌐 `python-dotenv`
- **What is it?**: Reads key-value pairs from a `.env` file and sets them as environment variables.
- **Why we use it**:
  - Keeps secrets, database passwords, and API keys out of source code.
- **Where in our project**: Used by Alembic (`alembic/env.py`) and seed scripts (`seeds/`).

---

## 5. AI, Vector Search & RAG

### 🤖 `groq`
- **What is it?**: The official Python client for Groq Cloud LPU (Language Processing Unit) inference.
- **Why we use it**:
  - Powers the Conversational AI Underwriter chatbot (`/api/chat/assistant`) using ultra-low latency LLMs (`openai/gpt-oss-120b`).
- **Where in our project**: `app/ai/client.py`, `app/ai/chat_service.py`, and `app/ai/explainer.py`.

---

### 🧠 `sentence-transformers`
- **What is it?**: State-of-the-art framework for generating dense vector embeddings from text.
- **Why we use it**:
  - Converts chunks of bank loan policy documents into 384-dimensional dense semantic vectors (`all-MiniLM-L6-v2`) for semantic search and RAG.
- **Where in our project**: `app/rag/embeddings.py` and `app/rag/service.py`.

---

### 📄 `PyMuPDF (fitz)`
- **What is it?**: High-performance library for reading, extracting, and parsing PDF documents.
- **Why we use it**:
  - When an admin uploads a bank loan policy PDF, PyMuPDF extracts the raw text page-by-page so it can be chunked and indexed into the vector database.
- **Where in our project**: `app/rag/text_extractor.py` and `app/rag/service.py`.

---

### 📐 `pgvector`
- **What is it?**: PostgreSQL extension and Python ORM integration for vector similarity search.
- **Why we use it**:
  - Stores high-dimensional document embeddings directly in PostgreSQL and performs exact or approximate nearest-neighbor cosine similarity queries (`<=>`).
- **Where in our project**: `app/models/document_chunk.py` and `app/rag/service.py`.

---

## 6. Testing

### 🧪 `pytest` & `fastapi.testclient`
- **What is it?**: Testing framework (`pytest`) and HTTP in-memory test runner (`TestClient` based on `httpx`/`starlette`).
- **Why we use it**:
  - Executes end-to-end automated tests against the FastAPI application without needing to start an external web server.
- **Where in our project**: Automated verification scripts.

---

## 📊 Summary Cheat Sheet

| Package | Category | Primary Responsibility |
| :--- | :--- | :--- |
| **`fastapi`** | Web API | HTTP routing, dependency injection, OpenAPI documentation |
| **`uvicorn`** | ASGI Server | Async HTTP server running FastAPI |
| **`pydantic`** | Validation | Request body parsing, type safety, JSON serialization |
| **`pydantic-settings`** | Configuration | Type-safe `.env` configuration loader |
| **`SQLAlchemy`** | Database ORM | Python object-to-relational database mapping & queries |
| **`alembic`** | DB Migrations | Tracking database schema changes and migrations |
| **`psycopg2-binary`** | DB Driver | PostgreSQL low-level communication driver |
| **`pyjwt`** | Security | JWT authentication token issuance and verification |
| **`python-multipart`** | File Uploads | Parsing `multipart/form-data` for file uploads |
| **`Pillow`** | Image Processing | Image aspect ratio, size, and format validation |
| **`groq`** | LLM Inference | High-speed AI Chat Assistant & underwriting reasoning |
| **`sentence-transformers`**| Embeddings | Converting policy text to dense vector embeddings |
| **`PyMuPDF`** | PDF Parsing | Extracting text from uploaded bank policy PDFs |
| **`pgvector`** | Vector DB | Storing & querying vector embeddings in PostgreSQL |
