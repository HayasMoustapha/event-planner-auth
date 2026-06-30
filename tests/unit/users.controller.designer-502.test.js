/**
 * Proof (designer-502, controller wiring): the actual cross-service path is
 * core -> auth GET /api/internal/auth/users/:id -> usersController.getById.
 *
 * An invalid/missing :id (0, -1, non-numeric, or the literal "search" that the
 * census reported leaking into /users/:id) must NOT bubble up as an uncaught
 * 500/502. The controller must forward a TYPED ValidationError to next(), and
 * the global error middleware must serialize it as a clean HTTP 400 with the
 * stable USER_ID_INVALID code. The repository must never be hit.
 */
jest.mock('../../src/modules/users/users.repository');
jest.mock('../../src/modules/accesses/accesses.repository');
jest.mock('../../src/modules/auth/auth.service');
jest.mock('../../../shared/clients/notification-client', () => ({}), { virtual: true });

const usersRepository = require('../../src/modules/users/users.repository');
const usersController = require('../../src/modules/users/users.controller');
const { errorHandler } = require('../../src/middlewares/error.middleware');

afterEach(() => jest.clearAllMocks());

describe('usersController.getById -> typed 400 (designer-502 controller path)', () => {
  const invalidIds = ['0', '-1', 'abc', 'search'];

  test.each(invalidIds)('id=%s -> next(ValidationError 400 USER_ID_INVALID), repo not hit', async (id) => {
    const req = { params: { id } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await usersController.getById(req, res, next);

    // Controller must delegate the typed error, never answer directly.
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 400,
      code: 'USER_ID_INVALID',
      name: 'ValidationError'
    });
    expect(usersRepository.findById).not.toHaveBeenCalled();
  });

  test('full controller -> errorHandler chain serializes a 400 (not 500/502)', async () => {
    const req = { params: { id: 'search' } };
    const next = jest.fn();
    await usersController.getById(req, {}, next);

    const err = next.mock.calls[0][0];
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).not.toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      code: 'USER_ID_INVALID'
    }));
  });
});
