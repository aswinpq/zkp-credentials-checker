import { buildPoseidon } from 'circomlibjs';
import { createHash } from 'crypto';

/**
 * Manages the Poseidon hash function initialization and usage.
 * Poseidon is used for the Merkle Tree and ZK proofs.
 */
export class PoseidonManager {
    private static poseidon: any;

    /**
     * Initialize the Poseidon hash function.
     * Must be called before using the hash function.
     */
    public static async initialize(): Promise<void> {
        if (!this.poseidon) {
            this.poseidon = await buildPoseidon();
        }
    }

    /**
     * Compute the Poseidon hash of an array of bigints (field elements).
     * Returns a bigint (field element).
     */
    public static hash(elements: bigint[]): bigint {
        if (!this.poseidon) {
            throw new Error('Poseidon not initialized. Call initialize() first.');
        }
        const hash = this.poseidon(elements);
        return this.poseidon.F.toObject(hash);
    }

    /**
     * Compute the Poseidon hash of left and right nodes (Merkle Tree).
     */
    public static hashLeftRight(left: bigint, right: bigint): bigint {
        return this.hash([left, right]);
    }

    /**
     * Convert a string to a field element by hashing with SHA256 and taking modulo p.
     * This ensures the input fits within the finite field.
     */
    public static stringToField(str: string): bigint {
        if (!this.poseidon) {
            throw new Error('Poseidon not initialized. Call initialize() first.');
        }
        const hash = createHash('sha256').update(str).digest('hex');
        const bigInt = BigInt('0x' + hash);
        return bigInt % this.poseidon.F.p;
    }
}
