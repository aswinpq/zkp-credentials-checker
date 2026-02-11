/**
 * Application-specific error classes with error codes for consistent handling.
 */

export enum ErrorCode {
    // Credential errors
    INVALID_CREDENTIAL = 'INVALID_CREDENTIAL',
    CREDENTIAL_NOT_FOUND = 'CREDENTIAL_NOT_FOUND',
    CREDENTIAL_SET_NOT_FOUND = 'CREDENTIAL_SET_NOT_FOUND',
    DUPLICATE_CREDENTIAL = 'DUPLICATE_CREDENTIAL',
    CREDENTIAL_LIMIT_EXCEEDED = 'CREDENTIAL_LIMIT_EXCEEDED',

    // Proof errors
    PROOF_GENERATION_FAILED = 'PROOF_GENERATION_FAILED',
    PROOF_VERIFICATION_FAILED = 'PROOF_VERIFICATION_FAILED',
    PROOF_EXPIRED = 'PROOF_EXPIRED',
    INVALID_PROOF_STRUCTURE = 'INVALID_PROOF_STRUCTURE',

    // Crypto errors
    HASH_FAILED = 'HASH_FAILED',
    RANDOM_GENERATION_FAILED = 'RANDOM_GENERATION_FAILED',

    // Circuit errors
    CIRCUIT_NOT_FOUND = 'CIRCUIT_NOT_FOUND',
    CIRCUIT_INITIALIZATION_FAILED = 'CIRCUIT_INITIALIZATION_FAILED',
    VERIFICATION_KEY_NOT_FOUND = 'VERIFICATION_KEY_NOT_FOUND',

    // Root manager errors
    UNTRUSTED_ROOT = 'UNTRUSTED_ROOT',
    INVALID_ROOT_FORMAT = 'INVALID_ROOT_FORMAT',

    // System errors
    INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',

    // API errors
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    UNAUTHORIZED = 'UNAUTHORIZED',
    BAD_REQUEST = 'BAD_REQUEST',
    NOT_FOUND = 'NOT_FOUND',
}

/**
 * Base application error with error code and optional details.
 */
export class AppError extends Error {
    public readonly code: ErrorCode;
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly details?: readonly string[];

    constructor(
        code: ErrorCode,
        message: string,
        statusCode: number = 500,
        isOperational: boolean = true,
        details?: readonly string[],
    ) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;
        this.name = 'AppError';

        // Maintain proper stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: readonly string[]) {
        super(ErrorCode.VALIDATION_ERROR, message, 400, true, details);
        this.name = 'ValidationError';
    }
}

export class CredentialError extends AppError {
    constructor(code: ErrorCode, message: string) {
        super(code, message, 400, true);
        this.name = 'CredentialError';
    }
}

export class ProofError extends AppError {
    constructor(code: ErrorCode, message: string) {
        super(code, message, 400, true);
        this.name = 'ProofError';
    }
}

export class CircuitError extends AppError {
    constructor(code: ErrorCode, message: string) {
        super(code, message, 500, true);
        this.name = 'CircuitError';
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(ErrorCode.UNAUTHORIZED, message, 401, true);
        this.name = 'AuthenticationError';
    }
}

/**
 * Check whether an error is an operational (expected) error.
 */
export function isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
}
