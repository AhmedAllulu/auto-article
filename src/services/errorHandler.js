import { genLog, genError } from './logger.js';

/**
 * Enhanced error handling service that provides consistent error handling
 * patterns across the application with proper logging and recovery mechanisms.
 */

/**
 * Standard error types for consistent error handling
 */
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  API_ERROR: 'API_ERROR',
  GENERATION_ERROR: 'GENERATION_ERROR',
  TRANSLATION_ERROR: 'TRANSLATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR'
};

/**
 * Enhanced error class with additional context and metadata
 */
export class AppError extends Error {
  constructor(message, type = ErrorTypes.GENERATION_ERROR, context = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.recoverable = this.isRecoverable(type);
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
  
  /**
   * Determine if error type is recoverable
   */
  isRecoverable(type) {
    const recoverableTypes = [
      ErrorTypes.NETWORK_ERROR,
      ErrorTypes.API_ERROR,
      ErrorTypes.TIMEOUT_ERROR
    ];
    return recoverableTypes.includes(type);
  }
  
  /**
   * Convert to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      context: this.context,
      timestamp: this.timestamp,
      recoverable: this.recoverable,
      stack: this.stack
    };
  }
}

/**
 * Retry mechanism for recoverable operations
 */
export async function withRetry(operation, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryCondition = (error) => error.recoverable,
    context = 'unknown operation'
  } = options;
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const result = await operation();
      
      if (attempt > 1) {
        genLog('Operation succeeded after retry', {
          context,
          attempt,
          totalAttempts: attempt
        });
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Don't retry on last attempt
      if (attempt > maxRetries) {
        break;
      }
      
      // Check if error is retryable
      if (!retryCondition(error)) {
        genError('Operation failed with non-retryable error', {
          context,
          attempt,
          error: error.message,
          type: error.type || 'unknown'
        }, false);
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      );
      
      genLog('Operation failed, retrying', {
        context,
        attempt,
        maxRetries,
        delayMs: delay,
        error: error.message,
        type: error.type || 'unknown'
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries exhausted
  genError('Operation failed after all retries', {
    context,
    totalAttempts: maxRetries + 1,
    finalError: lastError.message,
    type: lastError.type || 'unknown'
  });
  
  throw lastError;
}

/**
 * Safe execution wrapper that catches and logs errors
 */
export async function safeExecute(operation, options = {}) {
  const {
    context = 'unknown operation',
    fallbackValue = null,
    throwOnError = true,
    logLevel = 'error'
  } = options;
  
  try {
    return await operation();
  } catch (error) {
    const errorInfo = {
      context,
      error: error.message,
      type: error.type || 'unknown',
      stack: error.stack
    };
    
    if (logLevel === 'error') {
      genError(`Safe execution failed: ${context}`, errorInfo, false);
    } else {
      genLog(`Safe execution failed: ${context}`, errorInfo, logLevel);
    }
    
    if (throwOnError) {
      throw error;
    }
    
    return fallbackValue;
  }
}

/**
 * Validation helper that throws AppError for invalid data
 */
export function validateRequired(data, requiredFields, context = 'validation') {
  const missing = [];
  
  for (const field of requiredFields) {
    if (!data || data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    throw new AppError(
      `Missing required fields: ${missing.join(', ')}`,
      ErrorTypes.VALIDATION_ERROR,
      { context, missing, provided: Object.keys(data || {}) }
    );
  }
}

/**
 * Database operation wrapper with enhanced error handling
 */
export async function withDatabaseErrorHandling(operation, context = 'database operation') {
  try {
    return await operation();
  } catch (error) {
    // Check for specific database error codes
    let errorType = ErrorTypes.DATABASE_ERROR;
    let message = `Database operation failed: ${error.message}`;
    
    if (error.code) {
      switch (error.code) {
        case '23505': // Unique violation
          errorType = ErrorTypes.VALIDATION_ERROR;
          message = 'Duplicate entry - record already exists';
          break;
        case '23503': // Foreign key violation
          errorType = ErrorTypes.VALIDATION_ERROR;
          message = 'Invalid reference - related record not found';
          break;
        case '42P01': // Table does not exist
          errorType = ErrorTypes.CONFIGURATION_ERROR;
          message = 'Database table not found - check migration status';
          break;
        case '28P01': // Invalid password
        case '28000': // Invalid authorization
          errorType = ErrorTypes.CONFIGURATION_ERROR;
          message = 'Database authentication failed';
          break;
        case '08006': // Connection failure
        case '08001': // Unable to connect
          errorType = ErrorTypes.NETWORK_ERROR;
          message = 'Database connection failed';
          break;
      }
    }
    
    throw new AppError(message, errorType, {
      context,
      originalError: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
  }
}

/**
 * API operation wrapper with enhanced error handling
 */
export async function withApiErrorHandling(operation, context = 'API operation') {
  try {
    return await operation();
  } catch (error) {
    let errorType = ErrorTypes.API_ERROR;
    let message = `API operation failed: ${error.message}`;
    
    // Handle axios/HTTP errors
    if (error.response) {
      const status = error.response.status;
      
      if (status >= 400 && status < 500) {
        errorType = ErrorTypes.VALIDATION_ERROR;
        message = `API client error (${status}): ${error.response.data?.message || error.message}`;
      } else if (status >= 500) {
        errorType = ErrorTypes.API_ERROR;
        message = `API server error (${status}): ${error.response.data?.message || error.message}`;
      }
      
      // Handle rate limiting
      if (status === 429) {
        errorType = ErrorTypes.QUOTA_EXCEEDED;
        message = 'API rate limit exceeded';
      }
    } else if (error.request) {
      errorType = ErrorTypes.NETWORK_ERROR;
      message = 'Network error - no response received from API';
    }
    
    throw new AppError(message, errorType, {
      context,
      originalError: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

/**
 * Express error handler middleware
 */
export function expressErrorHandler(err, req, res, next) {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }
  
  // Handle AppError instances
  if (err instanceof AppError) {
    genError('Express error handler caught AppError', {
      type: err.type,
      message: err.message,
      context: err.context,
      url: req.url,
      method: req.method
    }, false);
    
    const statusCode = getStatusCodeForErrorType(err.type);
    return res.status(statusCode).json({
      error: err.message,
      type: err.type,
      timestamp: err.timestamp
    });
  }
  
  // Handle other errors
  genError('Express error handler caught unhandled error', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  }, false);
  
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
}

/**
 * Map error types to HTTP status codes
 */
function getStatusCodeForErrorType(errorType) {
  const statusMap = {
    [ErrorTypes.VALIDATION_ERROR]: 400,
    [ErrorTypes.RESOURCE_NOT_FOUND]: 404,
    [ErrorTypes.QUOTA_EXCEEDED]: 429,
    [ErrorTypes.CONFIGURATION_ERROR]: 500,
    [ErrorTypes.DATABASE_ERROR]: 500,
    [ErrorTypes.API_ERROR]: 502,
    [ErrorTypes.NETWORK_ERROR]: 503,
    [ErrorTypes.TIMEOUT_ERROR]: 504,
    [ErrorTypes.GENERATION_ERROR]: 500,
    [ErrorTypes.TRANSLATION_ERROR]: 500
  };
  
  return statusMap[errorType] || 500;
}

export default {
  AppError,
  ErrorTypes,
  withRetry,
  safeExecute,
  validateRequired,
  withDatabaseErrorHandling,
  withApiErrorHandling,
  expressErrorHandler
};
