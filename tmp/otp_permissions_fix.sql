-- Création des permissions OTP avec syntaxe JSON correcte
INSERT INTO permissions (code, label, "group", description, created_by, uid, created_at, updated_at) VALUES 
('otp.generate', '{"en": "Generate OTP", "fr": "Générer OTP"}', 'otp', 'Generate OTP codes', 1, gen_random_uuid(), NOW(), NOW()),
('otp.verify', '{"en": "Verify OTP", "fr": "Vérifier OTP"}', 'otp', 'Verify OTP codes', 1, gen_random_uuid(), NOW(), NOW()),
('otp.manage', '{"en": "Manage OTP", "fr": "Gérer OTP"}', 'otp', 'Manage OTP codes', 1, gen_random_uuid(), NOW(), NOW());
