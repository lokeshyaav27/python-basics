-- SQL script to create initial schema for DSA Loan Platform
-- Run: psql -U admin -d "dsa-mgmt" -f init_db.sql

CREATE TABLE IF NOT EXISTS products (
    id serial PRIMARY KEY,
    name varchar(255) NOT NULL,
    description text NOT NULL,
    image varchar(1024)
);

CREATE TABLE IF NOT EXISTS banks (
    id serial PRIMARY KEY,
    name varchar(255) NOT NULL,
    isnationalize boolean NOT NULL DEFAULT false,
    isprivate boolean NOT NULL DEFAULT false,
    isnbfc boolean NOT NULL DEFAULT false,
    logo varchar(1024)
);

CREATE TABLE IF NOT EXISTS agents (
    id serial PRIMARY KEY,
    name varchar(255) NOT NULL,
    email varchar(255) NOT NULL UNIQUE,
    mobile varchar(32) NOT NULL,
    temppassword varchar(255),
    password varchar(255),
    temppasswordreset boolean NOT NULL DEFAULT false,
    isadmin boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS product_bank_links (
    id serial PRIMARY KEY,
    bankid integer REFERENCES banks(id) NOT NULL,
    productid integer REFERENCES products(id) NOT NULL,
    commission numeric(10,2)
);

CREATE TABLE IF NOT EXISTS bank_documents (
    id serial PRIMARY KEY,
    productbanklinkid integer REFERENCES product_bank_links(id) NOT NULL,
    nameofdocuments varchar(255) NOT NULL,
    documentlocation varchar(1024) NOT NULL
);

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
    issalaried boolean
);

CREATE TABLE IF NOT EXISTS home_loan_details (
    id serial PRIMARY KEY,
    property_value numeric(14,2),
    property_location varchar(255),
    propertyusagetype varchar(64),
    down_payment numeric(14,2),
    ispartproperty boolean,
    propertyrequirement varchar(128),
    propertytype varchar(64),
    propertystatus varchar(64),
    femalecoapplicant boolean,
    propertyinsurance boolean,
    applicantinsurance boolean
);

CREATE TABLE IF NOT EXISTS car_loan_details (
    id serial PRIMARY KEY,
    new_or_used varchar(32),
    car_value numeric(14,2),
    down_payment numeric(14,2),
    vehicle_age integer
);

CREATE TABLE IF NOT EXISTS personal_loan_details (
    id serial PRIMARY KEY,
    loan_purpose varchar(128),
    other varchar(255),
    required_amount numeric(14,2),
    existing_obligations numeric(14,2)
);

CREATE TABLE IF NOT EXISTS customers (
    id serial PRIMARY KEY,
    email varchar(255) NOT NULL,
    name varchar(255) NOT NULL,
    mobile varchar(32) NOT NULL,
    uniqueCustomerId varchar(32) NOT NULL UNIQUE,
    agentid integer REFERENCES agents(id),
    status varchar(32) NOT NULL DEFAULT 'not-started'
);

CREATE TABLE IF NOT EXISTS loans (
    id serial PRIMARY KEY,
    uniqueCustomerId varchar(32) NOT NULL,
    clientgeneraldetailstableid integer REFERENCES client_general_details(id),
    homeloandetailid integer REFERENCES home_loan_details(id),
    carloandetailid integer REFERENCES car_loan_details(id),
    personalloandetailid integer REFERENCES personal_loan_details(id),
    FOREIGN KEY (uniqueCustomerId) REFERENCES customers(uniqueCustomerId)
);

-- Optional: seed an admin user
INSERT INTO agents (name, email, mobile, temppassword, temppasswordreset, isadmin)
VALUES ('admin','admin@example.com','0000000000','admin',false,true)
ON CONFLICT (email) DO NOTHING;
