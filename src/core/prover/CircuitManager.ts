import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { Logger } from '../../utils/logger';
import { CircuitError, ErrorCode } from '../../utils/errors';

/**
 * Manages ZK circuit file locations and loading.
 * Handles WASM, zkey, and verification key files.
 */
export class CircuitManager {
    private readonly circuitsPath: string;
    private readonly circuitName: string;
    private readonly logger: Logger;
    private readonly circuitId: string;

    constructor(circuitName: string, circuitsPath: string, logger: Logger) {
        this.circuitName = circuitName;
        this.circuitsPath = circuitsPath;
        this.logger = logger;
        this.circuitId = `${circuitName}-v1.0.0`;
    }

    /**
     * Path to the circuit WASM file.
     */
    public getWasmPath(): string {
        return join(this.circuitsPath, `${this.circuitName}_js`, `${this.circuitName}.wasm`);
    }

    /**
     * Path to the final proving key (zkey).
     */
    public getZkeyPath(): string {
        return join(this.circuitsPath, `${this.circuitName}_final.zkey`);
    }

    /**
     * Path to the verification key JSON.
     */
    public getVerificationKeyPath(): string {
        return join(this.circuitsPath, 'verification_key.json');
    }

    /**
     * Load the verification key from disk.
     */
    public async loadVerificationKey(): Promise<Record<string, unknown>> {
        try {
            const vkeyPath = this.getVerificationKeyPath();
            const vkeyData = await readFile(vkeyPath, 'utf-8');
            return JSON.parse(vkeyData) as Record<string, unknown>;
        } catch {
            this.logger.error('Failed to load verification key');
            throw new CircuitError(
                ErrorCode.VERIFICATION_KEY_NOT_FOUND,
                'Verification key not found. Run the trusted setup first.',
            );
        }
    }

    /**
     * Unique identifier for this circuit version.
     */
    public getCircuitId(): string {
        return this.circuitId;
    }

    /**
     * Verify that all required circuit files exist on disk.
     */
    public async verifySetup(): Promise<boolean> {
        try {
            await access(this.getWasmPath());
            await access(this.getZkeyPath());
            await access(this.getVerificationKeyPath());
            this.logger.info('Circuit setup verified');
            return true;
        } catch {
            this.logger.error('Circuit setup verification failed — one or more files missing');
            return false;
        }
    }
}
