/**
 * API request types.
 */

export interface GenerateProofRequest {
    readonly credentialSetId: string;
    readonly credential: string;
}

export interface VerifyProofRequest {
    readonly proof: string;
    readonly publicSignals: readonly string[];
    readonly metadata: {
        readonly proofId: string;
        readonly credentialSetId: string;
        readonly merkleRoot: string;
        readonly timestamp: string;
        readonly expiresAt: string;
        readonly version: string;
        readonly circuitId: string;
    };
}

export interface CreateCredentialSetRequest {
    readonly name: string;
    readonly description?: string;
    readonly credentials: readonly string[];
    readonly type?: string;
}

/**
 * API response types.
 */

export interface ApiResponse<T> {
    readonly success: boolean;
    readonly data?: T;
    readonly error?: ApiError;
    readonly timestamp: string;
}

export interface ApiError {
    readonly code: string;
    readonly message: string;
    readonly details?: readonly string[];
}

export interface ProofResponse {
    readonly proofId: string;
    readonly proof: string;
    readonly publicSignals: readonly string[];
    readonly metadata: {
        readonly credentialSetId: string;
        readonly merkleRoot: string;
        readonly expiresAt: string;
        readonly version: string;
    };
}

export interface VerificationResponse {
    readonly valid: boolean;
    readonly verifiedAt: string;
    readonly credentialSetId: string;
    readonly errors?: readonly string[];
    readonly warnings?: readonly string[];
}

export interface HealthResponse {
    readonly status: 'healthy' | 'degraded' | 'unhealthy';
    readonly version: string;
    readonly uptime: number;
    readonly timestamp: string;
    readonly checks: {
        readonly circuits: boolean;
        readonly memory: boolean;
    };
}

export interface CredentialSetResponse {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly credentialCount: number;
    readonly merkleRoot: string;
    readonly createdAt: string;
    readonly version: string;
}
