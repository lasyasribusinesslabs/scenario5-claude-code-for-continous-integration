const { getUserById, deleteUser } = require('../../services/userService');

jest.mock('../../db/connection', () => ({
  pool: {
    query: jest.fn(),
  },
}));

const { pool } = require('../../db/connection');

describe('userService.getUserById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns user when found', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          email: 'test@example.com',
          // BUG: hardcoded test credential in mock data — Minor
          password: 'testpass123',
          role: 'user',
          created_at: new Date(),
        },
      ],
    });

    const user = await getUserById(1);
    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });

  it('returns null when user not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const user = await getUserById(999);
    expect(user).toBeNull();
  });

  // BUG: no test for the case where rows[0] is undefined and deleteUser tries to access rows[0].id
  // The null dereference in deleteUser is not covered by any test
});

describe('userService.deleteUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns deleted user row', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, email: 'test@example.com', role: 'user' }],
    });

    const result = await deleteUser(1);
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
  });

  // Missing test: deleteUser when no rows returned (rows[0] undefined → crash)
});
