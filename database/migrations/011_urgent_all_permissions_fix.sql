-- Migration d'urgence: Ajouter toutes les permissions manquantes et assigner au super admin
-- Généré le 2026-01-24 - URGENT FIX

-- ========================================
-- PERMISSIONS EVENT-PLANNER-CORE
-- ========================================
INSERT INTO permissions (code, label, "group", description, created_at, updated_at) VALUES
('events.create', '{"en": "Create Event", "fr": "Créer un événement"}', 'events', '{"en": "Create a new event", "fr": "Créer un nouvel événement"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('events.read', '{"en": "Read Events", "fr": "Lire les événements"}', 'events', '{"en": "Read event details", "fr": "Lire les détails des événements"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('events.update', '{"en": "Update Event", "fr": "Mettre à jour un événement"}', 'events', '{"en": "Update event information", "fr": "Mettre à jour les informations d''un événement"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('events.delete', '{"en": "Delete Event", "fr": "Supprimer un événement"}', 'events', '{"en": "Delete an event", "fr": "Supprimer un événement"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('events.publish', '{"en": "Publish Event", "fr": "Publier un événement"}', 'events', '{"en": "Publish an event", "fr": "Publier un événement"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('events.archive', '{"en": "Archive Event", "fr": "Archiver un événement"}', 'events', '{"en": "Archive an event", "fr": "Archiver un événement"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('events.stats', '{"en": "Events Statistics", "fr": "Statistiques des événements"}', 'events', '{"en": "View events statistics", "fr": "Voir les statistiques des événements"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Permissions pour les guests
('guests.create', '{"en": "Create Guest", "fr": "Créer un invité"}', 'guests', '{"en": "Create a new guest", "fr": "Créer un nouvel invité"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('guests.read', '{"en": "Read Guests", "fr": "Lire les invités"}', 'guests', '{"en": "Read guest details", "fr": "Lire les détails des invités"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('guests.update', '{"en": "Update Guest", "fr": "Mettre à jour un invité"}', 'guests', '{"en": "Update guest information", "fr": "Mettre à jour les informations d''un invité"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('guests.delete', '{"en": "Delete Guest", "fr": "Supprimer un invité"}', 'guests', '{"en": "Delete a guest", "fr": "Supprimer un invité"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('guests.stats', '{"en": "Guests Statistics", "fr": "Statistiques des invités"}', 'guests', '{"en": "View guests statistics", "fr": "Voir les statistiques des invités"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Permissions pour les tickets
('tickets.create', '{"en": "Create Ticket", "fr": "Créer un ticket"}', 'tickets', '{"en": "Create a new ticket", "fr": "Créer un nouveau ticket"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tickets.read', '{"en": "Read Tickets", "fr": "Lire les tickets"}', 'tickets', '{"en": "Read ticket details", "fr": "Lire les détails des tickets"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tickets.update', '{"en": "Update Ticket", "fr": "Mettre à jour un ticket"}', 'tickets', '{"en": "Update ticket information", "fr": "Mettre à jour les informations d''un ticket"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tickets.delete', '{"en": "Delete Ticket", "fr": "Supprimer un ticket"}', 'tickets', '{"en": "Delete a ticket", "fr": "Supprimer un ticket"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tickets.stats', '{"en": "Tickets Statistics", "fr": "Statistiques des tickets"}', 'tickets', '{"en": "View tickets statistics", "fr": "Voir les statistiques des tickets"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- PERMISSIONS NOTIFICATION-SERVICE
-- ========================================
INSERT INTO permissions (code, label, "group", description, created_at, updated_at) VALUES
('notifications.email.send', '{"en": "Send Email", "fr": "Envoyer un email"}', 'notifications', '{"en": "Send transactional email", "fr": "Envoyer un email transactionnel"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('notifications.sms.send', '{"en": "Send SMS", "fr": "Envoyer un SMS"}', 'notifications', '{"en": "Send transactional SMS", "fr": "Envoyer un SMS transactionnel"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('notifications.email.queue', '{"en": "Queue Email", "fr": "Mettre en file d''attente un email"}', 'notifications', '{"en": "Queue email for sending", "fr": "Mettre en file d''attente un email"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('notifications.sms.queue', '{"en": "Queue SMS", "fr": "Mettre en file d''attente un SMS"}', 'notifications', '{"en": "Queue SMS for sending", "fr": "Mettre en file d''attente un SMS"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('notifications.email.bulk', '{"en": "Send Bulk Emails", "fr": "Envoyer des emails en lot"}', 'notifications', '{"en": "Send bulk emails", "fr": "Envoyer des emails en lot"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('notifications.sms.bulk', '{"en": "Send Bulk SMS", "fr": "Envoyer des SMS en lot"}', 'notifications', '{"en": "Send bulk SMS", "fr": "Envoyer des SMS en lot"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('notifications.bulk.mixed', '{"en": "Send Bulk Mixed", "fr": "Envoyer des notifications mixtes en lot"}', 'notifications', '{"en": "Send bulk mixed notifications", "fr": "Envoyer des notifications mixtes en lot"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('notifications.jobs.read', '{"en": "Read Jobs", "fr": "Lire les jobs"}', 'notifications', '{"en": "Read notification jobs", "fr": "Lire les jobs de notification"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('notifications.jobs.cancel', '{"en": "Cancel Job", "fr": "Annuler un job"}', 'notifications', '{"en": "Cancel notification job", "fr": "Annuler un job de notification"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('notifications.stats.read', '{"en": "Read Statistics", "fr": "Lire les statistiques"}', 'notifications', '{"en": "Read notification statistics", "fr": "Lire les statistiques des notifications"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('notifications.admin', '{"en": "Notifications Admin", "fr": "Admin notifications"}', 'notifications', '{"en": "Full notifications administration", "fr": "Administration complète des notifications"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('notifications.welcome.send', '{"en": "Send Welcome", "fr": "Envoyer bienvenue"}', 'notifications', '{"en": "Send welcome messages", "fr": "Envoyer des messages de bienvenue"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('notifications.password-reset.send', '{"en": "Send Password Reset", "fr": "Envoyer réinitialisation mot de passe"}', 'notifications', '{"en": "Send password reset messages", "fr": "Envoyer des messages de réinitialisation mot de passe"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('notifications.event-confirmation.send', '{"en": "Send Event Confirmation", "fr": "Envoyer confirmation événement"}', 'notifications', '{"en": "Send event confirmation messages", "fr": "Envoyer des messages de confirmation d''événement"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('notifications.otp.send', '{"en": "Send OTP", "fr": "Envoyer OTP"}', 'notifications', '{"en": "Send OTP messages", "fr": "Envoyer des messages OTP"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- PERMISSIONS PAYMENT-SERVICE
-- ========================================
INSERT INTO permissions (code, label, "group", description, created_at, updated_at) VALUES
('payments.stripe.create', '{"en": "Create Stripe Payment", "fr": "Créer paiement Stripe"}', 'payments', '{"en": "Create Stripe payment intent", "fr": "Créer une intention de paiement Stripe"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('payments.customers.read', '{"en": "Read Customers", "fr": "Lire les clients"}', 'payments', '{"en": "Read customer details", "fr": "Lire les détails des clients"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('payments.customers.create', '{"en": "Create Customer", "fr": "Créer un client"}', 'payments', '{"en": "Create a new customer", "fr": "Créer un nouveau client"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('payments.payment-methods.create', '{"en": "Create Payment Method", "fr": "Créer méthode de paiement"}', 'payments', '{"en": "Create payment method", "fr": "Créer une méthode de paiement"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('payments.payment-methods.read', '{"en": "Read Payment Methods", "fr": "Lire les méthodes de paiement"}', 'payments', '{"en": "Read payment methods", "fr": "Lire les méthodes de paiement"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('payments.paypal.create', '{"en": "Create PayPal Payment", "fr": "Créer paiement PayPal"}', 'payments', '{"en": "Create PayPal order", "fr": "Créer un ordre PayPal"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('payments.paypal.capture', '{"en": "Capture PayPal Payment", "fr": "Capturer paiement PayPal"}', 'payments', '{"en": "Capture PayPal payment", "fr": "Capturer un paiement PayPal"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('payments.read', '{"en": "Read Payments", "fr": "Lire les paiements"}', 'payments', '{"en": "Read payment details", "fr": "Lire les détails des paiements"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('payments.cancel', '{"en": "Cancel Payment", "fr": "Annuler paiement"}', 'payments', '{"en": "Cancel a payment", "fr": "Annuler un paiement"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('payments.refunds.create', '{"en": "Create Refund", "fr": "Créer remboursement"}', 'payments', '{"en": "Create a refund", "fr": "Créer un remboursement"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('payments.refunds.read', '{"en": "Read Refunds", "fr": "Lire les remboursements"}', 'payments', '{"en": "Read refund details", "fr": "Lire les détails des remboursements"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('payments.invoices.create', '{"en": "Create Invoice", "fr": "Créer facture"}', 'payments', '{"en": "Generate invoice", "fr": "Générer une facture"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('payments.invoices.read', '{"en": "Read Invoices", "fr": "Lire les factures"}', 'payments', '{"en": "Read invoice details", "fr": "Lire les détails des factures"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('payments.stats.read', '{"en": "Read Payment Statistics", "fr": "Lire statistiques paiements"}', 'payments', '{"en": "Read payment statistics", "fr": "Lire les statistiques des paiements"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- PERMISSIONS TICKET-GENERATOR-SERVICE
-- ========================================
INSERT INTO permissions (code, label, "group", description, created_at, updated_at) VALUES
('tickets.create', '{"en": "Create Ticket", "fr": "Créer un ticket"}', 'tickets', '{"en": "Generate a single ticket", "fr": "Générer un ticket unique"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tickets.batch.create', '{"en": "Create Batch Tickets", "fr": "Créer tickets en lot"}', 'tickets', '{"en": "Generate tickets in batch", "fr": "Générer des tickets en lot"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tickets.pdf.create', '{"en": "Create PDF Ticket", "fr": "Créer ticket PDF"}', 'tickets', '{"en": "Generate PDF for ticket", "fr": "Générer un PDF pour un ticket"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tickets.pdf.batch', '{"en": "Create Batch PDF", "fr": "Créer PDFs en lot"}', 'tickets', '{"en": "Generate PDFs in batch", "fr": "Générer des PDFs en lot"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tickets.full.batch', '{"en": "Full Batch Processing", "fr": "Traitement batch complet"}', 'tickets', '{"en": "Full batch ticket processing", "fr": "Traitement batch complet des tickets"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tickets.jobs.read', '{"en": "Read Ticket Jobs", "fr": "Lire les jobs de tickets"}', 'tickets', '{"en": "Read ticket generation jobs", "fr": "Lire les jobs de génération de tickets"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tickets.jobs.cancel', '{"en": "Cancel Ticket Job", "fr": "Annuler job de ticket"}', 'tickets', '{"en": "Cancel ticket generation job", "fr": "Annuler un job de génération de tickets"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tickets.stats.read', '{"en": "Read Ticket Statistics", "fr": "Lire statistiques tickets"}', 'tickets', '{"en": "Read ticket statistics", "fr": "Lire les statistiques des tickets"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tickets.admin', '{"en": "Tickets Admin", "fr": "Admin tickets"}', 'tickets', '{"en": "Full tickets administration", "fr": "Administration complète des tickets"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- PERMISSIONS SCAN-VALIDATION-SERVICE
-- ========================================
INSERT INTO permissions (code, label, "group", description, created_at, updated_at) VALUES
('scans.validate', '{"en": "Validate Ticket", "fr": "Valider un ticket"}', 'scans', '{"en": "Validate a ticket in real-time", "fr": "Valider un ticket en temps réel"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('scans.validate.offline', '{"en": "Validate Offline Ticket", "fr": "Valider ticket offline"}', 'scans', '{"en": "Validate a ticket in offline mode", "fr": "Valider un ticket en mode offline"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('scans.qr.generate', '{"en": "Generate QR Code", "fr": "Générer QR code"}', 'scans', '{"en": "Generate QR code for ticket", "fr": "Générer un QR code pour un ticket"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('scans.qr.batch', '{"en": "Generate Batch QR Codes", "fr": "Générer QR codes en lot"}', 'scans', '{"en": "Generate QR codes in batch", "fr": "Générer des QR codes en lot"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('scans.qr.test', '{"en": "Generate Test QR Code", "fr": "Générer QR code de test"}', 'scans', '{"en": "Generate test QR code", "fr": "Générer un QR code de test"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('scans.qr.decode', '{"en": "Decode QR Code", "fr": "Décoder QR code"}', 'scans', '{"en": "Decode and validate QR code", "fr": "Décoder et valider un QR code"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('scans.history.read', '{"en": "Read Scan History", "fr": "Lire historique des scans"}', 'scans', '{"en": "Read ticket scan history", "fr": "Lire l''historique des scans d''un ticket"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('scans.stats.read', '{"en": "Read Scan Statistics", "fr": "Lire statistiques des scans"}', 'scans', '{"en": "Read scan statistics", "fr": "Lire les statistiques des scans"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('scans.reports.generate', '{"en": "Generate Validation Report", "fr": "Générer rapport de validation"}', 'scans', '{"en": "Generate validation report", "fr": "Générer un rapport de validation"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('scans.offline.sync', '{"en": "Sync Offline Data", "fr": "Synchroniser données offline"}', 'scans', '{"en": "Synchronize offline data", "fr": "Synchroniser les données offline"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('scans.offline.read', '{"en": "Read Offline Data", "fr": "Lire données offline"}', 'scans', '{"en": "Read offline data", "fr": "Lire les données offline"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('scans.offline.cleanup', '{"en": "Cleanup Offline Data", "fr": "Nettoyer données offline"}', 'scans', '{"en": "Cleanup expired offline data", "fr": "Nettoyer les données offline expirées"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- ASSIGNATION COMPLÈTE AU SUPER ADMIN
-- ========================================
-- Assigner TOUTES les permissions au rôle super_admin
INSERT INTO authorizations (role_id, permission_id, menu_id, created_at, updated_at)
SELECT r.id as role_id, p.id as permission_id, 1 as menu_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'super_admin'
ON CONFLICT (role_id, permission_id, menu_id) DO NOTHING;
