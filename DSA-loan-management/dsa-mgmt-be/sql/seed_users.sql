-- Seeder to add password column (if missing) and create admin/agent and a customer
-- Run after init_db.sql: psql -U postgres -d "dsa-mgmt" -f sql/seed_users.sql

-- Ensure password column exists (safe for PostgreSQL >= 9.6)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS password varchar(255);

-- Insert admin agent (isadmin = true)
INSERT INTO agents (name, email, mobile, password, temppassword, temppasswordreset, isadmin)
VALUES (
  'Lokesh Admin',
  'lokesh_dsa_admin@yopmail.com',
  '1111111111',
  'Lokesh@123',
  'Lokesh@123',
  false,
  true
)
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, mobile = EXCLUDED.mobile, isadmin = EXCLUDED.isadmin;

-- Insert regular agent (isadmin = false)
INSERT INTO agents (name, email, mobile, password, temppassword, temppasswordreset, isadmin)
VALUES (
  'Lokesh Agent',
  'lokesh_agent@yopmail.com',
  '2222222222',
  'Lokesh@123',
  'Lokesh@123',
  false,
  false
)
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, mobile = EXCLUDED.mobile, isadmin = EXCLUDED.isadmin;

-- Insert customer linked to the regular agent (if the agent exists). Uses mobile as uniqueCustomerId.
INSERT INTO customers (email, name, mobile, uniqueCustomerId, agentid, status)
SELECT
  'lokesh_customer@yopmail.com' AS email,
  'Lokesh Customer' AS name,
  '1234567890' AS mobile,
  '1234567890' AS uniqueCustomerId,
  a.id AS agentid,
  'not-started' AS status
FROM agents a
WHERE a.email = 'lokesh_agent@yopmail.com'
ON CONFLICT (uniqueCustomerId) DO NOTHING;
