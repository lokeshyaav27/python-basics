# 🔄 API Execution Flow Guide (Clean 3-Tier Architecture)

This document provides a step-by-step sequential breakdown of how an API request flows through the `dsa-mgmt-be` backend, specifying every file involved at each step.

---

## 🏛️ 1. The Clean 3-Tier Architectural Lifecycle

Whenever an HTTP request arrives from the frontend or an API client, it flows through a strict, predictable chain of layers:

```
[1. Client / Frontend]
        │  HTTP Request (e.g. POST /api/products)
        ▼
[2. ASGI Web Server (Uvicorn)]
        │  Passes request to ASGI App
        ▼
[3. Main Application Entrypoint: app/main.py]
        │  CORS Middleware, Static Mounts, Global Exception Handlers
        ▼
[4. Security & Authentication: app/core/security.py]
        │  Extracts JWT Bearer Token, validates signature & checks role (@require_role)
        ▼
[5. Controller / Router Layer: app/api/routers/<feature>.py]
        │  Parses HTTP params/form data, calls Dependency Injection (Depends(get_service))
        ▼
[6. Service Layer: app/services/<feature>_service.py]
        │  Executes Business Logic (validations, file storage, password hashing, RAG)
        ▼
[7. Repository Layer: app/repositories/<feature>_repository.py]
        │  Executes Database Operations via SQLAlchemy ORM (db.query, db.add, db.commit)
        ▼
[8. Database Layer: PostgreSQL Database]
        │  Executes SQL Queries & returns rows
        ▼
[9. Response Formatter: app/core/response.py]
        │  Wraps data into standardized JSON Envelope { success, statusCode, message, result }
        ▼
[10. HTTP 200/201 Response sent back to Client]
```

---

## 🔍 2. Detailed Execution Flows by Example

---

### 🔹 Example 1: Create Product API (`POST /api/products`)

This endpoint creates a new loan product with an uploaded banner image.

```
Step 1: Client Request
   └─ Client sends multipart/form-data:
      - name: "Home Loan"
      - description: "Low interest home loans"
      - file: <binary image bytes>
      - Header: Authorization: Bearer <Admin JWT Token>

Step 2: Server & Router Routing
   └─ File: app/main.py
      └─ Matches prefix "/api/products" -> forwards to app/api/routers/products.py

Step 3: Role & Auth Verification
   └─ File: app/core/security.py
      └─ Function: require_role(["admin"])
      └─ Decodes JWT token, verifies signature and checks if user is Admin.
      └─ Returns CurrentUser object.

Step 4: Controller Invocation & Dependency Injection
   └─ File: app/api/routers/products.py
      └─ Function: create_product(name, description, file, current_user, product_service)
      └─ Injects get_db() from app/db/session.py -> creates ProductRepository -> creates ProductService.
      └─ Calls product_service.create_product(name, description, file).

Step 5: Business Logic & Image Validation
   └─ File: app/services/product_service.py
      └─ Calls validate_and_save_image(file, subfolder="product-images", target_ratio=2/3)
      └─ File: app/core/storage.py
         ├─ Reads file bytes and checks size (<= 3MB).
         ├─ Uses Pillow (PIL.Image) to verify valid image format.
         ├─ Validates 2:3 aspect ratio (width / height ~ 0.67).
         └─ Saves binary to dsa-file-storage/product-images/<uuid>.jpg.

Step 6: Database Insertion
   └─ File: app/repositories/product_repository.py
      └─ Function: create(name, description, image_filename)
      └─ Instantiates SQLAlchemy model Product(name=..., description=..., image=...)
      └─ Executes:
         db.add(product)
         db.commit()
         db.refresh(product)

Step 7: Schema Serialization
   └─ File: app/schemas/product.py
      └─ Converts ORM model to Pydantic schema ProductRead.from_orm(product).

Step 8: Response Envelope
   └─ File: app/core/response.py
      └─ Wraps into standard response:
         {
           "success": true,
           "statusCode": 201,
           "message": "Product created successfully",
           "result": { "id": 1, "name": "Home Loan", "image": "abc.jpg", ... }
         }
```

---

### 🔹 Example 2: Customer OTP Login (`POST /api/auth/customer/verify-otp`)

This endpoint verifies a mobile OTP and logs the customer into the platform.

```
Step 1: Client Request
   └─ Client sends JSON: { "mobile": "9876543210", "otp": "123456" }
   └─ Target: POST /api/auth/customer/verify-otp

Step 2: Router Matching
   └─ File: app/main.py
      └─ Matches prefix "/api/auth" -> forwards to app/api/routers/auth.py

Step 3: Controller Invocation
   └─ File: app/api/routers/auth.py
      └─ Function: verify_customer_otp(payload, auth_service)
      └─ Injects AuthService via Depends(get_auth_service)
      └─ Calls auth_service.verify_customer_otp(mobile, otp)

Step 4: Business Logic & OTP Verification
   └─ File: app/services/auth_service.py
      └─ Checks OTP against development or SMS provider OTP.
      └─ If valid, queries existing loan applications for this mobile number:
         └─ Calls loan_app_repo.get_by_mobile(mobile)
         └─ File: app/repositories/loan_application_repository.py
            └─ Executes db.query(LoanApplication).filter(LoanApplication.mobile == mobile).first()

Step 5: JWT Token Generation
   └─ File: app/core/security.py
      └─ Function: create_access_token(data={ "sub": "customer_9876543210", "role": "customer", "mobile": "9876543210", ... })
      └─ Signs payload with JWT_SECRET_KEY and expiration time.

Step 6: Response Formatting
   └─ File: app/core/response.py
      └─ Returns:
         {
           "success": true,
           "statusCode": 200,
           "message": "Customer verified and logged in successfully",
           "result": {
             "accessToken": "eyJhbGciOi...",
             "tokenType": "bearer",
             "user": { "role": "customer", "name": "Customer", "mobile": "9876543210" }
           }
         }
```

