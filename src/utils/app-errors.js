/**
 * Erreurs applicatives typees pour une gestion d'erreurs explicite (meilleur UX).
 * Chaque erreur porte un statusCode HTTP et un code stable cote client.
 * Le middleware d'erreurs honore err.statusCode + err.code en priorite.
 */
class AppError extends Error {
  constructor(message, { statusCode = 500, code = 'INTERNAL_ERROR', details = undefined } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    if (details !== undefined) this.details = details;
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, code = 'VALIDATION_ERROR', details = undefined) {
    super(message, { statusCode: 400, code, details });
    this.name = 'ValidationError';
  }
}
class NotFoundError extends AppError {
  constructor(message, code = 'NOT_FOUND') { super(message, { statusCode: 404, code }); }
}
class ConflictError extends AppError {
  constructor(message, code = 'CONFLICT') { super(message, { statusCode: 409, code }); }
}
class UnauthorizedError extends AppError {
  constructor(message, code = 'UNAUTHORIZED') { super(message, { statusCode: 401, code }); }
}
class ForbiddenError extends AppError {
  constructor(message, code = 'FORBIDDEN') { super(message, { statusCode: 403, code }); }
}

module.exports = { AppError, ValidationError, NotFoundError, ConflictError, UnauthorizedError, ForbiddenError };