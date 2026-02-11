import { Request, Response, NextFunction } from 'express';
import { CredentialSetManager } from '../../core/merkle/CredentialSet';
import { ZKProver } from '../../core/prover/ZKProver';
import { Logger } from '../../utils/logger';
import { CircuitManager } from '../../core/prover/CircuitManager';
import { config } from '../../config/environment';

/**
 * Controller for proof generation endpoints.
 */
export class ProofController {
    private readonly prover: ZKProver;
    private readonly credentialSetManager: CredentialSetManager;
    private readonly logger: Logger;

    constructor(credentialSetManager: CredentialSetManager) {
        this.logger = new Logger('ProofController');
        const circuitManager = new CircuitManager(
            config.circuitName,
            config.circuitsPath,
            this.logger,
        );
        this.prover = new ZKProver(circuitManager, this.logger);
        this.credentialSetManager = credentialSetManager;
    }

    /**
     * Initialize the prover. Must be called before handling requests.
     */
    public async initialize(): Promise<void> {
        try {
            await this.prover.initialize();
        } catch {
            this.logger.warn('Prover initialization deferred — circuit files may not be available');
        }
    }

    /**
     * POST /api/proof/generate
     * Generate a ZK proof for a credential.
     */
    public async generateProof(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { credentialSetId, credential } = req.body as {
                credentialSetId: string;
                credential: string;
            };

            // Generate Merkle proof
            const merkleProof = this.credentialSetManager.generateProof(credentialSetId, credential);

            // Generate ZK proof
            const zkProof = await this.prover.generateProof(credentialSetId, merkleProof, credential);

            // Sanitize response — remove sensitive data
            const response = {
                success: true,
                data: {
                    proofId: zkProof.metadata.proofId,
                    proof: zkProof.proof,
                    publicSignals: zkProof.publicSignals,
                    metadata: {
                        credentialSetId: zkProof.metadata.credentialSetId,
                        merkleRoot: zkProof.metadata.merkleRoot,
                        expiresAt: zkProof.metadata.expiresAt.toISOString(),
                        timestamp: zkProof.metadata.timestamp.toISOString(),
                        version: zkProof.metadata.version,
                        proofId: zkProof.metadata.proofId,
                        circuitId: zkProof.metadata.circuitId,
                    },
                },
                timestamp: new Date().toISOString(),
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/credential-sets
     * Create a new credential set.
     */
    public async createCredentialSet(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const { name, credentials, description, type } = req.body as {
                name: string;
                credentials: string[];
                description?: string;
                type?: string;
            };

            const credSet = this.credentialSetManager.createCredentialSet(
                name,
                credentials,
                description,
                type as any,
            );

            res.status(201).json({
                success: true,
                data: {
                    id: credSet.id,
                    name: credSet.name,
                    description: credSet.description,
                    credentialCount: credSet.credentials.length,
                    merkleRoot: credSet.merkleRoot,
                    createdAt: credSet.createdAt.toISOString(),
                    version: credSet.version,
                },
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/credential-sets
     * List all credential sets.
     */
    public getAllSets(_req: Request, res: Response): void {
        const sets = this.credentialSetManager.getAllSets().map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            credentials: s.credentials,
            credentialCount: s.credentials.length,
            merkleRoot: s.merkleRoot,
            createdAt: s.createdAt.toISOString(),
        }));

        res.status(200).json({
            success: true,
            data: sets,
            timestamp: new Date().toISOString(),
        });
    }
}
