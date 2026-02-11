import { MerkleProof, MerkleProofElement } from '../../types/proof.types';

/**
 * Internal Merkle tree types.
 */
export interface MerkleTreeOptions {
    readonly sortPairs: boolean;
    readonly duplicateOdd: boolean;
    readonly hashLeaves: boolean;
}

export interface MerkleTreeData {
    readonly root: string;
    readonly depth: number;
    readonly leafCount: number;
    readonly leaves: readonly string[];
}

export { MerkleProof, MerkleProofElement };
