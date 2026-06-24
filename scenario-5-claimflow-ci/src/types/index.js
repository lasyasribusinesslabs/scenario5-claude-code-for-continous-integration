/**
 * @typedef {Object} UserResponse
 * @property {number} id
 * @property {string} email
 * @property {string} role
 * BUG: missing createdAt field — userRoutes.js returns createdAt in GET /users/:id response
 * This cross-file mismatch means callers relying on this type definition will miss the field.
 */

/**
 * @typedef {Object} ApiError
 * @property {string} error - Human-readable error message
 * @property {number} [code] - Optional internal error code
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {Array} data - The result items
 * @property {Object} pagination
 * @property {number} pagination.total - Total number of records
 * @property {number} pagination.page - Current page number
 * @property {number} pagination.limit - Items per page
 * @property {number} pagination.totalPages - Total number of pages
 */

/**
 * @typedef {Object} LoginRequest
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} token - JWT bearer token
 * @property {number} userId
 */

/**
 * @typedef {Object} ClaimStatus
 * @property {'pending' | 'approved' | 'rejected' | 'under_review'} status
 * @property {string} [reason]
 */

module.exports = {};
