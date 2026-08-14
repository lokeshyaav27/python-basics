-- ==============================================================================
-- DSA Loan Management Platform Full Database Seeder
-- Run: psql -U postgres -d "dsa-mgmt" -f sql/seed_users.sql
-- ==============================================================================

-- 1. Seed 3 Products
INSERT INTO products (name, description, image, is_active) VALUES
('Home Loan', 'Low-interest housing loans with flexible 30-year tenure and up to 90% property value financing for purchase, construction, or renovation.', 'home-loan.jpg', true),
('Car Loan', 'Fast-track vehicle financing for brand new and pre-owned cars with 100% on-road funding and minimal documentation.', 'car-loan.jpg', true),
('Personal Loan', 'Instant collateral-free personal loans for emergency expenses, weddings, medical needs, travel, and debt consolidation.', 'personal-loan.jpg', true)
ON CONFLICT DO NOTHING;

-- 2. Seed 5 Banks & 2 NBFCs (7 Total)
INSERT INTO banks (name, is_nationalize, is_private, is_nbfc, logo, is_active) VALUES
('State Bank of India (SBI)', true, false, false, 'sbi.jpg', true),
('ICICI Bank', false, true, false, 'icici.jpg', true),
('HDFC Bank', false, true, false, NULL, true),
('Axis Bank', false, true, false, NULL, true),
('Punjab National Bank (PNB)', true, false, false, NULL, true),
('Bajaj Housing Finance', false, false, true, NULL, true),
('Tata Capital Financial Services', false, false, true, NULL, true)
ON CONFLICT DO NOTHING;

-- 3. Seed Agents (2 Admins + 6 Regular Agents = 8 Total)
INSERT INTO agents (name, email, mobile, password, temp_password, temp_password_reset, is_admin, photo, is_active) VALUES
('Lokesh Admin', 'lokesh_dsa_admin@yopmail.com', '1111111111', 'Lokesh@123', 'Lokesh@123', true, true, 'user-01.png', true),
('Rajesh Sharma (Admin)', 'rajesh.admin@dsafinance.com', '9810011223', 'Admin@123', 'Admin@123', true, true, 'user-02.png', true),
('Lokesh Agent', 'lokesh_agent@yopmail.com', '2222222222', 'Lokesh@123', 'Lokesh@123', true, false, 'user-03.png', true),
('Priya Verma', 'priya.verma@dsafinance.com', '9876500001', 'Agent@123', 'Agent@123', true, false, 'user-04.png', true),
('Amitabh Sen', 'amitabh.sen@dsafinance.com', '9876500002', 'Agent@123', 'Agent@123', true, false, 'user-05.png', true),
('Sneha Kulkarni', 'sneha.k@dsafinance.com', '9876500003', 'Agent@123', 'Agent@123', true, false, 'user-06.png', true),
('Vikram Malhotra', 'vikram.m@dsafinance.com', '9876500004', 'Agent@123', 'Agent@123', true, false, 'user-07.png', true),
('Ananya Roy', 'ananya.roy@dsafinance.com', '9876500005', 'Agent@123', 'Agent@123', true, false, 'user-08.png', true)
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, is_admin = EXCLUDED.is_admin, photo = EXCLUDED.photo;
