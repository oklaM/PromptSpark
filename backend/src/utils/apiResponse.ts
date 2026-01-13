import { Response } from 'express';

/**
 * Standard API Response Format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

/**
 * Standard API response utilities
 * Ensures consistent response format across all endpoints
 */
export class ApiResponseUtil {
  /**
   * Send a successful response
   */
  static success<T>(res: Response, data: T, status: number = 200): void {
    const response: ApiResponse<T> = {
      success: true,
      data
    };
    res.status(status).json(response);
  }

  /**
   * Send a successful response with custom message
   */
  static successWithMessage<T>(
    res: Response,
    data: T,
    message: string,
    status: number = 200
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message
    };
    res.status(status).json(response);
  }

  /**
   * Send a created response (201)
   */
  static created<T>(res: Response, data: T): void {
    this.success(res, data, 201);
  }

  /**
   * Send a bad request response (400)
   */
  static badRequest(res: Response, message: string = 'Bad request', code?: string): void {
    const response: ApiResponse = {
      success: false,
      message,
      ...(code && { code })
    };
    res.status(400).json(response);
  }

  /**
   * Send an unauthorized response (401)
   */
  static unauthorized(res: Response, message: string = 'Unauthorized'): void {
    const response: ApiResponse = {
      success: false,
      message
    };
    res.status(401).json(response);
  }

  /**
   * Send a forbidden response (403)
   */
  static forbidden(res: Response, message: string = 'Forbidden', code?: string): void {
    const response: ApiResponse = {
      success: false,
      message,
      ...(code && { code })
    };
    res.status(403).json(response);
  }

  /**
   * Send a not found response (404)
   */
  static notFound(res: Response, message: string = 'Resource not found'): void {
    const response: ApiResponse = {
      success: false,
      message
    };
    res.status(404).json(response);
  }

  /**
   * Send a conflict response (409)
   */
  static conflict(res: Response, message: string = 'Resource already exists'): void {
    const response: ApiResponse = {
      success: false,
      message
    };
    res.status(409).json(response);
  }

  /**
   * Send an internal server error response (500)
   */
  static serverError(
    res: Response,
    message: string = 'Internal server error',
    error?: Error
  ): void {
    const response: ApiResponse = {
      success: false,
      message,
      ...(error && { error: error.message })
    };
    res.status(500).json(response);
  }

  /**
   * Send a paginated response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number
  ): void {
    const response: ApiResponse = {
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
    res.status(200).json(response);
  }
}

/**
 * Async handler wrapper to catch errors automatically
 * Reduces boilerplate try-catch blocks in route handlers
 */
export function asyncHandler(
  fn: (req: any, res: any, next: any) => Promise<any>
) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error('Async handler error:', error);
      ApiResponseUtil.serverError(res, error.message, error);
      next(error);
    });
  };
}
