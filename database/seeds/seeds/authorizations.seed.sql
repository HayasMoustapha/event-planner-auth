-- ========================================
-- SEED AUTHORIZATIONS (role-permission)
-- ========================================
-- Each business role gets ONLY the permissions within its scope.
-- super_admin = ALL permissions (CROSS JOIN)
-- organizer   = core business (events, tickets, guests, invitations, payments, scans, notifications)
-- designer    = design & marketplace (templates, marketplace CRUD, PDF generation, sales tracking)
-- user        = basic consumer (browse events, buy/view tickets, marketplace purchase)

-- ========================================
-- 1. CLEANUP
-- ========================================

-- Remove authorizations for roles outside the target roles
DELETE FROM authorizations
WHERE role_id IN (SELECT id FROM roles WHERE code NOT IN ('super_admin', 'organizer', 'designer', 'user', 'scan_operator'));

-- Reset ALL target roles (will be fully re-populated below)
DELETE FROM authorizations
WHERE role_id IN (SELECT id FROM roles WHERE code IN ('super_admin', 'organizer', 'designer', 'user', 'scan_operator'));

-- ========================================
-- 2. SUPER ADMIN = ALL PERMISSIONS
-- ========================================

INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at, granted)
SELECT r.id, p.id, NULL, NOW(), NOW(), TRUE
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'super_admin' AND r.deleted_at IS NULL AND p.deleted_at IS NULL
;

-- ========================================
-- 3. BUSINESS ROLES (temp table approach)
-- ========================================

CREATE TEMP TABLE role_permissions (role_code TEXT, permission_code TEXT);

-- ========================================
-- 3a. ORGANIZER
-- ========================================
-- Scope: core business of the platform
-- events.*, tickets.*, guests.*, invitations.*,
-- payments, scans, notifications (sending to attendees),
-- marketplace (consultation + purchase only)

INSERT INTO role_permissions (role_code, permission_code) VALUES

-- === EVENTS (full management) ===
('organizer', 'events.create'),
('organizer', 'events.read'),
('organizer', 'events.update'),
('organizer', 'events.delete'),
('organizer', 'events.publish'),
('organizer', 'events.archive'),
('organizer', 'events.manage'),
('organizer', 'events.stats.read'),
('organizer', 'events.list'),
('organizer', 'manage_events'),

-- === INVITATIONS (full management) ===
('organizer', 'events.invitations.send'),
('organizer', 'events.invitations.read'),
('organizer', 'events.invitations.delete'),

-- === GUESTS (full management) ===
('organizer', 'guests.create'),
('organizer', 'guests.read'),
('organizer', 'guests.update'),
('organizer', 'guests.delete'),
('organizer', 'guests.import'),
('organizer', 'guests.export'),
('organizer', 'guests.checkin'),
('organizer', 'guests.stats.read'),

-- === TICKETS (full management) ===
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
('organizer', 'tickets.jobs.create'),
('organizer', 'tickets.jobs.process'),
('organizer', 'tickets.jobs.read'),
('organizer', 'tickets.jobs.cancel'),
('organizer', 'tickets.pdf.create'),
('organizer', 'tickets.pdf.batch'),

-- === TICKET TYPES (full management) ===
('organizer', 'tickets.types.create'),
('organizer', 'tickets.types.read'),
('organizer', 'tickets.types.update'),
('organizer', 'tickets.types.delete'),

-- === TICKET TEMPLATES (full management) ===
('organizer', 'tickets.templates.create'),
('organizer', 'tickets.templates.read'),
('organizer', 'tickets.templates.update'),
('organizer', 'tickets.templates.delete'),
('organizer', 'tickets.templates.validate'),

-- === PAYMENTS (suivi achat billets + achats templates) ===
('organizer', 'payments.create'),
('organizer', 'payments.read'),
('organizer', 'payments.update'),
('organizer', 'payments.cancel'),
('organizer', 'payments.stats.read'),

-- === MARKETPLACE (consultation + purchase ONLY, NOT design/creation) ===
('organizer', 'marketplace.read'),
('organizer', 'marketplace.purchase'),
('organizer', 'marketplace.templates.read'),
('organizer', 'marketplace.templates.purchase'),
('organizer', 'marketplace.purchases.read'),
('organizer', 'marketplace.designers.read'),
('organizer', 'marketplace.reviews.read'),
('organizer', 'marketplace.reviews.create'),

-- === NOTIFICATIONS (sending to attendees/guests) ===
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
('organizer', 'notifications.event-confirmation.send'),
('organizer', 'notifications.organizer.send'),

