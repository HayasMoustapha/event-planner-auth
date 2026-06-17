const DatabaseBootstrap = require('../../src/services/database-bootstrap.service');

/**
 * E-CI(auth) — Contrat de DatabaseBootstrap.
 *
 * NB : le module exporte une INSTANCE (`module.exports = new DatabaseBootstrap()`),
 * consommée telle quelle par `src/bootstrap.js` (`DatabaseBootstrap.initialize()`),
 * et NON une classe. L'ancien test attendait une classe (`new DatabaseBootstrap()`)
 * et des méthodes inexistantes (`verify`, `shutdown`) avec un mocking via
 * require.cache qui ne fonctionnait pas (il exécutait de vraies opérations DB).
 * Ce contrat valide la forme réelle de l'instance, sans dépendance externe.
 */
describe('DatabaseBootstrap contract (instance export)', () => {
  test('exporte une instance singleton DatabaseBootstrap', () => {
    expect(DatabaseBootstrap).toBeDefined();
    expect(typeof DatabaseBootstrap).toBe('object');
    expect(DatabaseBootstrap.constructor.name).toBe('DatabaseBootstrap');
  });

  test('expose les méthodes de cycle de vie réelles', () => {
    expect(typeof DatabaseBootstrap.initialize).toBe('function');
    expect(typeof DatabaseBootstrap.ensureDatabaseExists).toBe('function');
    expect(typeof DatabaseBootstrap.applyMigrations).toBe('function');
    expect(typeof DatabaseBootstrap.validateInstallation).toBe('function');
    expect(typeof DatabaseBootstrap.getMigrationStatus).toBe('function');
  });

  test('n\'expose PAS la méthode legacy runBootstrap (supprimée)', () => {
    expect(DatabaseBootstrap.runBootstrap).toBeUndefined();
  });

  test('est consommée comme instance (pas de `new`) — initialize directement appelable', () => {
    // src/bootstrap.js fait `await DatabaseBootstrap.initialize()` sur l'instance importée.
    expect(typeof DatabaseBootstrap.initialize).toBe('function');
  });
});
