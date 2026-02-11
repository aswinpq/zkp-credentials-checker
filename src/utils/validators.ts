import { CREDENTIAL_CONSTRAINTS } from '../types/credential.types';
import { ValidationError } from './errors';

/**
 * Validates a single credential string.
 */
export function validateCredential(credential: string, index?: number): void {
    const prefix = index !== undefined ? `Credential at index ${index}` : 'Credential';

    if (typeof credential !== 'string') {
        throw new ValidationError(`${prefix}: must be a string`);
    }

    const trimmed = credential.trim();
    if (trimmed.length === 0) {
        throw new ValidationError(`${prefix}: cannot be empty`);
    }

    if (credential.length > CREDENTIAL_CONSTRAINTS.MAX_CREDENTIAL_LENGTH) {
        throw new ValidationError(
            `${prefix}: exceeds maximum length of ${CREDENTIAL_CONSTRAINTS.MAX_CREDENTIAL_LENGTH} characters`,
        );
    }

    if (credential.length < CREDENTIAL_CONSTRAINTS.MIN_CREDENTIAL_LENGTH) {
        throw new ValidationError(
            `${prefix}: below minimum length of ${CREDENTIAL_CONSTRAINTS.MIN_CREDENTIAL_LENGTH} characters`,
        );
    }
}

/**
 * Validates an array of credential strings.
 */
export function validateCredentials(credentials: string[]): void {
    if (!Array.isArray(credentials)) {
        throw new ValidationError('Credentials must be an array');
    }

    if (credentials.length === 0) {
        throw new ValidationError('Credentials array cannot be empty');
    }

    if (credentials.length > CREDENTIAL_CONSTRAINTS.MAX_CREDENTIALS_PER_SET) {
        throw new ValidationError(
            `Maximum ${CREDENTIAL_CONSTRAINTS.MAX_CREDENTIALS_PER_SET} credentials per set`,
        );
    }

    // Check for duplicates
    const unique = new Set(credentials);
    if (unique.size !== credentials.length) {
        throw new ValidationError('Duplicate credentials are not allowed');
    }

    // Validate each credential
    credentials.forEach((cred, i) => validateCredential(cred, i));
}

/**
 * Validates a hex-encoded hash string (64 hex characters / 32 bytes).
 */
export function validateHexHash(value: string, label: string = 'Hash'): void {
    if (typeof value !== 'string') {
        throw new ValidationError(`${label}: must be a string`);
    }

    if (!/^[a-f0-9]{64}$/i.test(value)) {
        throw new ValidationError(`${label}: must be a 64-character hex string`);
    }
}

/**
 * Validates a UUID v4 string.
 */
export function validateUUID(value: string, label: string = 'ID'): void {
    if (typeof value !== 'string') {
        throw new ValidationError(`${label}: must be a string`);
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
        throw new ValidationError(`${label}: must be a valid UUID v4`);
    }
}

/**
 * Sanitizes a string for safe logging (removes control characters).
 */
export function sanitizeForLogging(value: string, maxLength: number = 100): string {
    return value
        .replace(/[\x00-\x1F\x7F]/g, '') // strip control chars
        .substring(0, maxLength);
}
