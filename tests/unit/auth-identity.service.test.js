jest.mock('../../src/modules/people/people.repository', () => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../../src/modules/users/users.repository', () => ({
  findByEmail: jest.fn(),
  findByPersonId: jest.fn(),
}));

const peopleRepository = require('../../src/modules/people/people.repository');
const usersRepository = require('../../src/modules/users/users.repository');
const authIdentityService = require('../../src/modules/auth/auth-identity.service');

describe('authIdentityService.resolveByEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes the email and resolves a guest through person lookup first', async () => {
    peopleRepository.findByEmail.mockResolvedValue({
      id: 14,
      email: 'ge.abessolo@gmail.com',
    });
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.findByPersonId.mockResolvedValue({
      id: 15,
      email: 'ge.abessolo@gmail.com',
      person_id: 14,
    });

    const result = await authIdentityService.resolveByEmail('  GE.ABESSOLO@GMAIL.COM  ');

    expect(peopleRepository.findByEmail).toHaveBeenCalledWith('ge.abessolo@gmail.com');
    expect(usersRepository.findByEmail).toHaveBeenCalledWith('ge.abessolo@gmail.com', false);
    expect(usersRepository.findByPersonId).toHaveBeenCalledWith(14, false);
    expect(result).toEqual({
      normalizedEmail: 'ge.abessolo@gmail.com',
      person: {
        id: 14,
        email: 'ge.abessolo@gmail.com',
      },
      user: {
        id: 15,
        email: 'ge.abessolo@gmail.com',
        person_id: 14,
      },
    });
  });

  it('falls back from the user row to the linked person when only users.email matches', async () => {
    peopleRepository.findByEmail.mockResolvedValue(null);
    usersRepository.findByEmail.mockResolvedValue({
      id: 27,
      email: 'guest.only.user@example.com',
      person_id: 91,
    });
    peopleRepository.findById.mockResolvedValue({
      id: 91,
      email: 'guest.only.user@example.com',
    });

    const result = await authIdentityService.resolveByEmail('guest.only.user@example.com');

    expect(peopleRepository.findById).toHaveBeenCalledWith(91);
    expect(result.person).toEqual({
      id: 91,
      email: 'guest.only.user@example.com',
    });
    expect(result.user).toEqual({
      id: 27,
      email: 'guest.only.user@example.com',
      person_id: 91,
    });
  });
});
