import * as snarkjs from 'snarkjs';
import { PoseidonManager } from '../../core/crypto/PoseidonManager';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { ZKProof, MerkleProof, ProofMetadata } from '../../types/proof.types';
import { Logger } from '../../utils/logger';
import { CircuitManager } from './CircuitManager';
import { ProofError, ErrorCode } from '../../utils/errors';
import { config } from '../../config/environment';

/**
 * Generates zero-knowledge proofs using Groth16.
 *
 * Security considerations:
 * - Validates all inputs before proof generation
 * - Uses cryptographically secure randomness
 * - Supports nullifiers to prevent double-use
 * - Proofs have configurable expiration
 */
export class ZKProver {
    private readonly circuitManager: CircuitManager;
    private readonly logger: Logger;
    private initialized: boolean = false;

    constructor(circuitManager: CircuitManager, logger: Logger) {
        this.circuitManager = circuitManager;
        this.logger = logger;
    }

    /**
     * Initialize the prover. Must be called before generating proofs.
     */
    public async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            const setupValid = await this.circuitManager.verifySetup();
            if (!setupValid) {
                throw new Error('Circuit setup files not found');
            }
            this.initialized = true;
            this.logger.info('ZK Prover initialized');
        } catch (error) {
            this.logger.error('Failed to initialize ZK Prover', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw new ProofError(
                ErrorCode.CIRCUIT_INITIALIZATION_FAILED,
                'ZK Prover initialization failed',
            );
        }
    }

    /**
     * Generate a zero-knowledge proof proving membership in a credential set.
     */
    public async generateProof(
        credentialSetId: string,
        merkleProof: MerkleProof,
        credential: string,
    ): Promise<ZKProof> {
        if (!this.initialized) {
            throw new ProofError(
                ErrorCode.CIRCUIT_INITIALIZATION_FAILED,
                'ZK Prover not initialized. Call initialize() first.',
            );
        }

        this.validateProofInputs(merkleProof, credential);

        const circuitInputs = this.prepareCircuitInputs(merkleProof, credential);

        this.logger.debug('Generating ZK proof', {
            credentialSetId,
            merkleRoot: merkleProof.root,
        });

        try {
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                circuitInputs,
                this.circuitManager.getWasmPath(),
                this.circuitManager.getZkeyPath(),
            );

            const expiryMs = config.proofExpiryHours * 60 * 60 * 1000;

            const metadata: ProofMetadata = {
                proofId: uuidv4(),
                credentialSetId,
                merkleRoot: merkleProof.root,
                timestamp: new Date(),
                expiresAt: new Date(Date.now() + expiryMs),
                version: '1.0.0',
                circuitId: this.circuitManager.getCircuitId(),
            };

            const zkProof: ZKProof = {
                proof,
                publicSignals,
                metadata,
            };

            this.logger.info('ZK proof generated', {
                proofId: metadata.proofId,
                credentialSetId,
            });

            return zkProof;
        } catch (error) {
            this.logger.error('Proof generation failed', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw new ProofError(ErrorCode.PROOF_GENERATION_FAILED, 'Failed to generate ZK proof');
        }
    }


    /**
     * Prepare circuit inputs from a Merkle proof.
     */
    private prepareCircuitInputs(
        merkleProof: MerkleProof,
        credential: string,
    ): Record<string, string | string[] | number[]> {
        const pathElements = merkleProof.siblings.map((sibling) =>
            BigInt('0x' + sibling.hash).toString(),
        );

        const maxDepth = 20; // Circuit is fixed to 20 levels

        // Pad to circuit depth
        while (pathElements.length < maxDepth) {
            pathElements.push('0');
        }

        const pathIndices = [...merkleProof.pathIndices];
        while (pathIndices.length < maxDepth) {
            pathIndices.push(0);
        }

        const credentialField = PoseidonManager.stringToField(credential).toString();

        return {
            credential: credentialField,
            pathElements,
            pathIndices,
        };
    }

    private validateProofInputs(merkleProof: MerkleProof, credential: string): void {
        if (!merkleProof || !merkleProof.root || !merkleProof.siblings) {
            throw new ProofError(ErrorCode.INVALID_PROOF_STRUCTURE, 'Invalid Merkle proof structure');
        }

        if (!credential || typeof credential !== 'string') {
            throw new ProofError(ErrorCode.INVALID_CREDENTIAL, 'Invalid credential');
        }

        if (merkleProof.siblings.length > config.maxMerkleDepth) {
            throw new ProofError(
                ErrorCode.INVALID_PROOF_STRUCTURE,
                `Merkle proof too deep (max ${config.maxMerkleDepth} levels)`,
            );
        }
    }

    /**
     * Generate a nullifier to prevent double-use of a credential.
     */
    public generateNullifier(credential: string, secret: Buffer = randomBytes(32)): string {
        const combined = Buffer.concat([Buffer.from(credential), secret]);
        const { createHash } = require('crypto');
        return createHash('sha256').update(combined).digest('hex');
    }

    public isInitialized(): boolean {
        return this.initialized;
    }
}
