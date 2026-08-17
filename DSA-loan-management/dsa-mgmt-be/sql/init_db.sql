-- ==============================================================================
-- DSA Loan Management Platform Database Schema (PostgreSQL)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS products (
    id serial PRIMARY KEY,
    name varchar(255) NOT NULL,
    description text NOT NULL,
    image varchar(1024),
    is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS banks (
    id serial PRIMARY KEY,
    name varchar(255) NOT NULL,
    is_nationalize boolean NOT NULL DEFAULT false,
    is_private boolean NOT NULL DEFAULT false,
    is_nbfc boolean NOT NULL DEFAULT false,
    logo varchar(1024),
    is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS agents (
    id serial PRIMARY KEY,
    name varchar(255) NOT NULL,
    email varchar(255) NOT NULL UNIQUE,
    mobile varchar(32) NOT NULL,
    temp_password varchar(255),
    password varchar(255),
    temp_password_reset boolean NOT NULL DEFAULT false,
    is_admin boolean NOT NULL DEFAULT false,
    photo varchar(1024),
    is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS product_bank_links (
    id serial PRIMARY KEY,
    bank_id integer REFERENCES banks(id) ON DELETE CASCADE NOT NULL,
    product_id integer REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    commission numeric(10,2),
    is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS bank_documents (
    id serial PRIMARY KEY,
    product_bank_link_id integer REFERENCES product_bank_links(id) ON DELETE CASCADE NOT NULL,
    document_name varchar(255) NOT NULL,
    document_location varchar(1024) NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bank_document_chunks (
    id serial PRIMARY KEY,
    bank_document_id integer REFERENCES bank_documents(id) ON DELETE CASCADE NOT NULL,
    bank_id integer REFERENCES banks(id) ON DELETE CASCADE NOT NULL,
    product_id integer REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    chunk_index integer NOT NULL,
    page_number integer,
    chunk_text text NOT NULL,
    embedding vector(384) NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bank_document_chunks_embedding 
ON bank_document_chunks USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS client_general_details (
    id serial PRIMARY KEY,
    name varchar(255),
    age integer,
    gender varchar(32),
    location varchar(255),
    employment_type varchar(64),
    monthly_income numeric(12,2),
    monthly_obligation numeric(12,2),
    existing_emi numeric(12,2),
    cibil_score integer,
    loan_amount_required numeric(12,2),
    preferred_tenure integer,
    is_salaried boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS home_loan_details (
    id serial PRIMARY KEY,
    property_value numeric(14,2),
    property_location varchar(255),
    property_usage_type varchar(64),
    down_payment numeric(14,2),
    is_part_property boolean DEFAULT false,
    property_requirement varchar(128),
    property_type varchar(64),
    property_status varchar(64),
    female_co_applicant boolean DEFAULT false,
    property_insurance boolean DEFAULT true,
    applicant_insurance boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS car_loan_details (
    id serial PRIMARY KEY,
    new_or_used varchar(32),
    car_value numeric(14,2),
    down_payment numeric(14,2),
    vehicle_age integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS personal_loan_details (
    id serial PRIMARY KEY,
    loan_purpose varchar(128),
    other varchar(255),
    required_amount numeric(14,2),
    existing_obligations numeric(14,2)
);

CREATE TABLE IF NOT EXISTS loan_applications (
    id serial PRIMARY KEY,
    email varchar(255) NOT NULL,
    name varchar(255) NOT NULL,
    mobile varchar(32) NOT NULL,
    unique_customer_id varchar(32) NOT NULL,
    agent_id integer REFERENCES agents(id) ON DELETE SET NULL,
    bank_id integer REFERENCES banks(id) ON DELETE SET NULL,
    product_id integer REFERENCES products(id) ON DELETE SET NULL,
    home_loan_detail_id integer REFERENCES home_loan_details(id) ON DELETE SET NULL,
    car_loan_detail_id integer REFERENCES car_loan_details(id) ON DELETE SET NULL,
    personal_loan_detail_id integer REFERENCES personal_loan_details(id) ON DELETE SET NULL,
    client_general_detail_id integer REFERENCES client_general_details(id) ON DELETE SET NULL,
    status varchar(32) DEFAULT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS contact_enquiries (
    id serial PRIMARY KEY,
    name varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    mobile varchar(32) NOT NULL,
    loan_type varchar(64),
    message text,
    status varchar(32) NOT NULL DEFAULT 'new',
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    is_active boolean NOT NULL DEFAULT true
);

-- Seed Default Admin
INSERT INTO agents (name, email, mobile, temp_password, password, temp_password_reset, is_admin, is_active)
VALUES ('Admin', 'admin@example.com', '0000000000', 'admin', '$2b$12$e6fK89t1fJg3wY7B7z8HNu9W7Yp7o3dF4L8M1k9Z2Q5x6C7v8B9n0', true, true, true)
ON CONFLICT (email) DO NOTHING;
