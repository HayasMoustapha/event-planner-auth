-- Associer la permission otp.read au rôle super_admin
INSERT INTO authorizations (role_id, permission_id, menu_id, created_by, uid, created_at, updated_at)
SELECT 1, p.id, 5, 1, gen_random_uuid(), NOW(), NOW()
FROM permissions p 
WHERE p.code = 'otp.read';
