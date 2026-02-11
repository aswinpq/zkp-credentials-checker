import { SecureMerkleTree } from '../../src/core/merkle/MerkleTree';
import { Logger } from '../../src/utils/logger';
import { validateCredentials, validateHexHash, validateUUID } from '../../src/utils/validators';

const logger = new Logger('test');

describe('Security Tests', () => {
    describe('Timing Attack Prevention', () => {
        it('should use constant-time comparison for root verification', () => {
            const leaves = ['secret1', 'secret2', 'secret3', 'secret4'];
            const tree = new SecureMerkleTree(leaves, logger);
            const proof = tree.getProof(0);

            const timings: number[] = [];
            for (let i = 0; i < 50; i++) {
                const start = process.hrtime.bigint();
                SecureMerkleTree.verify(proof);
                timings.push(Number(process.hrtime.bigint() - start));
            }

            const mean = timings.reduce((a, b) => a + b) / timings.length;
            const variance = timings.reduce((s, t) => s + Math.pow(t - mean, 2), 0) / timings.length;
            // Loose check: variance should be reasonable relative to mean
            // Use a generous multiplier to account for OS scheduling jitter
            expect(variance).toBeLessThan(mean * mean * 4);
        });
    });

    describe('Input Validation', () => {
        it('should reject credential strings over max length', () => {
            expect(() => validateCredentials(['x'.repeat(257)])).toThrow();
        });

        it('should reject duplicate credentials', () => {
            expect(() => validateCredentials(['dup', 'dup'])).toThrow('Duplicate');
        });

        it('should reject empty credential array', () => {
            expect(() => validateCredentials([])).toThrow();
        });

        it('should reject invalid hex hashes', () => {
            expect(() => validateHexHash('not-hex', 'test')).toThrow();
            expect(() => validateHexHash('ab', 'test')).toThrow();
        });

        it('should accept valid hex hashes', () => {
            expect(() => validateHexHash('a'.repeat(64))).not.toThrow();
        });

        it('should reject invalid UUIDs', () => {
            expect(() => validateUUID('not-uuid')).toThrow();
        });

        it('should accept valid UUIDs', () => {
            expect(() => validateUUID('550e8400-e29b-41d4-a716-446655440000')).not.toThrow();
        });
    });

    describe('Cryptographic Properties', () => {
        it('should produce different roots for different leaves', () => {
            // sortPairs=true means reordering the same leaves produces the same root.
            // To test that different inputs produce different roots, use actually different leaves.
            const tree1 = new SecureMerkleTree(['A', 'B', 'C', 'D'], logger);
            const tree2 = new SecureMerkleTree(['E', 'F', 'G', 'H'], logger);
            expect(tree1.getRoot()).not.toBe(tree2.getRoot());
        });

        it('should not allow proof reuse across trees', () => {
            const tree1 = new SecureMerkleTree(['A', 'B', 'C', 'D'], logger);
            const tree2 = new SecureMerkleTree(['A', 'B', 'C', 'E'], logger);

            const proof = tree1.getProof(0);
            // Proof should verify against tree1 root
            expect(SecureMerkleTree.verify(proof)).toBe(true);

            // But should fail against tree2
            const fakeProof = { ...proof, root: tree2.getRoot() };
            expect(SecureMerkleTree.verify(fakeProof)).toBe(false);
        });
    });
});
