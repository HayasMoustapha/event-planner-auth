const peopleRepository = require('./people.repository');

class PeopleService {
  async getAll(options = {}) {
    const { page, limit, search } = options;
    return await peopleRepository.findAll({ page, limit, search });
  }

  async getById(id) {
    const person = await peopleRepository.findById(id);
    if (!person) {
      throw new Error('Personne non trouvée');
    }
    return person;
  }

  async create(personData) {
    // Vérifier si l'email existe déjà
    if (personData.email) {
      const existingPerson = await peopleRepository.findByEmail(personData.email);
      if (existingPerson) {
        throw new Error('Une personne avec cet email existe déjà');
      }
    }

    return await peopleRepository.create(personData);
  }

  async update(id, updateData) {
    // Vérifier si la personne existe
    const existingPerson = await peopleRepository.findById(id);
    if (!existingPerson) {
      throw new Error('Personne non trouvée');
    }

    // Si l'email est modifié, vérifier s'il n'existe pas déjà
    if (updateData.email && updateData.email !== existingPerson.email) {
      const existingEmail = await peopleRepository.findByEmail(updateData.email);
      if (existingEmail) {
        throw new Error('Une personne avec cet email existe déjà');
      }
    }

    return await peopleRepository.update(id, updateData);
  }

  async delete(id) {
    // Vérifier si la personne existe
    const person = await peopleRepository.findById(id);
    if (!person) {
      throw new Error('Personne non trouvée');
    }

    // Vérifier si la personne est associée à un utilisateur
    const hasUser = await peopleRepository.hasAssociatedUser(id);
    if (hasUser) {
      throw new Error('Impossible de supprimer cette personne car elle est associée à un utilisateur');
    }

    await peopleRepository.delete(id);
  }
}

module.exports = new PeopleService();
