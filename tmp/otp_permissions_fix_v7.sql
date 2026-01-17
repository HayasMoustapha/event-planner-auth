-- Création des permissions OTP avec approche COPY (version finale)
CREATE TEMP TABLE temp_permissions (
    code TEXT,
    label JSONB,
    group_name TEXT,
    description TEXT,
    created_by BIGINT,
    uid UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Insertion des données
INSERT INTO temp_permissions (code, label, group_name, description, created_by, uid, created_at, updated_at) VALUES
('otp.generate', '{"en": "Generate OTP"}', 'otp', 'Generate OTP codes', 1, gen_random_uuid(), NOW(), NOW()),
('otp.verify', '{"en": "Verify OTP"}', 'otp', 'Verify OTP codes', 1, gen_random_uuid(), NOW(), NOW()),
('otp.manage', '{"en": "Manage OTP"}', 'otp', 'Manage OTP codes', 1, gen_random_uuid(), NOW(), NOW());

-- Copie vers la table principale avec cast correct
INSERT INTO permissions (code, label, "group", description, created_by, uid, created_at, updated_at)
SELECT code, label, group_name::text, description::text, created_by, uid, created_at, updated_at
FROM temp_permissions;

-- Nettoyage
DROP TABLE temp_permissions;
