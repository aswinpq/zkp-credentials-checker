import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from '../config/environment';
import { securityConfig } from '../config/security.config';
import { Logger } from '../utils/logger';
import { createProofRoutes } from './routes/proof.routes';
import { createVerifyRoutes } from './routes/verify.routes';
import { healthRoutes } from './routes/health.routes';
import { errorHandler } from './middleware/error.middleware';
import { securityMiddleware } from './middleware/security.middleware';
import { globalRateLimiter } from './middleware/rateLimit.middleware';
import { CredentialSetManager } from '../core/merkle/CredentialSet';
import { RootManager } from '../core/verifier/RootManager';

/**
 * Production Express server with security hardening.
 */
export class Server {
    private readonly app: Express;
    private readonly logger: Logger;
    private readonly credentialSetManager: CredentialSetManager;
    private readonly rootManager: RootManager;

    constructor(logger: Logger) {
        this.logger = logger;
        this.app = express();
        this.credentialSetManager = new CredentialSetManager(logger);
        this.rootManager = new RootManager(logger);

        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    private setupMiddleware(): void {
        // Security headers via Helmet
        this.app.use(
            helmet({
                contentSecurityPolicy: {
                    directives: {
                        defaultSrc: securityConfig.csp.defaultSrc,
                        styleSrc: securityConfig.csp.styleSrc,
                        scriptSrc: securityConfig.csp.scriptSrc,
                        imgSrc: securityConfig.csp.imgSrc,
                    },
                },
                hsts: securityConfig.hsts,
            }),
        );

        // CORS
        this.app.use(
            cors({
                origin: config.corsOrigin,
                methods: [...securityConfig.cors.methods],
                allowedHeaders: [...securityConfig.cors.allowedHeaders],
                exposedHeaders: [...securityConfig.cors.exposedHeaders],
                credentials: securityConfig.cors.credentials,
                maxAge: securityConfig.cors.maxAge,
            }),
        );

        // Global rate limiting
        this.app.use('/api/', globalRateLimiter);

        // Body parsing with size limits
        this.app.use(express.json({ limit: securityConfig.requestLimits.jsonBodyLimit }));
        this.app.use(
            express.urlencoded({
                extended: true,
                limit: securityConfig.requestLimits.urlEncodedLimit,
            }),
        );

        // Custom security middleware
        this.app.use(securityMiddleware);

        // Request logging
        this.app.use((req, _res, next) => {
            this.logger.http('Request', {
                method: req.method,
                path: req.path,
                ip: req.ip,
            });
            next();
        });
    }

    private setupRoutes(): void {
        this.app.use('/api/health', healthRoutes);
        this.app.use('/api/proof', createProofRoutes(this.credentialSetManager));
        this.app.use('/api/verify', createVerifyRoutes(this.rootManager));

        // 404 handler
        this.app.use((_req, res) => {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
                timestamp: new Date().toISOString(),
            });
        });
    }

    private setupErrorHandling(): void {
        this.app.use(errorHandler(this.logger));
    }

    public async start(): Promise<void> {
        const port = config.port;
        const host = config.host;

        this.app.listen(port, () => {
            this.logger.info(`Server started`, { host, port, env: config.nodeEnv });
        });
    }

    public getApp(): Express {
        return this.app;
    }

    public getCredentialSetManager(): CredentialSetManager {
        return this.credentialSetManager;
    }

    public getRootManager(): RootManager {
        return this.rootManager;
    }
}
