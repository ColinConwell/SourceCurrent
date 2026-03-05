import { Request, Response } from "express";

/**
 * Standardized error response format.
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

/**
 * Standardized success response format.
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

/**
 * Send a standardized error response, logging the error server-side.
 */
export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  error?: unknown
) {
  if (error) {
    console.error(`[${statusCode}] ${message}:`, error);
  }

  const response: ApiErrorResponse = {
    success: false,
    error: message,
  };

  // In development, include error details for debugging
  if (process.env.NODE_ENV === "development" && error) {
    response.details =
      error instanceof Error ? error.message : String(error);
  }

  res.status(statusCode).json(response);
}

/**
 * Send a standardized success response.
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };
  res.status(statusCode).json(response);
}
