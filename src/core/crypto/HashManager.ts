import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { Logger } from '../../utils/logger';

/**
 * Centralized hash operations wrapping Node.js crypto for consistency and auditability.
 * All operations use constant-time comparisons to prevent timing attacks.
 */
export class HashManager {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_logger: Logger) {
        // Logger accepted for API consistency; not currently used.
    }

    /**
     * SHA-256 hash of a string input.
     */
    public sha256(data: string): Buffer {
        return createHash('sha256').update(data).digest();
    }

    /**
     * SHA-256 hash returning hex-encoded string.
     */
    public sha256Hex(data: string): string {
        return this.sha256(data).toString('hex');
    }

    /**
     * SHA-256 hash of a Buffer.
     */
    public sha256Buffer(data: Buffer): Buffer {
        return createHash('sha256').update(data).digest();
    }

    /**
     * Double SHA-256 (hash-of-hash) for extra security.
     */
    public doubleSha256(data: string): Buffer {
        const first = this.sha256(data);
        return createHash('sha256').update(first).digest();
    }

    /**
     * HMAC-SHA256 with a key.
     */
    public hmacSha256(data: string, key: Buffer): Buffer {
        return createHmac('sha256', key).update(data).digest();
    }

    /**
     * Constant-time comparison of two hex strings.
     * Returns true if equal, false otherwise.
     */
    public constantTimeEqual(a: string, b: string): boolean {
        if (a.length !== b.length) {
            return false;
        }

        const bufA = Buffer.from(a, 'hex');
        const bufB = Buffer.from(b, 'hex');

        if (bufA.length !== bufB.length) {
            return false;
        }

        return timingSafeEqual(bufA, bufB);
    }

    /**
     * Constant-time comparison of two Buffers.
     */
    public constantTimeEqualBuffers(a: Buffer, b: Buffer): boolean {
        if (a.length !== b.length) {
            return false;
        }
        return timingSafeEqual(a, b);
    }

    /**
     * Hash function suitable for Merkle tree leaf hashing.
     */
    public hashLeaf(data: string): Buffer {
        // Prefix with 0x00 to separate from internal nodes (domain separation)
        const prefixed = Buffer.concat([Buffer.from([0x00]), Buffer.from(data)]);
        return createHash('sha256').update(prefixed).digest();
    }

    /**
     * Hash function for Merkle tree internal nodes.
     */
    public hashNodes(left: Buffer, right: Buffer): Buffer {
        // Prefix with 0x01 for domain separation from leaves
        const prefixed = Buffer.concat([Buffer.from([0x01]), left, right]);
        return createHash('sha256').update(prefixed).digest();
    }
}
