import { v4 as uuidv4 } from 'uuid';
import { SecureMerkleTree } from './MerkleTree';
import { CredentialSet, CredentialSetType } from '../../types/credential.types';
import { MerkleProof } from '../../types/proof.types';
import { Logger } from '../../utils/logger';
import { validateCredentials } from '../../utils/validators';
import { CredentialError, ErrorCode } from '../../utils/errors';

interface CredentialSetData {
    credentialSet: CredentialSet;
    tree: SecureMerkleTree;
    type: CredentialSetType;
}

/**
 * Manages credential sets — groups of credentials with associated Merkle trees.
 * Provides proof generation and credential verification capabilities.
 */
export class CredentialSetManager {
    private readonly credentialSets: Map<string, CredentialSetData>;
    private readonly logger: Logger;

    constructor(logger: Logger) {
        this.credentialSets = new Map();
        this.logger = logger;
    }

    /**
     * Create a new credential set with an associated Merkle tree.
     */
    public createCredentialSet(
        name: string,
        credentials: string[],
        description: string = '',
        type: CredentialSetType = CredentialSetType.CUSTOM,
    ): CredentialSet {
        // Validate all credentials
        validateCredentials(credentials);

        const tree = new SecureMerkleTree(credentials, this.logger);
        const id = uuidv4();

        const credentialSet: CredentialSet = {
            id,
            name,
            description,
            credentials: Object.freeze([...credentials]),
            merkleRoot: tree.getRoot(),
            createdAt: new Date(),
            version: '1.0.0',
        };

        this.credentialSets.set(id, {
            credentialSet,
            tree,
            type,
        });

        this.logger.info('Credential set created', {
            id,
            name,
            credentialsCount: credentials.length,
            merkleRoot: tree.getRoot(),
        });

        return credentialSet;
    }

    /**
     * Generate a Merkle inclusion proof for a credential in a set.
     */
    public generateProof(setId: string, credential: string): MerkleProof {
        const data = this.credentialSets.get(setId);

        if (!data) {
            throw new CredentialError(
                ErrorCode.CREDENTIAL_SET_NOT_FOUND,
                `Credential set not found: ${setId}`,
            );
        }

        const { credentialSet, tree } = data;
        const index = credentialSet.credentials.indexOf(credential);

        if (index === -1) {
            // Generic error message — don't reveal which credentials exist
            throw new CredentialError(ErrorCode.CREDENTIAL_NOT_FOUND, 'Invalid credential');
        }

        return tree.getProof(index);
    }

    /**
     * Verify a credential's membership using a Merkle proof.
     */
    public verifyCredential(setId: string, proof: MerkleProof): boolean {
        const data = this.credentialSets.get(setId);

        if (!data) {
            throw new CredentialError(
                ErrorCode.CREDENTIAL_SET_NOT_FOUND,
                `Credential set not found: ${setId}`,
            );
        }

        // Verify root matches
        if (proof.root !== data.credentialSet.merkleRoot) {
            return false;
        }

        // Verify Merkle proof cryptographically
        return SecureMerkleTree.verify(proof);
    }

    /**
     * Retrieve a credential set by ID. Returns undefined if not found.
     */
    public getCredentialSet(setId: string): CredentialSet | undefined {
        const data = this.credentialSets.get(setId);
        return data?.credentialSet;
    }

    /**
     * List all credential sets.
     */
    public getAllSets(): CredentialSet[] {
        return Array.from(this.credentialSets.values()).map((data) => data.credentialSet);
    }

    /**
     * Delete a credential set.
     */
    public deleteCredentialSet(setId: string): boolean {
        const existed = this.credentialSets.delete(setId);
        if (existed) {
            this.logger.info('Credential set deleted', { setId });
        }
        return existed;
    }

    /**
     * Get the number of managed credential sets.
     */
    public getSetCount(): number {
        return this.credentialSets.size;
    }
}
