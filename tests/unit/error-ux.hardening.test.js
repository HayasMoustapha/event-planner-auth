/**
 * Proof: systematic ERROR-UX hardening of the auth service.
 *
 * Every hardened client-error path must now throw a TYPED AppError carrying a
 * stable UPPER_SNAKE `code` + the correct HTTP `statusCode`, instead of a generic
 * `new Error(...)` that bubbled to a 500 (or relied on fragile message sniffing).
 *
 * Repos are mocked; we assert { statusCode, code, name } and that the
 * user-facing message is preserved. We also assert the global error middleware
 * serializes these typed errors with the stable code in the body.
 */
jest.mock('../../src/modules/users/users.repository');
jest.mock('../../src/modules/accesses/accesses.repository');
jest.mock('../../src/modules/roles/roles.repository');
jest.mock('../../src/modules/permissions/permissions.repository');
jest.mock('../../src/modules/people/people.repository');
jest.mock('../../src/modules/auth/auth.service');
jest.mock('../../../shared/clients/notification-client', () => ({}), { virtual: true });

const usersRepository = require('../../src/modules/users/users.repository');
const peopleRepository = require('../../src/modules/people/people.repository');
const accessesRepository = require('../../src/modules/accesses/accesses.repository');
const rolesRepository = require('../../src/modules/roles/roles.repository');
const permissionsRepository = require('../../src/modules/permissions/permissions.repository');

const usersService = require('../../src/modules/users/users.service');
const rolesService = require('../../src/modules/roles/roles.service');
const permissionsService = require('../../src/modules/permissions/permissions.service');
const accessesService = require('../../src/modules/accesses/accesses.service');

const { errorHandler } = require('../../src/middlewares/error.middleware');
const {
  AppError, ValidationError, NotFoundError, ConflictError, UnauthorizedError, ForbiddenError
} = require('../../src/utils/app-errors');

afterEach(() => jest.clearAllMocks());

describe('UsersService — typed client errors', () => {
  test('authenticate: missing email -> 400 EMAIL_REQUIRED', async () => {
    await expect(usersService.authenticate('', 'x'))
      .rejects.toMatchObject({ statusCode: 400, code: 'EMAIL_REQUIRED', name: 'ValidationError' });
  });

  test('authenticate: bad credentials -> 401 INVALID_CREDENTIALS (not 500)', async () => {
    usersRepository.verifyPassword.mockResolvedValue(null);
    await expect(usersService.authenticate('a@b.co', 'Secret123'))
      .rejects.toMatchObject({ statusCode: 401, code: 'INVALID_CREDENTIALS' });
  });

  test('authenticate: locked account -> 403 ACCOUNT_LOCKED', async () => {
    usersRepository.verifyPassword.mockResolvedValue({ id: 1, status: 'lock' });
    await expect(usersService.authenticate('a@b.co', 'Secret123'))
      .rejects.toMatchObject({ statusCode: 403, code: 'ACCOUNT_LOCKED', name: 'ForbiddenError' });
  });

  test('authenticate: disabled account -> 403 ACCOUNT_DISABLED', async () => {
    usersRepository.verifyPassword.mockResolvedValue({ id: 1, status: 'inactive' });
    await expect(usersService.authenticate('a@b.co', 'Secret123'))
      .rejects.toMatchObject({ statusCode: 403, code: 'ACCOUNT_DISABLED' });
  });

  test('create: duplicate email -> 409 EMAIL_ALREADY_EXISTS', async () => {
    peopleRepository.findById.mockResolvedValue({ id: 5 });
    usersRepository.findByEmail.mockResolvedValue({ id: 9 });
    await expect(usersService.create({
      username: 'validuser', email: 'dup@b.co', password: 'Secret123', person_id: 5
    })).rejects.toMatchObject({ statusCode: 409, code: 'EMAIL_ALREADY_EXISTS', name: 'ConflictError' });
  });

  test('update: unknown user -> 404 USER_NOT_FOUND', async () => {
    usersRepository.findById.mockResolvedValue(null);
    await expect(usersService.update(123, { email: 'a@b.co' }))
      .rejects.toMatchObject({ statusCode: 404, code: 'USER_NOT_FOUND', name: 'NotFoundError' });
  });

  test('updateStatus: invalid status -> 400 STATUS_INVALID', async () => {
    await expect(usersService.updateStatus(1, 'banana'))
      .rejects.toMatchObject({ statusCode: 400, code: 'STATUS_INVALID' });
  });

  test('updateStatus: cannot lock self -> 403 CANNOT_LOCK_SELF', async () => {
    await expect(usersService.updateStatus(7, 'lock', 7))
      .rejects.toMatchObject({ statusCode: 403, code: 'CANNOT_LOCK_SELF' });
  });

  test('updatePassword: wrong current password -> 401 CURRENT_PASSWORD_INCORRECT', async () => {
    usersRepository.findById.mockResolvedValue({ id: 1, email: 'a@b.co' });
    usersRepository.verifyPassword.mockResolvedValue(null);
    await expect(usersService.updatePassword(1, 'OldPass123', 'NewPass123'))
      .rejects.toMatchObject({ statusCode: 401, code: 'CURRENT_PASSWORD_INCORRECT' });
  });

  test('removeRole: user lacks role -> 404 USER_ROLE_NOT_FOUND', async () => {
    accessesRepository.findByUserId.mockResolvedValue([{ role_id: 99 }]);
    await expect(usersService.removeRole(1, 5))
      .rejects.toMatchObject({ statusCode: 404, code: 'USER_ROLE_NOT_FOUND' });
  });

  test('getByEmail: message preserved on typed error', async () => {
    await expect(usersService.getByEmail('not-an-email'))
      .rejects.toMatchObject({ code: 'EMAIL_INVALID', message: 'Format d\'email invalide' });
  });
});

