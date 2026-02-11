import { Request, Response, NextFunction } from 'express';
import { config } from '../../config/environment';
import { AuthenticationError } from '../../utils/errors';

/**
 * API key authentication middleware.
 * Validates the X-API-Key header against the configured key.
 * Skipped in development mode if no API key is configured.
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
    // Skip auth in development/test if no key is configured
    if ((config.nodeEnv === 'development' || config.nodeEnv === 'test') && !config.apiKey) {
        next();
        return;
    }

    const apiKey = req.headers['x-api-key'] as string | undefined;

    if (!apiKey) {
        next(new AuthenticationError('Missing API key'));
        return;
    }

    // Constant-time comparison to prevent timing attacks
    if (!constantTimeCompare(apiKey, config.apiKey)) {
        next(new AuthenticationError('Invalid API key'));
        return;
    }

    next();
}

function constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}
