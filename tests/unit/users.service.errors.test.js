/**
 * Proof: designer-502 hardening + explicit error UX.
 * UsersService.getById must throw TYPED errors (statusCode + stable code),
 * and the global error middleware must honor them (no more generic 500/502/401).
 */
jest.mock('../../src/modules/users/users.repository');
jest.mock('../../src/modules/accesses/accesses.repository');
jest.mock('../../src/modules/auth/auth.service');
jest.mock('../../../shared/clients/notification-client', () => ({}), { virtual: true });

const usersRepository = require('../../src/modules/users/users.repository');
const usersService = require('../../src/modules/users/users.service');
const { errorHandler } = require('../../src/middlewares/error.middleware');
const { ValidationError } = require('../../src/utils/app-errors');

describe('UsersService.getById -> typed errors (designer-502)', () => {
  afterEach(() => jest.clearAllMocks());

  test('id=0 -> ValidationError 400 USER_ID_INVALID, repo not hit', async () => {
    await expect(usersService.getById(0)).rejects.toMatchObject({ statusCode: 400, code: 'USER_ID_INVALID', name: 'ValidationError' });
    expect(usersRepository.findById).not.toHaveBeenCalled();
  });
  test('negative id -> 400', async () => {
    await expect(usersService.getById(-5)).rejects.toMatchObject({ statusCode: 400, code: 'USER_ID_INVALID' });
  });
  test('non-numeric id -> 400 (not a 502)', async () => {
    await expect(usersService.getById('abc')).rejects.toMatchObject({ statusCode: 400, code: 'USER_ID_INVALID' });
  });
  test('unknown id -> NotFoundError 404 USER_NOT_FOUND', async () => {
    usersRepository.findById.mockResolvedValue(null);
    await expect(usersService.getById(999)).rejects.toMatchObject({ statusCode: 404, code: 'USER_NOT_FOUND', name: 'NotFoundError' });
  });
  test('valid id -> returns user', async () => {
    usersRepository.findById.mockResolvedValue({ id: 7, email: 'a@b.co' });
    await expect(usersService.getById(7)).resolves.toEqual({ id: 7, email: 'a@b.co' });
  });
});

describe('errorHandler honors typed AppError', () => {
  test('ValidationError -> 400 + code in body', () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorHandler(new ValidationError('Champ X invalide', 'X_INVALID'), {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, code: 'X_INVALID', message: 'Champ X invalide' }));
  });
});