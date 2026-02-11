import { Request, Response, NextFunction } from 'express';
import { ZKVerifier } from '../../core/verifier/ZKVerifier';
import { RootManager } from '../../core/verifier/RootManager';
import { ProofValidator } from '../../core/verifier/ProofValidator';
import { CircuitManager } from '../../core/prover/CircuitManager';
import { Logger } from '../../utils/logger';
import { config } from '../../config/environment';

/**
 * Controller for proof verification endpoints.
 */
export class VerifyController {
    private readonly verifier: ZKVerifier;
    private readonly proofValidator: ProofValidator;
    private readonly rootManager: RootManager;
    private readonly logger: Logger;

    constructor(rootManager: RootManager) {
        this.logger = new Logger('VerifyController');
        const circuitManager = new CircuitManager(
            config.circuitName,
            config.circuitsPath,
            this.logger,
        );
        this.rootManager = rootManager;
        this.verifier = new ZKVerifier(circuitManager, rootManager, this.logger);
        this.proofValidator = new ProofValidator(this.logger);
    }

    /**
     * Initialize the verifier.
     */
    public async initialize(): Promise<void> {
        try {
            await this.verifier.initialize();
        } catch {
            this.logger.warn('Verifier initialization deferred — verification key may not be available');
        }
    }

    /**
     * POST /api/verify
     * Verify a ZK proof.
     */
    public async verifyProof(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.debug('Received verification request', { body: req.body });

            // Validate and deserialize proof
            const zkProof = this.proofValidator.validateAndDeserialize(req.body);

            // Pre-validation checks
            const preErrors = this.proofValidator.preValidate(zkProof);
            if (preErrors.length > 0) {
                this.logger.warn('Proof pre-validation failed', { errors: preErrors });
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_PROOF_STRUCTURE',
                        message: 'Proof pre-validation failed',
                        details: preErrors,
                    },
                    timestamp: new Date().toISOString(),
                });
                return;
            }

            // Full verification
            const result = await this.verifier.verifyProof(zkProof);

            res.status(200).json({
                success: true,
                data: {
                    valid: result.valid,
                    verifiedAt: result.verifiedAt.toISOString(),
                    credentialSetId: result.credentialSetId,
                    errors: result.errors,
                    warnings: result.warnings,
                },
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/verify/roots
     * Register a trusted root.
     */
    public async addTrustedRoot(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { credentialSetId, merkleRoot } = req.body as {
                credentialSetId: string;
                merkleRoot: string;
            };

            this.rootManager.addTrustedRoot({
                credentialSetId,
                merkleRoot,
                addedAt: new Date(),
            });

            res.status(201).json({
                success: true,
                data: {
                    credentialSetId,
                    merkleRoot,
                    message: 'Trusted root registered',
                },
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    }
}
