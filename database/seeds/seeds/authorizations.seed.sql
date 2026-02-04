-- ========================================
-- SEED DES AUTORISATIONS RBAC (POSTGRESQL)
-- Modèle cible : 4 rôles uniques
-- ========================================

-- S'assurer qu'un menu par défaut existe
INSERT INTO menus (parent_id, label, icon, route, component, parent_path, menu_group, sort_order, depth, description, is_visible, created_at, updated_at)
SELECT 
  NULL,
  '{"en": "System", "fr": "Système"}'::jsonb,
  'settings',
  '/admin',
  'AdminLayout',
  '/admin',
  1,
  1,
  0,
  '{"en": "System administration menu", "fr": "Menu d''administration système"}'::jsonb,
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE deleted_at IS NULL LIMIT 1);

-- Nettoyage des autorisations hors modèle cible
DELETE FROM authorizations
WHERE role_id IN (SELECT id FROM roles WHERE code NOT IN ('super_admin', 'organizer', 'designer', 'user'));

-- Réinitialiser les autorisations des rôles cibles (hors super_admin)
DELETE FROM authorizations
WHERE role_id IN (SELECT id FROM roles WHERE code IN ('organizer', 'designer', 'user'));

-- Super Admin: toutes les permissions
INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
SELECT r.id, p.id, m.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM roles r
CROSS JOIN permissions p
CROSS JOIN LATERAL (SELECT id FROM menus WHERE deleted_at IS NULL ORDER BY id LIMIT 1) m
WHERE r.code = 'super_admin' AND r.deleted_at IS NULL AND p.deleted_at IS NULL
ON CONFLICT (role_id, permission_id, menu_id) DO UPDATE SET
  deleted_at = NULL,
  updated_at = CURRENT_TIMESTAMP;

-- Rôles métiers: ORGANIZER / DESIGNER / USER
CREATE TEMP TABLE role_permissions (role_code TEXT, permission_code TEXT);

