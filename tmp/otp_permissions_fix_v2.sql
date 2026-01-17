-- Création des permissions OTP avec variables pour éviter les problèmes de guillemets
\set label_generate '{"en": "Generate OTP", "fr": "Générer OTP"}'
\set label_verify '{"en": "Verify OTP", "fr": "Vérifier OTP"}'
\set label_manage '{"en": "Manage OTP", "fr": "Gérer OTP"}'

INSERT INTO permissions (code, label, "group", description, created_by, uid, created_at, updated_at) VALUES 
('otp.generate', :'label_generate', 'otp', 'Generate OTP codes', 1, gen_random_uuid(), NOW(), NOW()),
('otp.verify', :'label_verify', 'otp', 'Verify OTP codes', 1, gen_random_uuid(), NOW(), NOW()),
('otp.manage', :'label_manage', 'otp', 'Manage OTP codes', 1, gen_random_uuid(), NOW(), NOW());