describe('RoleService — typed client errors', () => {
  test('getRoleById: invalid id -> 400 ROLE_ID_INVALID', async () => {
    await expect(rolesService.getRoleById(0))
      .rejects.toMatchObject({ statusCode: 400, code: 'ROLE_ID_INVALID' });
  });

  test('getRoleById: unknown role -> 404 ROLE_NOT_FOUND', async () => {
    rolesRepository.findById.mockResolvedValue(null);
    await expect(rolesService.getRoleById(42))
      .rejects.toMatchObject({ statusCode: 404, code: 'ROLE_NOT_FOUND', name: 'NotFoundError' });
  });

  test('createRole: missing code -> 400 ROLE_CODE_REQUIRED', async () => {
    await expect(rolesService.createRole({ label: { fr: 'x' } }))
      .rejects.toMatchObject({ statusCode: 400, code: 'ROLE_CODE_REQUIRED' });
  });

  test('createRole: duplicate code -> 409 ROLE_CODE_ALREADY_EXISTS', async () => {
    rolesRepository.findAll.mockResolvedValue({ roles: [{ id: 1, code: 'admin' }] });
    await expect(rolesService.createRole({ code: 'admin', label: { fr: 'Admin' } }))
      .rejects.toMatchObject({ statusCode: 409, code: 'ROLE_CODE_ALREADY_EXISTS' });
  });

  test('deleteRole: role still in use -> 409 ROLE_IN_USE', async () => {
    rolesRepository.findById.mockResolvedValue({ id: 1, code: 'user' });
    rolesRepository.getRoleUsers.mockResolvedValue({ users: [{ id: 5 }] });
    await expect(rolesService.deleteRole(1))
      .rejects.toMatchObject({ statusCode: 409, code: 'ROLE_IN_USE' });
  });
});

