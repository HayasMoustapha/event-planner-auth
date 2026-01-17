-- Création des permissions OTP avec JSONB_BUILD_OBJECT (uniquement en anglais)
INSERT INTO permissions (code, label, "group", description, created_by, uid, created_at, updated_at) VALUES 
('otp.generate', jsonb_build_object('en', 'Generate OTP'), 'otp', 'Generate OTP codes', 1, gen_random_uuid(), NOW(), NOW()),
('otp.verify', jsonb_build_object('en', 'Verify OTP'), 'otp', 'Verify OTP codes', 1, gen_random_uuid(), NOW(), NOW()),
('otp.manage', jsonb_build_object('en', 'Manage OTP'), 'otp', 'Manage OTP codes', 1, gen_random_uuid(), NOW(), NOW());
