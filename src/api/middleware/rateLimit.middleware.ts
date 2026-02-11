import rateLimit from 'express-rate-limit';
import { securityConfig } from '../../config/security.config';

/**
 * Global rate limiter.
 */
export const globalRateLimiter = rateLimit({
    windowMs: securityConfig.rateLimiting.global.windowMs,
    max: securityConfig.rateLimiting.global.max,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Stricter rate limiter for proof generation (expensive operation).
 */
export const proofGenerationLimiter = rateLimit({
    windowMs: securityConfig.rateLimiting.proofGeneration.windowMs,
    max: securityConfig.rateLimiting.proofGeneration.max,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Proof generation rate limit exceeded. Try again later.',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for verification endpoint.
 */
export const verificationLimiter = rateLimit({
    windowMs: securityConfig.rateLimiting.verification.windowMs,
    max: securityConfig.rateLimiting.verification.max,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Verification rate limit exceeded. Try again later.',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});
