/**
 * Per-file reset for the self-contained cert suite (setupFilesAfterEnv). Runs before every test FILE
 * and restores the isolated DB to the seeded baseline (truncate all + re-apply seeds), so flow-tests
 * that mutate shared seed state (e.g. change the admin password) cannot pollute the next file.
 * Requires maxWorkers:1 (see jest.selfcontained.config.json) so files run serially.
 *
 * NB: files whose in-process module-cache state (not just DB rows) leaks across files under the shared
 * maxWorkers:1 worker (e.g. e2e-manual) are run as SEPARATE jest invocations by the cert runner, not
 * added to this shared config.
 */
const { resetData } = require('./db-provision');

beforeAll(async () => {
  await resetData();
});
