/**
 * Rôle dédié 'scan_operator' (P2).
 * Avant : le scan supposait le rôle organizer (qui possède bien trop de droits
 * pour un simple opérateur de porte). Ces tests prouvent qu'un rôle distinct
 * 'scan_operator' existe avec UNIQUEMENT les permissions de scan minimales,
 * et que l'ajout est strictement additif (les rôles existants sont inchangés).
 *
 * Source de vérité : les seeds SQL (roles.seed.sql / authorizations.seed.sql)
 * réellement exécutés par RbacSeeder.seedFromSqlFiles(). On vérifie aussi les
 * définitions JS du seeder. Aucune base réelle n'est touchée (config DB mockée,
 * SQL lu en lecture seule sur le disque).
 */

const fs = require('fs');
const path = require('path');

// Évite la création d'un Pool PostgreSQL réel à l'import du seeder.
jest.mock('../../src/config/database', () => ({
  connection: { query: jest.fn(), connect: jest.fn() },
  pool: { query: jest.fn() },
  dbConfig: {},
  dbType: 'postgres'
}));

const rbacSeeder = require('../../src/database/seeders/rbac-seeder');

const EXPECTED_SCAN_PERMISSIONS = [
  'scans.validate',
  'scans.sessions.create',
  'scans.sessions.read',
  'scans.history.read'
];

const seedDir = path.join(__dirname, '../../database/seeds/seeds');
const rolesSql = fs.readFileSync(path.join(seedDir, 'roles.seed.sql'), 'utf8');
const authorizationsSql = fs.readFileSync(path.join(seedDir, 'authorizations.seed.sql'), 'utf8');

describe('RBAC — rôle dédié scan_operator', () => {
  describe('Définitions JS du seeder', () => {
    test('le rôle scan_operator est défini', () => {
      const roleCodes = rbacSeeder.defaultRoles.map((r) => r.code);
      expect(roleCodes).toContain('scan_operator');

      const role = rbacSeeder.defaultRoles.find((r) => r.code === 'scan_operator');
      expect(role.is_system).toBe(false);
      expect(role.label.en).toBe('Scan Operator');
    });

    test('scan_operator possède exactement les permissions de scan minimales', () => {
      const grants = rbacSeeder.rolePermissions['scan_operator'];
      expect(grants).toBeDefined();
      expect(grants.sort()).toEqual([...EXPECTED_SCAN_PERMISSIONS].sort());
    });

    test('toutes les permissions de scan_operator sont déclarées dans defaultPermissions', () => {
      const permCodes = rbacSeeder.defaultPermissions.map((p) => p.code);
      for (const code of EXPECTED_SCAN_PERMISSIONS) {
        expect(permCodes).toContain(code);
      }
    });

    test('ajout additif : les rôles existants ne sont pas modifiés', () => {
      // organizer conserve sa gestion d'événements
      expect(rbacSeeder.rolePermissions['organizer']).toContain('events.create');
      expect(rbacSeeder.rolePermissions['organizer']).toContain('tickets.validate');
      // designer / user inchangés
      expect(rbacSeeder.rolePermissions['designer']).toContain('marketplace.create');
      expect(rbacSeeder.rolePermissions['user']).toContain('events.read');
      // scan_operator n'hérite PAS des droits de gestion d'organizer
      expect(rbacSeeder.rolePermissions['scan_operator']).not.toContain('events.create');
      expect(rbacSeeder.rolePermissions['scan_operator']).not.toContain('events.delete');
    });
  });

  describe('Source de vérité SQL', () => {
    test('roles.seed.sql définit scan_operator et le préserve du cleanup', () => {
      expect(rolesSql).toContain("'scan_operator'");
      // Présent dans l'allowlist du DELETE (NOT IN ...) -> non supprimé.
      expect(rolesSql).toMatch(/NOT IN \([^)]*'scan_operator'[^)]*\)/);
    });

    test('authorizations.seed.sql octroie les permissions de scan à scan_operator', () => {
      for (const code of EXPECTED_SCAN_PERMISSIONS) {
        expect(authorizationsSql).toContain(`('scan_operator', '${code}')`);
      }
    });

    test('authorizations.seed.sql gère scan_operator comme rôle cible (reset additif)', () => {
      expect(authorizationsSql).toMatch(/IN \([^)]*'scan_operator'[^)]*\)/);
    });
  });
});
