-- ==============================================================================
-- Seeder to create demo admin, demo agent, and demo loan application
-- Run after init_db.sql: psql -U postgres -d "dsa-mgmt" -f sql/seed_users.sql
-- ==============================================================================

-- 1. Insert admin agent (is_admin = true)
INSERT INTO agents (name, email, mobile, password, temp_password, temp_password_reset, is_admin, is_active)
VALUES (
  'Lokesh Admin',
  'lokesh_dsa_admin@yopmail.com',
  '1111111111',
  'Lokesh@123',
  'Lokesh@123',
  true,
  true,
  true
)
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, mobile = EXCLUDED.mobile, is_admin = EXCLUDED.is_admin;

-- 2. Insert regular agent (is_admin = false)
INSERT INTO agents (name, email, mobile, password, temp_password, temp_password_reset, is_admin, is_active)
VALUES (
  'Lokesh Agent',
  'lokesh_agent@yopmail.com',
  '2222222222',
  'Lokesh@123',
  'Lokesh@123',
  true,
  false,
  true
)
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, mobile = EXCLUDED.mobile, is_admin = EXCLUDED.is_admin;

-- 3. Insert demo loan application linked to the regular agent
INSERT INTO loan_applications (email, name, mobile, unique_customer_id, agent_id, status, is_active)
SELECT
  'lokesh_customer@yopmail.com' AS email,
  'Lokesh Customer' AS name,
  '1234567890' AS mobile,
  '1234567890' AS unique_customer_id,
  a.id AS agent_id,
  'not-started' AS status,
  true AS is_active
FROM agents a
WHERE a.email = 'lokesh_agent@yopmail.com'
LIMIT 1;