---

### 🔹 Example 3: Full Public Loan Application Flow (`POST /api/loan-applications/apply`)

This endpoint submits a complete multi-step loan wizard with general details and product-specific sub-records (Home/Car/Personal).

```
Step 1: Client Request
   └─ Client sends JSON with:
      - productId: 1
      - name, email, mobile
      - clientGeneralDetails: { age, monthly_income, cibil_score, ... }
      - homeLoanDetails: { property_value, property_location, ... }

Step 2: Controller & Service
   └─ File: app/api/routers/loan_applications.py
      └─ Function: submit_full_loan_application(payload, loan_app_service)
      └─ Calls loan_app_service.submit_full_loan_application(payload)

Step 3: Service Orchestration
   └─ File: app/services/loan_application_service.py
      ├─ 1. Calls loan_app_repo.create_client_general_detail(payload.clientGeneralDetails)
      │     └─ File: app/repositories/loan_application_repository.py
      │     └─ Inserts row into client_general_details table.
      │
      ├─ 2. Calls loan_app_repo.create_home_loan_detail(payload.homeLoanDetails)
      │     └─ File: app/repositories/loan_application_repository.py
      │     └─ Inserts row into home_loan_details table.
      │
      └─ 3. Calls loan_app_repo.create_application(...)
            └─ File: app/repositories/loan_application_repository.py
            └─ Inserts parent row into loan_applications table with foreign keys:
               - client_general_detail_id
               - home_loan_detail_id
               - product_id
            └─ db.commit()

Step 4: Serialization & Response
   └─ File: app/services/loan_application_service.py -> serialize(app)
   └─ File: app/core/response.py -> returns 201 Created envelope.
```

---

### 🔹 Example 4: AI Underwriter Chat Assistant (`POST /api/chat/assistant`)

This endpoint combines LLM reasoning, pgvector RAG semantic search, and deterministic MCP underwriting tools.

```
Step 1: Client Request
   └─ Client sends: { "message": "Can I get a home loan of 50 Lakhs with 80,000 salary and 750 CIBIL?", "history": [...] }
   └─ Header: Authorization: Bearer <Customer/Agent/Admin Token>

Step 2: Controller & Authentication
   └─ File: app/api/routers/chat.py
      └─ Function: chat_with_loan_assistant(req, current_user, db)
      └─ Injects current_user context (role, userId, mobile) into req.authContext.
      └─ Calls process_chat_conversation(db=db, request=req)

Step 3: Chat Orchestrator
   └─ File: app/services/chat_orchestrator.py
      └─ Function: process_chat_conversation(db, request)
      ├─ Step A: Intent Classification & System Prompt Setup
      │
      ├─ Step B: RAG Policy Retrieval (if policy query)
      │  └─ File: app/services/rag_service.py
      │     └─ Generates query embedding via sentence-transformers
      │     └─ Queries document_chunks table in PostgreSQL using pgvector <=> operator
      │     └─ Returns top relevant policy chunks from partner banks
      │
      ├─ Step C: MCP Tool Execution (if calculation query)
      │  └─ File: app/services/mcp_dsa_tools.py / app/services/mcp_eligibility_tool.py
      │     └─ Computes FOIR, LTV, maximum eligible loan amount, and ROI
      │
      └─ Step D: Groq LLM Inference
         └─ Calls Groq API (llama-3.3-70b-versatile) with system context + RAG chunks + tool outputs
         └─ Generates professional, compliant underwriting explanation

Step 4: Response Returned
   └─ File: app/core/response.py
      └─ Returns structured assistant message, sources, and suggested follow-up questions.
```

---

## 📁 3. Quick Reference: File Map by Layer

| Layer | Directory / File Path | Responsibility |
| :--- | :--- | :--- |
| **App Entrypoint** | `app/main.py` | FastAPI app initialization, middleware, router mounts, startup events |
| **Config & Settings** | `app/core/config.py` | Environment variable parsing with `pydantic-settings` |
| **Response Formatter** | `app/core/response.py` | Standard `{ success, statusCode, message, result }` envelope |
| **Security & Auth** | `app/core/security.py` | JWT token creation/decoding, password hashing, role guard (`require_role`) |
| **Enums** | `app/core/enums.py` | Centralized domain string enums (`UserRole`, `LoanApplicationStatus`, etc.) |
| **Storage Utilities** | `app/core/storage.py` | Centralized image aspect-ratio validation, document upload, file deletion |
| **Database Session** | `app/db/session.py` | SQLAlchemy engine, session maker, and centralized `get_db()` dependency |
| **ORM Models** | `app/models/*.py` | SQLAlchemy database table definitions |
| **Pydantic Schemas** | `app/schemas/*.py` | Request/Response validation and serialization models |
| **Repositories** | `app/repositories/*.py` | Pure database queries and persistence (`db.query`, `db.add`, `db.commit`) |
| **Services** | `app/services/*.py` | Pure business logic, validation rules, RAG, and AI orchestration |
| **Routers (Controllers)** | `app/api/routers/*.py` | Thin HTTP route handlers delegating to Services |
