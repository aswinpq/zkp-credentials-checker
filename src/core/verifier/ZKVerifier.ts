import * as snarkjs from 'snarkjs';
import { ZKProof, VerificationResult } from '../../types/proof.types';
import { Logger } from '../../utils/logger';
import { CircuitManager } from '../prover/CircuitManager';
import { RootManager } from './RootManager';
import { ProofError, ErrorCode } from '../../utils/errors';

/**
 * Verifies zero-knowledge proofs.
 *
 * Verification steps:
 * 1. Validate proof structure
 * 2. Check proof expiration
 * 3. Verify root is trusted
 * 4. Cryptographic proof verification using Groth16
 */
export class ZKVerifier {
    private readonly circuitManager: CircuitManager;
    private readonly rootManager: RootManager;
    private readonly logger: Logger;
    private verificationKey: Record<string, unknown> | null = null;

    constructor(circuitManager: CircuitManager, rootManager: RootManager, logger: Logger) {
        this.circuitManager = circuitManager;
        this.rootManager = rootManager;
        this.logger = logger;
    }

    /**
     * Initialize the verifier by loading the verification key.
     */
    public async initialize(): Promise<void> {
        try {
            this.verificationKey = await this.circuitManager.loadVerificationKey();
            this.logger.info('ZK Verifier initialized');
        } catch (error) {
            this.logger.error('Failed to initialize ZK Verifier', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw new ProofError(
                ErrorCode.CIRCUIT_INITIALIZATION_FAILED,
                'ZK Verifier initialization failed',
            );
        }
    }

    /**
     * Verify a zero-knowledge proof through all validation stages.
     */
    public async verifyProof(proof: ZKProof): Promise<VerificationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Stage 1: Validate proof structure
        if (!this.validateProofStructure(proof, errors)) {
            return this.createResult(false, proof, errors);
        }

        // Stage 2: Check proof expiration
        if (proof.metadata.expiresAt < new Date()) {
            errors.push('Proof has expired');
            return this.createResult(false, proof, errors);
        }

        // Stage 3: Verify root is trusted
        const isTrusted = await this.rootManager.isTrustedRoot(
            proof.metadata.credentialSetId,
            proof.metadata.merkleRoot,
        );

        if (!isTrusted) {
            errors.push('Untrusted credential set root');
            return this.createResult(false, proof, errors);
        }

        // Stage 4: Cryptographic verification
        if (!this.verificationKey) {
            errors.push('Verifier not initialized');
            return this.createResult(false, proof, errors);
        }

        try {
            const isValid = await snarkjs.groth16.verify(
                this.verificationKey,
                proof.publicSignals as string[],
                proof.proof,
            );

            if (!isValid) {
                errors.push('Invalid cryptographic proof');
                return this.createResult(false, proof, errors);
            }
        } catch (error) {
            this.logger.error('Proof verification error', {
                error: error instanceof Error ? error.message : String(error),
            });
            errors.push('Proof verification error');
            return this.createResult(false, proof, errors);
        }

        this.logger.info('Proof verified successfully', {
            proofId: proof.metadata.proofId,
            credentialSetId: proof.metadata.credentialSetId,
        });

        return this.createResult(true, proof, errors, warnings);
    }

    private validateProofStructure(proof: ZKProof, errors: string[]): boolean {
        if (!proof) {
            errors.push('Proof is null or undefined');
            return false;
        }

        if (!proof.proof || !proof.publicSignals || !proof.metadata) {
            errors.push('Incomplete proof structure');
            return false;
        }

        if (!proof.metadata.proofId || !proof.metadata.merkleRoot) {
            errors.push('Missing required metadata fields');
            return false;
        }

        if (!proof.metadata.credentialSetId) {
            errors.push('Missing credential set ID');
            return false;
        }

        return true;
    }

    private createResult(
        valid: boolean,
        proof: ZKProof,
        errors: string[],
        warnings?: string[],
    ): VerificationResult {
        return {
            valid,
            verifiedAt: new Date(),
            credentialSetId: proof.metadata?.credentialSetId || 'unknown',
            errors: errors.length > 0 ? errors : undefined,
            warnings: warnings && warnings.length > 0 ? warnings : undefined,
        };
    }
}
