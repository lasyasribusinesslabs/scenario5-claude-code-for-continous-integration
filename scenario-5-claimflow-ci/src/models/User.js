// BUG: missing updatedAt field — userService.js references updated_at in UPDATE queries
// BUG: password field is not excluded from serialization — API responses will leak password hashes

const UserSchema = {
  id: 'number',
  email: 'string',
  password: 'string',
  role: 'string',
  createdAt: 'Date',
  // updatedAt is missing — cross-file mismatch with userService updateUser()
};

class User {
  constructor({ id, email, password, role, createdAt }) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.role = role;
    this.createdAt = createdAt;
  }

  // BUG: toJSON does not strip the password field — any JSON.stringify(user) leaks the hash
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      password: this.password,
      role: this.role,
      createdAt: this.createdAt,
    };
  }

  static fromRow(row) {
    return new User({
      id: row.id,
      email: row.email,
      password: row.password,
      role: row.role,
      createdAt: row.created_at,
    });
  }
}

module.exports = { User, UserSchema };
