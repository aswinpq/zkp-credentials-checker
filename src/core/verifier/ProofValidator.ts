import { ZKProof, SerializedProof } from '../../types/proof.types';
import { Logger } from '../../utils/logger';
import { ProofSerializer } from '../prover/ProofSerializer';
import { ProofError, ErrorCode } from '../../utils/errors';

/**
 * Validates proof data before verification.
 * Acts as a pre-filter to catch obvious issues before expensive crypto operations.
 */
export class ProofValidator {
    private readonly serializer: ProofSerializer;

    constructor(logger: Logger) {
        this.serializer = new ProofSerializer(logger);
    }

    /**
     * Validate and deserialize raw proof input from an API request.
     */
    public validateAndDeserialize(input: unknown): ZKProof {
        if (!this.serializer.validate(input)) {
            throw new ProofError(ErrorCode.INVALID_PROOF_STRUCTURE, 'Invalid proof format');
        }

        return this.serializer.deserialize(input as SerializedProof);
    }

    /**
     * Perform pre-verification checks on a proof.
     * Returns an array of error messages (empty if the proof passes).
     */
    public preValidate(proof: ZKProof): string[] {
        const errors: string[] = [];

        // Check required fields
        if (!proof.proof) {
            errors.push('Missing proof data');
        }
        if (!proof.publicSignals || proof.publicSignals.length === 0) {
            errors.push('Missing public signals');
        }
        if (!proof.metadata) {
            errors.push('Missing proof metadata');
        }

        // Check metadata fields
        if (proof.metadata) {
            if (!proof.metadata.proofId) {
                errors.push('Missing proof ID');
            }
            if (!proof.metadata.credentialSetId) {
                errors.push('Missing credential set ID');
            }
            if (!proof.metadata.merkleRoot) {
                errors.push('Missing Merkle root');
            }
            if (!proof.metadata.circuitId) {
                errors.push('Missing circuit ID');
            }

            // Check timestamp validity
            if (proof.metadata.timestamp > new Date()) {
                errors.push('Proof timestamp is in the future');
            }

            // Check expiration
            if (proof.metadata.expiresAt <= proof.metadata.timestamp) {
                errors.push('Proof expiration must be after timestamp');
            }
        }

        return errors;
    }
}
