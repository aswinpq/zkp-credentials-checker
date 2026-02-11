import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Security middleware that adds protective headers and request tracking.
 */
export function securityMiddleware(_req: Request, res: Response, next: NextFunction): void {
    // Add unique request ID for tracing
    const requestId = uuidv4();
    res.setHeader('X-Request-Id', requestId);

    // Prevent caching of sensitive responses
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Remove server identification
    res.removeHeader('X-Powered-By');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy
    res.setHeader(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=()',
    );

    next();
}
