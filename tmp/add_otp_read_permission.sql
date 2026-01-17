-- Ajout de la permission otp.read manquante
CREATE TEMP TABLE temp_permissions (
    code TEXT,
    label JSONB,
    group_name TEXT,
    description JSONB,
    created_by BIGINT,
    uid UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Insertion de la permission otp.read
INSERT INTO temp_permissions (code, label, group_name, description, created_by, uid, created_at, updated_at) VALUES
('otp.read', '{"en": "Read OTP"}', 'otp', '{"en": "Read OTP codes"}', 1, gen_random_uuid(), NOW(), NOW());

-- Copie vers la table principale
INSERT INTO permissions (code, label, "group", description, created_by, uid, created_at, updated_at)
SELECT code, label, group_name, description, created_by, uid, created_at, updated_at
FROM temp_permissions;

-- Nettoyage
DROP TABLE temp_permissions;
