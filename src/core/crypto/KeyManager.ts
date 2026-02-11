import { createHmac } from 'crypto';
import { Logger } from '../../utils/logger';
import { RandomGenerator } from './RandomGenerator';

/**
 * Manages cryptographic key material for the application.
 * In production, this should integrate with a proper KMS (e.g., AWS KMS, HashiCorp Vault).
 */
export class KeyManager {
    private readonly logger: Logger;
    private readonly randomGenerator: RandomGenerator;
    private masterKey: Buffer | null = null;

    constructor(logger: Logger) {
        this.logger = logger;
        this.randomGenerator = new RandomGenerator(logger);
    }

    /**
     * Initialize with a master key (from environment or KMS).
     */
    public initialize(masterKeyHex?: string): void {
        if (masterKeyHex) {
            if (!/^[a-f0-9]{64}$/i.test(masterKeyHex)) {
                throw new Error('Master key must be a 64-character hex string (32 bytes)');
            }
            this.masterKey = Buffer.from(masterKeyHex, 'hex');
        } else {
            // Generate ephemeral key for development
            this.masterKey = this.randomGenerator.generateBytes(32);
            this.logger.warn('Using ephemeral master key. Set MASTER_KEY in production.');
        }

        this.logger.info('Key manager initialized');
    }

    /**
     * Derive a purpose-specific key from the master key.
     */
    public deriveKey(purpose: string): Buffer {
        if (!this.masterKey) {
            throw new Error('Key manager not initialized');
        }

        return createHmac('sha256', this.masterKey)
            .update(`key-derivation:${purpose}`)
            .digest();
    }

    /**
     * Generate a nullifier from a credential and secret.
     * The nullifier is deterministic for the same inputs but reveals nothing about the credential.
     */
    public generateNullifier(credential: string, secret: Buffer): string {
        const key = this.deriveKey('nullifier');
        const data = Buffer.concat([Buffer.from(credential), secret]);
        return createHmac('sha256', key).update(data).digest('hex');
    }

    /**
     * Generate a commitment to a credential value.
     */
    public generateCommitment(credential: string, blinding: Buffer): string {
        const key = this.deriveKey('commitment');
        const data = Buffer.concat([Buffer.from(credential), blinding]);
        return createHmac('sha256', key).update(data).digest('hex');
    }

    /**
     * Securely destroy the master key from memory.
     */
    public destroy(): void {
        if (this.masterKey) {
            this.masterKey.fill(0);
            this.masterKey = null;
            this.logger.info('Key manager destroyed');
        }
    }

    /**
     * Check if the key manager has been initialized.
     */
    public isInitialized(): boolean {
        return this.masterKey !== null;
    }
}