INSERT INTO role_permissions (role_code, permission_code) VALUES
('organizer', 'events.create'),
('organizer', 'events.read'),
('organizer', 'events.update'),
('organizer', 'events.delete'),
('organizer', 'events.publish'),
('organizer', 'events.archive'),
('organizer', 'events.manage'),
('organizer', 'events.stats.read'),
('organizer', 'events.invitations.send'),
('organizer', 'events.invitations.read'),
('organizer', 'events.invitations.delete'),
('organizer', 'manage_events'),
('organizer', 'guests.create'),
('organizer', 'guests.read'),
('organizer', 'guests.update'),
('organizer', 'guests.delete'),
('organizer', 'guests.import'),
('organizer', 'guests.export'),
('organizer', 'guests.checkin'),
('organizer', 'guests.stats.read'),
('organizer', 'tickets.create'),
('organizer', 'tickets.read'),
('organizer', 'tickets.update'),
('organizer', 'tickets.delete'),
('organizer', 'tickets.validate'),
('organizer', 'tickets.process'),
('organizer', 'tickets.generate'),
('organizer', 'tickets.stats.read'),
('organizer', 'tickets.batch.create'),
('organizer', 'tickets.full.batch'),
('organizer', 'tickets.pdf.create'),
('organizer', 'tickets.pdf.batch'),
('organizer', 'tickets.jobs.create'),
('organizer', 'tickets.jobs.process'),
('organizer', 'tickets.jobs.read'),
('organizer', 'tickets.jobs.cancel'),
('organizer', 'tickets.types.create'),
('organizer', 'tickets.types.read'),
('organizer', 'tickets.types.update'),
('organizer', 'tickets.types.delete'),
('organizer', 'tickets.templates.create'),
('organizer', 'tickets.templates.read'),
('organizer', 'tickets.templates.update'),
('organizer', 'tickets.templates.delete'),
('organizer', 'tickets.templates.validate'),
('organizer', 'scans.validate'),
('organizer', 'scans.validate.offline'),
('organizer', 'scans.history.read'),
('organizer', 'scans.stats.read'),
('organizer', 'scans.qr.decode'),
('organizer', 'scans.offline.sync'),
('organizer', 'scans.offline.read'),
('organizer', 'scans.offline.cleanup'),
('organizer', 'scans.sessions.create'),
('organizer', 'scans.sessions.read'),
('organizer', 'scans.sessions.update'),
('organizer', 'scans.operators.create'),
('organizer', 'scans.operators.read'),
('organizer', 'scans.devices.create'),
('organizer', 'scans.devices.read'),
('organizer', 'scans.fraud.analyze'),
('organizer', 'scans.fraud.read'),
('organizer', 'scans.reports.generate'),
('organizer', 'scans.qr.generate'),
('organizer', 'scans.qr.batch'),
('organizer', 'scans.qr.test'),
('organizer', 'notifications.email.send'),
('organizer', 'notifications.sms.send'),
('organizer', 'notifications.email.queue'),
('organizer', 'notifications.sms.queue'),
('organizer', 'notifications.email.bulk'),
('organizer', 'notifications.sms.bulk'),
('organizer', 'notifications.bulk.mixed'),
('organizer', 'notifications.jobs.read'),
('organizer', 'notifications.jobs.cancel'),
('organizer', 'notifications.stats.read'),
('organizer', 'notifications.welcome.send'),
('organizer', 'notifications.password-reset.send'),
('organizer', 'notifications.event-confirmation.send'),
('organizer', 'notifications.otp.send'),
('organizer', 'payments.create'),
('organizer', 'payments.read'),
('organizer', 'payments.update'),
('organizer', 'payments.cancel'),
('organizer', 'payments.refunds.create'),
('organizer', 'payments.refunds.read'),
('organizer', 'payments.stats.read'),
('organizer', 'payments.invoices.create'),
('organizer', 'payments.invoices.read'),
('organizer', 'payments.stripe.create'),
('organizer', 'payments.paypal.create'),
('organizer', 'payments.paypal.capture'),
('organizer', 'payments.payment-methods.create'),
('organizer', 'payments.payment-methods.read'),
('organizer', 'payments.customers.create'),
('organizer', 'payments.customers.read'),
('organizer', 'payment-methods.create'),
('organizer', 'payment-methods.read'),
('organizer', 'payment-methods.update'),
('organizer', 'payment-methods.delete'),
('organizer', 'refunds.create'),
('organizer', 'refunds.read'),
('organizer', 'invoices.create'),
('organizer', 'invoices.read'),
('organizer', 'marketplace.templates.read'),
('organizer', 'marketplace.templates.purchase'),
('organizer', 'marketplace.purchases.read'),
('organizer', 'marketplace.reviews.read'),
('organizer', 'marketplace.reviews.create'),
('organizer', 'marketplace.read'),
('organizer', 'marketplace.purchase'),
('designer', 'templates.design'),
('designer', 'templates.publish'),
('designer', 'templates.sell'),
('designer', 'templates.analytics'),
('designer', 'marketplace.designer.read'),
('designer', 'marketplace.designer.upload'),
('designer', 'marketplace.designers.create'),
('designer', 'marketplace.designers.read'),
('designer', 'marketplace.designers.update'),
('designer', 'marketplace.templates.create'),
('designer', 'marketplace.templates.read'),
('designer', 'marketplace.templates.update'),
('designer', 'marketplace.reviews.read'),
('designer', 'marketplace.reviews.create'),
('designer', 'marketplace.stats.read'),
('designer', 'marketplace.design'),
('designer', 'tickets.pdf.create'),
('designer', 'tickets.pdf.batch'),
('designer', 'events.read'),
('designer', 'events.list'),
('user', 'events.read'),
('user', 'events.list'),
('user', 'tickets.read'),
('user', 'payments.create'),
('user', 'payments.read'),
('user', 'scans.qr.decode');

INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
SELECT r.id, p.id, m.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM role_permissions rp
INNER JOIN roles r ON r.code = rp.role_code AND r.deleted_at IS NULL
INNER JOIN permissions p ON p.code = rp.permission_code AND p.deleted_at IS NULL
CROSS JOIN LATERAL (SELECT id FROM menus WHERE deleted_at IS NULL ORDER BY id LIMIT 1) m
ON CONFLICT (role_id, permission_id, menu_id) DO UPDATE SET
  deleted_at = NULL,
  updated_at = CURRENT_TIMESTAMP;

DROP TABLE role_permissions;

DO $$
BEGIN
  RAISE NOTICE '✅ Autorisations normalisées: % associations actives', (SELECT COUNT(*) FROM authorizations WHERE deleted_at IS NULL);
END $$;
