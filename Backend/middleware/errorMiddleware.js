exports.errorHandler = (err, req, res, next) => {
  if (err?.name === "MongooseServerSelectionError") {
    return res.status(503).json({
      message: "Database is unavailable right now. Please try again in a moment.",
    });
  }

  if (err?.name === "ValidationError") {
    return res.status(400).json({
      message: err.message || "Validation failed.",
    });
  }

  if (err?.name === "CastError") {
    return res.status(400).json({
      message: "Invalid identifier format.",
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Server Error",
    ...(process.env.NODE_ENV !== "production" ? { type: err.name } : {}),
  });
};