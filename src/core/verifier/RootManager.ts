import { Logger } from '../../utils/logger';
import { AppError, ErrorCode } from '../../utils/errors';
import { validateHexHash } from '../../utils/validators';

/**
 * Represents a trusted Merkle root registered by an administrator.
 */
export interface TrustedRoot {
    readonly credentialSetId: string;
    readonly merkleRoot: string;
    readonly addedAt: Date;
    readonly expiresAt?: Date;
    readonly metadata?: Record<string, unknown>;
}

/**
 * Manages the set of trusted Merkle roots.
 * Only proofs referencing a trusted root will be accepted by the verifier.
 */
export class RootManager {
    private readonly trustedRoots: Map<string, Set<string>>;
    private readonly rootMetadata: Map<string, TrustedRoot>;
    private readonly logger: Logger;

    constructor(logger: Logger) {
        this.trustedRoots = new Map();
        this.rootMetadata = new Map();
        this.logger = logger;
    }

    /**
     * Register a new trusted Merkle root.
     */
    public addTrustedRoot(root: TrustedRoot): void {
        const { credentialSetId, merkleRoot } = root;

        if (!credentialSetId || !merkleRoot) {
            throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid root parameters', 400);
        }

        validateHexHash(merkleRoot, 'Merkle root');

        let roots = this.trustedRoots.get(credentialSetId);
        if (!roots) {
            roots = new Set();
            this.trustedRoots.set(credentialSetId, roots);
        }

        roots.add(merkleRoot);
        this.rootMetadata.set(this.getRootKey(credentialSetId, merkleRoot), root);

        this.logger.info('Trusted root added', {
            credentialSetId,
            merkleRoot: merkleRoot.substring(0, 16) + '...',
        });
    }

    /**
     * Check whether a given root is trusted (and not expired).
     */
    public async isTrustedRoot(credentialSetId: string, merkleRoot: string): Promise<boolean> {
        const roots = this.trustedRoots.get(credentialSetId);

        if (!roots || !roots.has(merkleRoot)) {
            return false;
        }

        // Check expiration
        const metadata = this.rootMetadata.get(this.getRootKey(credentialSetId, merkleRoot));

        if (metadata?.expiresAt && metadata.expiresAt < new Date()) {
            this.logger.warn('Expired root accessed', {
                credentialSetId,
                merkleRoot: merkleRoot.substring(0, 16) + '...',
            });
            return false;
        }

        return true;
    }

    /**
     * Revoke a previously trusted root.
     */
    public revokeTrustedRoot(credentialSetId: string, merkleRoot: string): boolean {
        const roots = this.trustedRoots.get(credentialSetId);

        if (!roots) {
            return false;
        }

        const deleted = roots.delete(merkleRoot);
        if (deleted) {
            this.rootMetadata.delete(this.getRootKey(credentialSetId, merkleRoot));
            this.logger.info('Trusted root revoked', {
                credentialSetId,
                merkleRoot: merkleRoot.substring(0, 16) + '...',
            });
        }

        return deleted;
    }

    /**
     * List all trusted roots for a credential set.
     */
    public getTrustedRoots(credentialSetId: string): string[] {
        const roots = this.trustedRoots.get(credentialSetId);
        return roots ? Array.from(roots) : [];
    }

    /**
     * Get the total number of trusted roots across all sets.
     */
    public getTotalRootCount(): number {
        let count = 0;
        for (const roots of this.trustedRoots.values()) {
            count += roots.size;
        }
        return count;
    }

    private getRootKey(credentialSetId: string, merkleRoot: string): string {
        return `${credentialSetId}:${merkleRoot}`;
    }
}
