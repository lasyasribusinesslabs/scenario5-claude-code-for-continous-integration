const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePaginationParams(query) {
  const page = Math.max(1, parseInt(query.page, 10) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

async function paginatedQuery(pool, baseQuery, params, paginationParams) {
  const { limit, offset } = paginationParams;

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM (${baseQuery}) AS subq`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataResult = await pool.query(
    `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return {
    data: dataResult.rows,
    pagination: {
      total,
      page: paginationParams.page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

function buildCursorClause(cursor, direction = 'after') {
  if (!cursor) {
    return { clause: '', params: [] };
  }

  const operator = direction === 'after' ? '>' : '<';
  return {
    clause: `AND id ${operator} $`,
    params: [cursor],
  };
}

module.exports = { parsePaginationParams, paginatedQuery, buildCursorClause };
