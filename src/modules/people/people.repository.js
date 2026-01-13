const { connection } = require('../../config/database');

class PeopleRepository {
  async findAll(options = {}) {
    const { page = 1, limit = 10, search } = options;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM people';
    let countQuery = 'SELECT COUNT(*) as total FROM people';
    const params = [];

    if (search) {
      const searchCondition = ` WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?`;
      query += searchCondition;
      countQuery += searchCondition;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [people] = await connection.execute(query, params);
    const [countResult] = await connection.execute(countQuery, search ? params.slice(0, -2) : []);

    return {
      data: people,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    };
  }

  async findById(id) {
    const query = 'SELECT * FROM people WHERE id = ?';
    const [people] = await connection.execute(query, [id]);
    return people[0] || null;
  }

  async findByEmail(email) {
    const query = 'SELECT * FROM people WHERE email = ?';
    const [people] = await connection.execute(query, [email]);
    return people[0] || null;
  }

  async create(personData) {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      city,
      country,
      postalCode
    } = personData;

    const query = `
      INSERT INTO people (first_name, last_name, email, phone, date_of_birth, address, city, country, postal_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(query, [
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      city,
      country,
      postalCode
    ]);

    return this.findById(result.insertId);
  }

  async update(id, updateData) {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      city,
      country,
      postalCode
    } = updateData;

    const query = `
      UPDATE people 
      SET first_name = ?, last_name = ?, email = ?, phone = ?, date_of_birth = ?, 
          address = ?, city = ?, country = ?, postal_code = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await connection.execute(query, [
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      city,
      country,
      postalCode,
      id
    ]);

    return this.findById(id);
  }

  async delete(id) {
    const query = 'DELETE FROM people WHERE id = ?';
    await connection.execute(query, [id]);
  }

  async hasAssociatedUser(personId) {
    const query = 'SELECT COUNT(*) as count FROM users WHERE person_id = ?';
    const [result] = await connection.execute(query, [personId]);
    return result[0].count > 0;
  }
}

module.exports = new PeopleRepository();
