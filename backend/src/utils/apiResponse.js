export class ApiError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

export function sendData(res, data, meta = undefined, status = 200) {
  return res.status(status).json({
    data,
    ...(meta ? { meta } : {}),
    error: null,
  });
}

export function sendError(res, error) {
  const status = error.status || 500;
  return res.status(status).json({
    data: null,
    error: {
      code: error.code || "internal_error",
      message: error.message || "Internal server error",
      ...(error.details ? { details: error.details } : {}),
    },
  });
}
