import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/errors';
import { Logger } from '../../utils/logger';

/**
 * Global error handling middleware.
 * Operational errors return appropriate HTTP status codes.
 * Programmer errors log the stack trace and return 500.
 */
export function errorHandler(logger: Logger) {
    return (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
        if (err instanceof AppError) {
            // Operational error — expected, safe to expose
            logger.warn('Operational error', {
                code: err.code,
                message: err.message,
                statusCode: err.statusCode,
            });

            res.status(err.statusCode).json({
                success: false,
                error: {
                    code: err.code,
                    message: err.message,
                    details: err.details,
                },
                timestamp: new Date().toISOString(),
            });
            return;
        }

        // Programmer error — log full details, return generic message
        logger.error('Unexpected error', {
            message: err.message,
            stack: err.stack,
        });

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An internal server error occurred',
            },
            timestamp: new Date().toISOString(),
        });
    };
}
