import { ZKProof, SerializedProof } from '../../types/proof.types';
import { Logger } from '../../utils/logger';
import { ProofError, ErrorCode } from '../../utils/errors';

/**
 * Serializes and deserializes ZK proofs for transport.
 * Handles conversion between the internal ZKProof type and the wire format.
 */
export class ProofSerializer {
    private readonly logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    /**
     * Serialize a ZKProof to a transport-safe format.
     */
    public serialize(proof: ZKProof): SerializedProof {
        try {
            return {
                proof: JSON.stringify(proof.proof),
                publicSignals: [...proof.publicSignals],
                metadata: {
                    proofId: proof.metadata.proofId,
                    credentialSetId: proof.metadata.credentialSetId,
                    merkleRoot: proof.metadata.merkleRoot,
                    timestamp: proof.metadata.timestamp.toISOString(),
                    expiresAt: proof.metadata.expiresAt.toISOString(),
                    version: proof.metadata.version,
                    circuitId: proof.metadata.circuitId,
                },
            };
        } catch {
            this.logger.error('Failed to serialize proof');
            throw new ProofError(ErrorCode.PROOF_GENERATION_FAILED, 'Failed to serialize proof');
        }
    }

    /**
     * Deserialize a transport-format proof back to a ZKProof.
     */
    public deserialize(serialized: SerializedProof): ZKProof {
        try {
            return {
                proof: typeof serialized.proof === 'string'
                    ? JSON.parse(serialized.proof)
                    : serialized.proof as ZKProof['proof'],
                publicSignals: [...serialized.publicSignals],
                metadata: {
                    proofId: serialized.metadata.proofId,
                    credentialSetId: serialized.metadata.credentialSetId,
                    merkleRoot: serialized.metadata.merkleRoot,
                    timestamp: new Date(serialized.metadata.timestamp),
                    expiresAt: new Date(serialized.metadata.expiresAt),
                    version: serialized.metadata.version,
                    circuitId: serialized.metadata.circuitId,
                },
            };
        } catch {
            this.logger.error('Failed to deserialize proof');
            throw new ProofError(ErrorCode.INVALID_PROOF_STRUCTURE, 'Invalid serialized proof format');
        }
    }

    /**
     * Validate a serialized proof has all required fields.
     */
    public validate(serialized: unknown): serialized is SerializedProof {
        if (!serialized || typeof serialized !== 'object') {
            return false;
        }

        const s = serialized as Record<string, unknown>;

        if (typeof s.proof !== 'string' && typeof s.proof !== 'object') {
            return false;
        }
        if (!Array.isArray(s.publicSignals)) {
            return false;
        }
        if (!s.metadata || typeof s.metadata !== 'object') {
            return false;
        }

        const meta = s.metadata as Record<string, unknown>;
        const requiredFields = [
            'proofId',
            'credentialSetId',
            'merkleRoot',
            'timestamp',
            'expiresAt',
            'version',
            'circuitId',
        ];

        return requiredFields.every((field) => typeof meta[field] === 'string');
    }
}
