/**
 * Represents a verifiable credential.
 */
export interface Credential {
    readonly id: string;
    readonly value: string;
    readonly setId: string;
    readonly metadata?: CredentialMetadata;
}

/**
 * Metadata associated with a credential.
 */
export interface CredentialMetadata {
    readonly issuer: string;
    readonly issuedAt: Date;
    readonly expiresAt?: Date;
    readonly revocable: boolean;
}

/**
 * A set of credentials with an associated Merkle root.
 */
export interface CredentialSet {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly credentials: readonly string[];
    readonly merkleRoot: string;
    readonly createdAt: Date;
    readonly version: string;
}

/**
 * Types of credential sets.
 */
export enum CredentialSetType {
    UNIVERSITIES = 'universities',
    COMPANIES = 'companies',
    CERTIFICATIONS = 'certifications',
    CUSTOM = 'custom',
}

/**
 * Options for creating a credential set.
 */
export interface CreateCredentialSetOptions {
    readonly name: string;
    readonly description?: string;
    readonly credentials: readonly string[];
    readonly type?: CredentialSetType;
}

/**
 * Credential validation constraints.
 */
export const CREDENTIAL_CONSTRAINTS = {
    MAX_CREDENTIALS_PER_SET: 1024,
    MAX_CREDENTIAL_LENGTH: 256,
    MIN_CREDENTIAL_LENGTH: 1,
} as const;
