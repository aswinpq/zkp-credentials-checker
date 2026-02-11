import { Groth16Proof } from 'snarkjs';

/**
 * Represents a zero-knowledge proof with associated metadata.
 */
export interface ZKProof {
    readonly proof: Groth16Proof;
    readonly publicSignals: readonly string[];
    readonly metadata: ProofMetadata;
}

/**
 * Metadata associated with a zero-knowledge proof.
 */
export interface ProofMetadata {
    readonly proofId: string;
    readonly credentialSetId: string;
    readonly merkleRoot: string;
    readonly timestamp: Date;
    readonly expiresAt: Date;
    readonly version: string;
    readonly circuitId: string;
}

/**
 * Merkle proof for a credential's membership in a set.
 */
export interface MerkleProof {
    readonly leaf: string;
    readonly leafIndex: number;
    readonly root: string;
    readonly siblings: readonly MerkleProofElement[];
    readonly pathIndices: readonly number[];
}

/**
 * Single element in a Merkle proof path.
 */
export interface MerkleProofElement {
    readonly hash: string;
    readonly position: 'left' | 'right';
}

/**
 * Result of verifying a zero-knowledge proof.
 */
export interface VerificationResult {
    readonly valid: boolean;
    readonly verifiedAt: Date;
    readonly credentialSetId: string;
    readonly errors?: readonly string[];
    readonly warnings?: readonly string[];
}

/**
 * Input to the ZK circuit for proof generation.
 */
export interface CircuitInput {
    readonly root: string;
    readonly leaf: string;
    readonly pathElements: readonly string[];
    readonly pathIndices: readonly number[];
}

/**
 * Serialized proof for transport over the wire.
 */
export interface SerializedProof {
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