describe('PermissionService — typed client errors', () => {
  test('getPermissionById: invalid id -> 400 PERMISSION_ID_INVALID', async () => {
    await expect(permissionsService.getPermissionById(-1))
      .rejects.toMatchObject({ statusCode: 400, code: 'PERMISSION_ID_INVALID' });
  });

  test('getPermissionById: unknown -> 404 PERMISSION_NOT_FOUND', async () => {
    permissionsRepository.findById.mockResolvedValue(null);
    await expect(permissionsService.getPermissionById(7))
      .rejects.toMatchObject({ statusCode: 404, code: 'PERMISSION_NOT_FOUND' });
  });

  test('createPermission: duplicate code -> 409 PERMISSION_CODE_ALREADY_EXISTS', async () => {
    permissionsRepository.findAll.mockResolvedValue({ permissions: [{ id: 1 }] });
    await expect(permissionsService.createPermission({ code: 'users.read' }))
      .rejects.toMatchObject({ statusCode: 409, code: 'PERMISSION_CODE_ALREADY_EXISTS' });
  });

  test('deletePermission: critical system permission -> 409 PERMISSION_SYSTEM_PROTECTED', async () => {
    permissionsRepository.findById.mockResolvedValue({ id: 1, code: 'users.delete' });
    await expect(permissionsService.deletePermission(1))
      .rejects.toMatchObject({ statusCode: 409, code: 'PERMISSION_SYSTEM_PROTECTED' });
  });
});

describe('AccessesService — typed client errors', () => {
  test('createAccess: invalid user id -> 400 USER_ID_INVALID', async () => {
    await expect(accessesService.createAccess({ userId: 0, roleId: 1 }))
      .rejects.toMatchObject({ statusCode: 400, code: 'USER_ID_INVALID' });
  });

  test('createAccess: unknown user -> 404 USER_NOT_FOUND', async () => {
    usersRepository.findById.mockResolvedValue(null);
    await expect(accessesService.createAccess({ userId: 5, roleId: 1 }))
      .rejects.toMatchObject({ statusCode: 404, code: 'USER_NOT_FOUND' });
  });

  test('createAccess: duplicate access -> 409 ACCESS_ALREADY_EXISTS', async () => {
    usersRepository.findById.mockResolvedValue({ id: 5 });
    rolesRepository.findById.mockResolvedValue({ id: 1 });
    accessesRepository.findByUserIdAndRoleId.mockResolvedValue({ id: 77 });
    await expect(accessesService.createAccess({ userId: 5, roleId: 1 }))
      .rejects.toMatchObject({ statusCode: 409, code: 'ACCESS_ALREADY_EXISTS', name: 'ConflictError' });
  });

  test('getAccessById: unknown access -> 404 ACCESS_NOT_FOUND', async () => {
    accessesRepository.findById.mockResolvedValue(null);
    await expect(accessesService.getAccessById(9))
      .rejects.toMatchObject({ statusCode: 404, code: 'ACCESS_NOT_FOUND' });
  });

  test('updateAccessStatus: invalid status -> 400 STATUS_INVALID', async () => {
    await expect(accessesService.updateAccessStatus(1, 'frozen'))
      .rejects.toMatchObject({ statusCode: 400, code: 'STATUS_INVALID' });
  });
});

describe('errorHandler serializes typed AppErrors with stable code', () => {
  const run = (err) => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorHandler(err, {}, res, () => {});
    return res;
  };

  test('NotFoundError -> 404 + code in body', () => {
    const res = run(new NotFoundError('Rôle non trouvé', 'ROLE_NOT_FOUND'));
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false, code: 'ROLE_NOT_FOUND', message: 'Rôle non trouvé'
    }));
  });

  test('ConflictError -> 409 + code in body', () => {
    const res = run(new ConflictError('Cet utilisateur a déjà ce rôle', 'ACCESS_ALREADY_EXISTS'));
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'ACCESS_ALREADY_EXISTS' }));
  });

  test('UnauthorizedError -> 401 + code in body', () => {
    const res = run(new UnauthorizedError('Token invalide ou expiré', 'TOKEN_INVALID'));
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'TOKEN_INVALID' }));
  });

  test('ForbiddenError -> 403 + code in body', () => {
    const res = run(new ForbiddenError('Ce compte est verrouillé.', 'ACCOUNT_LOCKED'));
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'ACCOUNT_LOCKED' }));
  });

  test('generic AppError default -> 500 with code (genuine server fault keeps a code)', () => {
    const res = run(new AppError('Boom interne'));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'INTERNAL_ERROR' }));
  });
});
