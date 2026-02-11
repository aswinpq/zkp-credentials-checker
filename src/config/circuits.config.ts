import path from 'path';
import { config } from './environment';

/**
 * Circuit-related configuration.
 */
export const circuitsConfig = {
    /** Name of the primary circuit */
    circuitName: config.circuitName,

    /** Base path where compiled circuits live */
    basePath: config.circuitsPath,

    /** Maximum Merkle tree depth supported by the circuit */
    maxDepth: config.maxMerkleDepth,

    /** Get full path to the circuit WASM file */
    getWasmPath(): string {
        return path.join(
            this.basePath,
            `${this.circuitName}_js`,
            `${this.circuitName}.wasm`,
        );
    },

    /** Get full path to the circuit final zkey */
    getZkeyPath(): string {
        return path.join(this.basePath, `${this.circuitName}_final.zkey`);
    },

    /** Get full path to the verification key JSON */
    getVerificationKeyPath(): string {
        return path.join(this.basePath, 'verification_key.json');
    },
} as const;
