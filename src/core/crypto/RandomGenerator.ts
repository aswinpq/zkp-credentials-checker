import { randomBytes, randomInt } from 'crypto';
import { Logger } from '../../utils/logger';

/**
 * Secure random number and byte generation wrapping Node.js crypto.
 * Uses cryptographically secure pseudo-random number generators only.
 */
export class RandomGenerator {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_logger: Logger) {
        // Logger accepted for API consistency; not currently used.
    }

    /**
     * Generate cryptographically secure random bytes.
     */
    public generateBytes(length: number): Buffer {
        if (length <= 0 || length > 1024) {
            throw new Error(`Invalid byte length: ${length}. Must be between 1 and 1024`);
        }
        return randomBytes(length);
    }

    /**
     * Generate a random hex string of the specified byte length.
     */
    public generateHex(byteLength: number = 32): string {
        return this.generateBytes(byteLength).toString('hex');
    }

    /**
     * Generate a random integer in a range [min, max) (exclusive upper bound).
     */
    public generateInt(min: number, max: number): number {
        if (min >= max) {
            throw new Error(`min (${min}) must be less than max (${max})`);
        }
        return randomInt(min, max);
    }

    /**
     * Generate a cryptographic nonce (256-bit).
     */
    public generateNonce(): Buffer {
        return this.generateBytes(32);
    }

    /**
     * Generate a cryptographic salt (128-bit).
     */
    public generateSalt(): Buffer {
        return this.generateBytes(16);
    }

    /**
     * Generate a secret suitable for use as a nullifier seed.
     */
    public generateNullifierSecret(): Buffer {
        return this.generateBytes(32);
    }
}
