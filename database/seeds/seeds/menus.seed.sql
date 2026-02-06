-- ========================================
-- SEED MENUS (minimal)
-- ========================================
INSERT INTO menus (parent_id, label, icon, route, component, parent_path, menu_group, sort_order, depth, description, is_visible, created_at, updated_at)
VALUES
(NULL, '{"en": "System", "fr": "Systeme"}'::jsonb, 'settings', '/admin', 'AdminLayout', '/admin', 1, 1, 0, '{"en": "System administration menu", "fr": "Menu d''administration systeme"}'::jsonb, TRUE, NOW(), NOW()),
(NULL, '{"en": "Events", "fr": "Evenements"}'::jsonb, 'calendar', '/events', 'EventsLayout', '/events', 1, 2, 0, '{"en": "Events module", "fr": "Module evenements"}'::jsonb, TRUE, NOW(), NOW()),
(NULL, '{"en": "Guests", "fr": "Invites"}'::jsonb, 'users', '/guests', 'GuestsLayout', '/guests', 1, 3, 0, '{"en": "Guests module", "fr": "Module invites"}'::jsonb, TRUE, NOW(), NOW()),
(NULL, '{"en": "Tickets", "fr": "Billets"}'::jsonb, 'ticket', '/tickets', 'TicketsLayout', '/tickets', 1, 4, 0, '{"en": "Tickets module", "fr": "Module billets"}'::jsonb, TRUE, NOW(), NOW()),
(NULL, '{"en": "Marketplace", "fr": "Marketplace"}'::jsonb, 'store', '/marketplace', 'MarketplaceLayout', '/marketplace', 1, 5, 0, '{"en": "Marketplace module", "fr": "Module marketplace"}'::jsonb, TRUE, NOW(), NOW())
ON CONFLICT DO NOTHING;