-- === SCANS (ticket validation at events) ===
('organizer', 'scans.validate'),
('organizer', 'scans.validate.offline'),
('organizer', 'scans.history.read'),
('organizer', 'scans.stats.read'),
('organizer', 'scans.qr.decode'),
('organizer', 'scans.qr.generate'),
('organizer', 'scans.qr.batch'),
('organizer', 'scans.qr.test'),
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

-- === PROFILE (own profile) ===
('organizer', 'users.read'),
('organizer', 'users.update');

-- ========================================
-- 3b. DESIGNER
-- ========================================
-- Scope: design creation, marketplace management,
-- template design & sales, PDF generation.
-- NO access to: events management, guests, invitations,
-- tickets management, scans, admin, system.

INSERT INTO role_permissions (role_code, permission_code) VALUES

-- === TEMPLATE DESIGN (core designer activity) ===
('designer', 'templates.design'),
('designer', 'templates.publish'),
('designer', 'templates.sell'),
('designer', 'templates.analytics'),

-- === MARKETPLACE (as a designer: create, manage, sell templates) ===
('designer', 'marketplace.design'),
('designer', 'marketplace.designer.read'),
('designer', 'marketplace.designer.upload'),
('designer', 'marketplace.designers.create'),
('designer', 'marketplace.designers.read'),
('designer', 'marketplace.designers.update'),
('designer', 'marketplace.templates.create'),
('designer', 'marketplace.templates.read'),
('designer', 'marketplace.templates.update'),
('designer', 'marketplace.templates.delete'),
('designer', 'marketplace.reviews.read'),
('designer', 'marketplace.reviews.create'),
('designer', 'marketplace.stats.read'),
('designer', 'marketplace.purchases.read'),
('designer', 'marketplace.read'),
('designer', 'marketplace.purchase'),
('designer', 'marketplace.templates.purchase'),

-- === PDF GENERATION (for ticket design previews) ===
('designer', 'tickets.pdf.create'),
('designer', 'tickets.pdf.batch'),

-- === TICKET TEMPLATES (read-only, to understand ticket format) ===
('designer', 'tickets.templates.read'),

-- === EVENTS (read-only consultation) ===
('designer', 'events.read'),
('designer', 'events.list'),

-- === NOTIFICATIONS (designer-specific) ===
('designer', 'notifications.designer.send'),

-- === PROFILE (own profile) ===
('designer', 'users.read'),
('designer', 'users.update');

-- ========================================
-- 3c. USER
-- ========================================
-- Scope: basic consumer - browse events, buy tickets,
-- view own tickets, marketplace purchase.
-- NO access to: event management, guest management,
-- invitations management, ticket creation, scans management,
-- admin, system, design.

INSERT INTO role_permissions (role_code, permission_code) VALUES

-- === PROFILE (own profile) ===
('user', 'users.read'),
('user', 'users.update'),

-- === EVENTS (read-only consultation) ===
('user', 'events.read'),
('user', 'events.list'),

-- === TICKETS (view own tickets only) ===
('user', 'tickets.read'),

-- === MARKETPLACE (browse, purchase, review) ===
('user', 'marketplace.read'),
('user', 'marketplace.templates.read'),
('user', 'marketplace.templates.purchase'),
('user', 'marketplace.purchases.read'),
('user', 'marketplace.designers.read'),
('user', 'marketplace.reviews.read'),
('user', 'marketplace.reviews.create'),

-- === PAYMENTS (buy tickets/templates) ===
('user', 'payments.create'),
('user', 'payments.read'),

-- === QR CODE (present ticket for scanning as attendee) ===
('user', 'scans.qr.decode');

-- ========================================
-- 3d. SCAN OPERATOR
-- ========================================
-- Scope: dedicated on-site scanning role. Strictly minimal scan permissions,
-- NO event/guest/ticket management, NO admin. Distinct from organizer so that
-- gate staff can validate tickets without inheriting organizer privileges.

INSERT INTO role_permissions (role_code, permission_code) VALUES
('scan_operator', 'scans.validate'),
('scan_operator', 'scans.sessions.create'),
('scan_operator', 'scans.sessions.read'),
('scan_operator', 'scans.history.read');

-- ========================================
-- 4. INSERT AUTHORIZATIONS FROM TEMP TABLE
-- ========================================

INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at, granted)
SELECT r.id, p.id, NULL, NOW(), NOW(), TRUE
FROM role_permissions rp
JOIN roles r ON r.code = rp.role_code AND r.deleted_at IS NULL
JOIN permissions p ON p.code = rp.permission_code AND p.deleted_at IS NULL
;

DROP TABLE role_permissions;
