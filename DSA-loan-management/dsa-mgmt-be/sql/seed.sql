-- Seed data for DSA Loan Platform
-- Run after init_db.sql: psql -U postgres -d "dsa-mgmt" -f sql/seed.sql

-- Insert product data
INSERT INTO products (name, description, image) VALUES
(
    'Home Loan',
    'Flexible home loan options with competitive interest rates and quick approval process. Get up to 95% of property value with tenure up to 30 years.',
    'https://via.placeholder.com/300x200?text=Home+Loan'
),
(
    'Personal Loan',
    'Unsecured personal loan for all your financial needs. Quick approval, minimal documentation, and flexible repayment options up to 5 years.',
    'https://via.placeholder.com/300x200?text=Personal+Loan'
);

-- Seed lending partner bank data for the public home page
INSERT INTO banks (name, isnationalize, isprivate, isnbfc, logo) VALUES
(
    'SBI',
    true,
    false,
    false,
    'https://via.placeholder.com/200x100?text=SBI'
),
(
    'HDFC Bank',
    false,
    true,
    false,
    'https://via.placeholder.com/200x100?text=HDFC'
),
(
    'PNB',
    true,
    false,
    false,
    'https://via.placeholder.com/200x100?text=PNB'
),
(
    'ICICI Bank',
    false,
    true,
    false,
    'https://via.placeholder.com/200x100?text=ICICI'
),
(
    'Axis Bank',
    false,
    true,
    false,
    'https://via.placeholder.com/200x100?text=Axis'
),
(
    'Kotak Mahindra Bank',
    false,
    true,
    false,
    'https://via.placeholder.com/200x100?text=Kotak'
),
(
    'Yes Bank',
    false,
    true,
    false,
    'https://via.placeholder.com/200x100?text=Yes'
),
(
    'Bajaj Finance',
    false,
    false,
    true,
    'https://via.placeholder.com/200x100?text=Bajaj'
);
