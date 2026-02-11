import { Router } from 'express';
import { body } from 'express-validator';
import { ProofController } from '../controllers/proof.controller';
import { validationMiddleware } from '../middleware/validation.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { proofGenerationLimiter } from '../middleware/rateLimit.middleware';
import { CredentialSetManager } from '../../core/merkle/CredentialSet';

export function createProofRoutes(credentialSetManager: CredentialSetManager): Router {
    const router = Router();
    const controller = new ProofController(credentialSetManager);

    // Initialize prover in background
    controller.initialize().catch(() => {
        // Initialization deferred
    });

    // POST /api/proof/generate — generate a ZK proof
    router.post(
        '/generate',
        authMiddleware,
        proofGenerationLimiter,
        [
            body('credentialSetId').isUUID().withMessage('credentialSetId must be a valid UUID'),
            body('credential')
                .isString()
                .isLength({ min: 1, max: 256 })
                .withMessage('credential must be a string (1-256 chars)'),
            validationMiddleware,
        ],
        controller.generateProof.bind(controller),
    );

    // POST /api/proof/credential-sets — create a credential set
    router.post(
        '/credential-sets',
        authMiddleware,
        [
            body('name').isString().isLength({ min: 1, max: 100 }).withMessage('name is required'),
            body('credentials')
                .isArray({ min: 1, max: 1024 })
                .withMessage('credentials must be an array (1-1024 items)'),
            body('credentials.*')
                .isString()
                .isLength({ min: 1, max: 256 })
                .withMessage('each credential must be a string'),
            body('description').optional().isString(),
            body('type').optional().isString(),
            validationMiddleware,
        ],
        controller.createCredentialSet.bind(controller),
    );

    // GET /api/proof/credential-sets — list credential sets
    router.get('/credential-sets', authMiddleware, controller.getAllSets.bind(controller));

    return router;
}
