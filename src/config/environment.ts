import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config();

/**
 * Strongly-typed application configuration derived from environment variables.
 */
export interface AppConfig {
    readonly nodeEnv: string;
    readonly port: number;
    readonly host: string;
    readonly apiKey: string;
    readonly jwtSecret: string;
    readonly corsOrigin: string;
    readonly rateLimitWindowMs: number;
    readonly rateLimitMaxRequests: number;
    readonly logLevel: string;
    readonly logFile: string;
    readonly circuitName: string;
    readonly circuitsPath: string;
    readonly proofExpiryHours: number;
    readonly maxCredentialsPerSet: number;
    readonly maxMerkleDepth: number;
}

function getEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

function getEnvInt(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (value === undefined) {
        return defaultValue;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

export const config: AppConfig = {
    nodeEnv: getEnv('NODE_ENV', 'development'),
    port: getEnvInt('PORT', 3000),
    host: getEnv('HOST', 'localhost'),
    apiKey: getEnv('API_KEY', ''),
    jwtSecret: getEnv('JWT_SECRET', ''),
    corsOrigin: getEnv('CORS_ORIGIN', 'http://localhost:3000'),
    rateLimitWindowMs: getEnvInt('RATE_LIMIT_WINDOW_MS', 900000),
    rateLimitMaxRequests: getEnvInt('RATE_LIMIT_MAX_REQUESTS', 100),
    logLevel: getEnv('LOG_LEVEL', 'info'),
    logFile: getEnv('LOG_FILE', ''),
    circuitName: getEnv('CIRCUIT_NAME', 'credential'),
    circuitsPath: getEnv('CIRCUITS_PATH', path.join(process.cwd(), 'public/circuits/credential')),
    proofExpiryHours: getEnvInt('PROOF_EXPIRY_HOURS', 24),
    maxCredentialsPerSet: getEnvInt('MAX_CREDENTIALS_PER_SET', 1024),
    maxMerkleDepth: getEnvInt('MAX_MERKLE_DEPTH', 10),
};

/**
 * Validate that critical config values are set in production.
 */
export function validateConfig(): string[] {
    const errors: string[] = [];

    if (config.nodeEnv === 'production') {
        if (!config.apiKey) {
            errors.push('API_KEY must be set in production');
        }
        if (!config.jwtSecret) {
            errors.push('JWT_SECRET must be set in production');
        }
        if (config.jwtSecret.length < 32) {
            errors.push('JWT_SECRET must be at least 32 characters');
        }
    }

    if (config.port < 1 || config.port > 65535) {
        errors.push('PORT must be between 1 and 65535');
    }

    return errors;
}
