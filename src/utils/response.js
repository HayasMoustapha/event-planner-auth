const successResponse = (message, data = null, meta = null) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return response;
};

const errorResponse = (message, errors = null, code = null) => {
  const response = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };

  if (errors !== null) {
    response.errors = errors;
  }

  if (code !== null) {
    response.code = code;
  }

  return response;
};

const paginatedResponse = (message, data, pagination) => {
  return successResponse(message, data, {
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: pagination.pages,
      hasNext: pagination.page < pagination.pages,
      hasPrev: pagination.page > 1
    }
  });
};

const createdResponse = (message, data = null) => {
  return {
    ...successResponse(message, data),
    statusCode: 201
  };
};

const noContentResponse = (message = 'Opération réussie') => {
  return {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    statusCode: 204
  };
};

const validationErrorResponse = (errors) => {
  return errorResponse('Erreur de validation', errors, 'VALIDATION_ERROR');
};

const notFoundResponse = (resource = 'Ressource') => {
  return errorResponse(`${resource} non trouvée`, null, 'NOT_FOUND');
};

const unauthorizedResponse = (message = 'Accès non autorisé') => {
  return errorResponse(message, null, 'UNAUTHORIZED');
};

const forbiddenResponse = (message = 'Accès refusé') => {
  return errorResponse(message, null, 'FORBIDDEN');
};

const conflictResponse = (message = 'Conflit de données') => {
  return errorResponse(message, null, 'CONFLICT');
};

const serverErrorResponse = (message = 'Erreur interne du serveur') => {
  return errorResponse(message, null, 'INTERNAL_SERVER_ERROR');
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  conflictResponse,
  serverErrorResponse
};
