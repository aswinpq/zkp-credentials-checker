/**
 * Security-related configuration constants.
 */
export const securityConfig = {
    /** Content Security Policy directives */
    csp: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameSrc: ["'none'"],
    },

    /** HSTS configuration */
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
    },

    /** Rate limiting tiers */
    rateLimiting: {
        global: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100,
        },
        proofGeneration: {
            windowMs: 60 * 1000, // 1 minute
            max: 10,
        },
        verification: {
            windowMs: 60 * 1000, // 1 minute
            max: 50,
        },
    },

    /** Request size limits */
    requestLimits: {
        jsonBodyLimit: '10kb',
        urlEncodedLimit: '10kb',
    },

    /** CORS configuration */
    cors: {
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
        exposedHeaders: ['X-Request-Id'],
        credentials: true,
        maxAge: 86400, // 24 hours
    },

    /** API key header name */
    apiKeyHeader: 'x-api-key',

    /** Proof expiration defaults */
    proofExpiry: {
        defaultHours: 24,
        maxHours: 168, // 1 week
    },
} as const;
