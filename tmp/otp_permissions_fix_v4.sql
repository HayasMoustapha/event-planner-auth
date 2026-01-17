-- Création des permissions OTP avec JSONB_BUILD_OBJECT pour éviter les problèmes de guillemets
INSERT INTO permissions (code, label, "group", description, created_by, uid, created_at, updated_at) VALUES 
('otp.generate', jsonb_build_object('en', 'Generate OTP', 'fr', 'Générer OTP'), 'otp', 'Generate OTP codes', 1, gen_random_uuid(), NOW(), NOW()),
('otp.verify', jsonb_build_object('en', 'Verify OTP', 'fr', 'Vérifier OTP'), 'otp', 'Verify OTP codes', 1, gen_random_uuid(), NOW(), NOW()),
('otp.manage', jsonb_build_object('en', 'Manage OTP', 'fr', 'Gérer OTP'), 'otp', 'Manage OTP codes', 1, gen_random_uuid(), NOW(), NOW());
