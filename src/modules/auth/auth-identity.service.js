const peopleRepository = require('../people/people.repository');
const usersRepository = require('../users/users.repository');
const { cleanEmail } = require('../../utils/validators');

class AuthIdentityService {
  normalizeEmail(email) {
    return cleanEmail(email);
  }

  async resolveByEmail(email, options = {}) {
    const { includePassword = false } = options;
    const normalizedEmail = this.normalizeEmail(email);

    if (!normalizedEmail) {
      return {
        normalizedEmail: '',
        person: null,
        user: null,
      };
    }

    let person = await peopleRepository.findByEmail(normalizedEmail);
    let user = await usersRepository.findByEmail(normalizedEmail, includePassword);

    if (!person && user?.person_id) {
      person = await peopleRepository.findById(user.person_id);
    }

    if (!user && person?.id) {
      user = await usersRepository.findByPersonId(person.id, includePassword);
    }

    return {
      normalizedEmail,
      person: person || null,
      user: user || null,
    };
  }
}

module.exports = new AuthIdentityService();
