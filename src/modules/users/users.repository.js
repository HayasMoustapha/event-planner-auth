const { connection } = require('../../config/database');

class UsersRepository {
  async findAll(options = {}) {
    const { page = 1, limit = 10, search, status } = options;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.*, p.first_name, p.last_name, p.email as person_email, p.phone
      FROM users u
      JOIN people p ON u.person_id = p.id
    `;
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM users u
      JOIN people p ON u.person_id = p.id
    `;
    const params = [];

    const conditions = [];

    if (search) {
      conditions.push('(u.username LIKE ? OR p.first_name LIKE ? OR p.last_name LIKE ? OR u.email LIKE ?)');
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (status !== undefined) {
      conditions.push('u.is_active = ?');
      params.push(status === 'true' ? 1 : 0);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [users] = await connection.execute(query, params);
    const [countResult] = await connection.execute(countQuery, search || status !== undefined ? params.slice(0, -2) : []);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    };
  }

  async findById(id) {
    const query = 'SELECT * FROM users WHERE id = ?';
    const [users] = await connection.execute(query, [id]);
    return users[0] || null;
  }

  async findByIdWithPerson(id) {
    const query = `
      SELECT u.*, p.first_name, p.last_name, p.email as person_email, p.phone, 
             p.date_of_birth, p.address, p.city, p.country, p.postal_code
      FROM users u
      JOIN people p ON u.person_id = p.id
      WHERE u.id = ?
    `;
    const [users] = await connection.execute(query, [id]);
    return users[0] || null;
  }

  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [users] = await connection.execute(query, [email]);
    return users[0] || null;
  }

  async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = ?';
    const [users] = await connection.execute(query, [username]);
    return users[0] || null;
  }

  async create(userData) {
    const { personId, username, email, passwordHash, createdBy } = userData;

    const query = `
      INSERT INTO users (person_id, username, email, password_hash, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    const [result] = await connection.execute(query, [
      personId,
      username,
      email,
      passwordHash
    ]);

    return this.findById(result.insertId);
  }

  async update(id, updateData) {
    const { username, email, passwordHash, isActive, isVerified } = updateData;

    let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const params = [];

    if (username !== undefined) {
      query += ', username = ?';
      params.push(username);
    }

    if (email !== undefined) {
      query += ', email = ?';
      params.push(email);
    }

    if (passwordHash !== undefined) {
      query += ', password_hash = ?';
      params.push(passwordHash);
    }

    if (isActive !== undefined) {
      query += ', is_active = ?';
      params.push(isActive ? 1 : 0);
    }

    if (isVerified !== undefined) {
      query += ', is_verified = ?';
      params.push(isVerified ? 1 : 0);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await connection.execute(query, params);
    return this.findById(id);
  }

  async updateLastLogin(id) {
    const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
    await connection.execute(query, [id]);
  }

  async updatePassword(id, passwordHash) {
    const query = 'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await connection.execute(query, [passwordHash, id]);
  }

  async verifyEmail(id) {
    const query = 'UPDATE users SET is_verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await connection.execute(query, [id]);
  }

  async delete(id) {
    const query = 'DELETE FROM users WHERE id = ?';
    await connection.execute(query, [id]);
  }

  async getUserRoles(userId) {
    const query = `
      SELECT r.* 
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
      ORDER BY r.name
    `;
    const [roles] = await connection.execute(query, [userId]);
    return roles;
  }

  async getUserPermissions(userId) {
    const query = `
      SELECT DISTINCT p.*
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
      ORDER BY p.resource, p.action
    `;
    const [permissions] = await connection.execute(query, [userId]);
    return permissions;
  }

  async findRoleById(roleId) {
    const query = 'SELECT * FROM roles WHERE id = ?';
    const [roles] = await connection.execute(query, [roleId]);
    return roles[0] || null;
  }

  async hasRole(userId, roleId) {
    const query = 'SELECT COUNT(*) as count FROM user_roles WHERE user_id = ? AND role_id = ?';
    const [result] = await connection.execute(query, [userId, roleId]);
    return result[0].count > 0;
  }

  async assignRole(userId, roleId, assignedBy) {
    const query = `
      INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `;
    await connection.execute(query, [userId, roleId, assignedBy]);
  }

  async assignRoles(userId, roleIds, assignedBy) {
    if (roleIds.length === 0) return;

    const values = roleIds.map(roleId => [userId, roleId, assignedBy]).flat();
    const placeholders = roleIds.map(() => '(?, ?, ?, CURRENT_TIMESTAMP)').join(', ');
    
    const query = `INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at) VALUES ${placeholders}`;
    await connection.execute(query, values);
  }

  async removeRole(userId, roleId) {
    const query = 'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?';
    await connection.execute(query, [userId, roleId]);
  }

  async countSuperAdmins() {
    const query = `
      SELECT COUNT(*) as count
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'super_admin' AND u.is_active = TRUE
    `;
    const [result] = await connection.execute(query);
    return result[0].count;
  }
}

module.exports = new UsersRepository();
