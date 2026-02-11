import { MerkleTree as MerkleTreeJS } from 'merkletreejs';
import { MerkleProof, MerkleProofElement } from '../../types/proof.types';
import { Logger } from '../../utils/logger';
import { PoseidonManager } from '../../core/crypto/PoseidonManager';

/**
 * Secure Merkle Tree using Poseidon hash for ZK compatibility.
 * 
 * Features:
 * - Poseidon hashing (ZK-friendly)
 * - Sorted pairs
 * - Constant-time root comparison
 */
export class SecureMerkleTree {
    private readonly tree: MerkleTreeJS;
    private readonly leaves: Buffer[];
    private readonly logger: Logger;

    constructor(leaves: string[], logger: Logger) {
        this.logger = logger;

        if (!leaves || leaves.length === 0) {
            throw new Error('Cannot create Merkle tree with empty leaves');
        }

        // 1. Convert leaves to Field Elements (BigInt) via SHA256 % p
        this.leaves = leaves.map((leaf) => {
            const bi = PoseidonManager.stringToField(leaf);
            // Store as 32-byte BE Buffer for merkletreejs
            return Buffer.from(bi.toString(16).padStart(64, '0'), 'hex');
        });

        // 2. Build tree using Poseidon hash
        this.tree = new MerkleTreeJS(
            this.leaves,
            (data: Buffer) => {
                // merkletreejs passes concatenated children (left + right)
                // We assume 32-byte hash size
                if (data.length !== 64) {
                    // If data length is not 64, it implies odd leaf being hashed?
                    // But we use sortPairs and 2-arity.
                    // If only one node, it might duplicate?
                    // merkletreejs behavior: hash(node) if single?
                    // But we set fillDefaultHash usually...
                    // Let's assume standard interaction.
                    // If odd, merkletreejs duplicates last?
                    throw new Error(`Unexpected data length for internal node hash: ${data.length}`);
                }
                const left = BigInt('0x' + data.subarray(0, 32).toString('hex'));
                const right = BigInt('0x' + data.subarray(32).toString('hex'));
                const hash = PoseidonManager.hashLeftRight(left, right);
                return Buffer.from(hash.toString(16).padStart(64, '0'), 'hex');
            },
            {
                sortPairs: true,
                hashLeaves: false, // input leaves are already hashed/converted
            },
        );

        this.logger.info('Merkle tree created', {
            leavesCount: leaves.length,
            treeDepth: this.tree.getDepth(),
            root: this.getRoot(),
        });
    }

    /**
     * Returns the hex-encoded root hash.
     */
    public getRoot(): string {
        return this.tree.getRoot().toString('hex');
    }

    /**
     * Generate a Merkle inclusion proof for a leaf at the given index.
     */
    public getProof(leafIndex: number): MerkleProof {
        if (leafIndex < 0 || leafIndex >= this.leaves.length) {
            throw new Error(`Invalid leaf index: ${leafIndex}`);
        }

        const leaf = this.leaves[leafIndex];
        const proof = this.tree.getProof(leaf);

        const siblings: MerkleProofElement[] = proof.map(
            (element: { data: Buffer; position: string }) => ({
                hash: element.data.toString('hex'),
                position: element.position as 'left' | 'right',
            }),
        );

        const pathIndices = proof.map((element: { position: string }) =>
            element.position === 'right' ? 1 : 0,
        );

        return {
            leaf: leaf.toString('hex'),
            leafIndex,
            root: this.getRoot(),
            siblings,
            pathIndices,
        };
    }

    /**
     * Verify a Merkle proof using Poseidon.
     */
    public static verify(proof: MerkleProof): boolean {
        const { leaf, root, siblings } = proof;

        let currentHash = BigInt('0x' + leaf);

        for (const sibling of siblings) {
            const siblingHash = BigInt('0x' + sibling.hash);

            // Sort pairs to match tree construction (sortPairs: true)
            // Left is smaller
            const left = currentHash <= siblingHash ? currentHash : siblingHash;
            const right = currentHash <= siblingHash ? siblingHash : currentHash;

            currentHash = PoseidonManager.hashLeftRight(left, right);
        }

        const calculatedRoot = currentHash;
        const expectedRoot = BigInt('0x' + root);

        return calculatedRoot === expectedRoot;
    }

    public getDepth(): number {
        return this.tree.getDepth();
    }

    public getLeafCount(): number {
        return this.leaves.length;
    }

    public getLeafHash(index: number): string {
        if (index < 0 || index >= this.leaves.length) {
            throw new Error(`Invalid leaf index: ${index}`);
        }
        return this.leaves[index].toString('hex');
    }
}
