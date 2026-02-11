import { Router } from 'express';
import { body } from 'express-validator';
import { VerifyController } from '../controllers/verify.controller';
import { validationMiddleware } from '../middleware/validation.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { verificationLimiter } from '../middleware/rateLimit.middleware';
import { RootManager } from '../../core/verifier/RootManager';

export function createVerifyRoutes(rootManager: RootManager): Router {
    const router = Router();
    const controller = new VerifyController(rootManager);

    // Initialize verifier in background
    controller.initialize().catch(() => {
        // Initialization deferred
    });

    // POST /api/verify — verify a ZK proof
    router.post(
        '/',
        verificationLimiter,
        [
            body('proof')
                .custom((value) => {
                    return typeof value === 'string' || typeof value === 'object';
                })
                .withMessage('proof must be a JSON string or object'),
            body('publicSignals').isArray().withMessage('publicSignals must be an array'),
            body('metadata').isObject().withMessage('metadata must be an object'),
            body('metadata.proofId').isString().withMessage('proofId is required'),
            body('metadata.credentialSetId').isString().withMessage('credentialSetId is required'),
            body('metadata.merkleRoot').isString().withMessage('merkleRoot is required'),
            body('metadata.timestamp').isISO8601().withMessage('timestamp must be ISO 8601'),
            body('metadata.expiresAt').isISO8601().withMessage('expiresAt must be ISO 8601'),
            body('metadata.version').isString().withMessage('version is required'),
            body('metadata.circuitId').isString().withMessage('circuitId is required'),
            validationMiddleware,
        ],
        controller.verifyProof.bind(controller),
    );

    // POST /api/verify/roots — register a trusted root (admin)
    router.post(
        '/roots',
        authMiddleware,
        [
            body('credentialSetId').isUUID().withMessage('credentialSetId must be a valid UUID'),
            body('merkleRoot')
                .isString()
                .matches(/^[a-f0-9]{64}$/i)
                .withMessage('merkleRoot must be a 64-char hex string'),
            validationMiddleware,
        ],
        controller.addTrustedRoot.bind(controller),
    );

    return router;
}
