-- ========================================
-- SEED ADMIN (super_admin)
-- ========================================

-- Create default admin person
INSERT INTO people (first_name, last_name, email, phone, status, created_at, updated_at)
SELECT 'Admin', 'EventPlanner', 'admin@eventplanner.com', NULL, 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM people WHERE email = 'admin@eventplanner.com' AND deleted_at IS NULL);

-- Create admin user (linked to person)
INSERT INTO users (person_id, user_code, username, email, phone, status, email_verified_at, password, created_at, updated_at)
SELECT p.id,
       'ADMIN-0001',
       'admin',
       'admin@eventplanner.com',
       NULL,
       'active',
       NOW(),
       '$2b$12$o2YoqvCJC4h724K0ZtIyMObi1UDWX0xmvTrvTdkv.yLAl/PtFW19y', -- Admin123! (bcrypt)
       NOW(),
       NOW()
FROM people p
WHERE p.email = 'admin@eventplanner.com'
AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@eventplanner.com' AND deleted_at IS NULL);

-- Assign super_admin role
INSERT INTO accesses (user_id, role_id, status, created_at, updated_at)
SELECT u.id, r.id, 'active', NOW(), NOW()
FROM users u
JOIN roles r ON r.code = 'super_admin'
WHERE u.email = 'admin@eventplanner.com'
AND NOT EXISTS (
  SELECT 1 FROM accesses a WHERE a.user_id = u.id AND a.role_id = r.id AND a.deleted_at IS NULL
);
