import { Server } from './api/server';
import { Logger } from './utils/logger';
import { validateConfig } from './config/environment';

import { PoseidonManager } from './core/crypto/PoseidonManager';

const logger = new Logger('App');

async function main(): Promise<void> {
    logger.info('Starting Anonymous Credential Checker...');

    // Validate configuration
    const configErrors = validateConfig();
    if (configErrors.length > 0) {
        logger.error('Configuration errors', { errors: configErrors });
        process.exit(1);
    }

    // Initialize Poseidon
    logger.info('Initializing Poseidon...');
    await PoseidonManager.initialize();

    // Create and start server
    const server = new Server(logger);
    await server.start();

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
        logger.info(`Received ${signal}. Shutting down gracefully...`);
        process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught exception', { message: error.message, stack: error.stack });
        process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
        logger.error('Unhandled rejection', {
            reason: reason instanceof Error ? reason.message : String(reason),
        });
        process.exit(1);
    });
}

main().catch((error) => {
    logger.error('Fatal startup error', {
        message: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
});
