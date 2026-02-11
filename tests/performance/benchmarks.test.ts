import { SecureMerkleTree } from '../../src/core/merkle/MerkleTree';
import { CredentialSetManager } from '../../src/core/merkle/CredentialSet';
import { HashManager } from '../../src/core/crypto/HashManager';
import { Logger } from '../../src/utils/logger';

const logger = new Logger('test');

describe('Performance Benchmarks', () => {
    describe('Merkle Tree', () => {
        it('should create 1024-leaf tree under 500ms', () => {
            const leaves = Array.from({ length: 1024 }, (_, i) => `credential-${i}`);
            const start = Date.now();
            new SecureMerkleTree(leaves, logger);
            const elapsed = Date.now() - start;
            expect(elapsed).toBeLessThan(500);
        });

        it('should generate proof under 10ms', () => {
            const leaves = Array.from({ length: 256 }, (_, i) => `cred-${i}`);
            const tree = new SecureMerkleTree(leaves, logger);
            const start = Date.now();
            tree.getProof(0);
            const elapsed = Date.now() - start;
            expect(elapsed).toBeLessThan(10);
        });

        it('should verify proof under 5ms', () => {
            const leaves = Array.from({ length: 256 }, (_, i) => `cred-${i}`);
            const tree = new SecureMerkleTree(leaves, logger);
            const proof = tree.getProof(100);
            const start = Date.now();
            SecureMerkleTree.verify(proof);
            const elapsed = Date.now() - start;
            expect(elapsed).toBeLessThan(5);
        });
    });

    describe('Hashing', () => {
        it('should hash 10000 strings under 200ms', () => {
            const hm = new HashManager(logger);
            const start = Date.now();
            for (let i = 0; i < 10000; i++) {
                hm.sha256Hex(`data-${i}`);
            }
            const elapsed = Date.now() - start;
            expect(elapsed).toBeLessThan(200);
        });
    });

    describe('Credential Set Manager', () => {
        it('should create and query 100 sets under 2s', () => {
            const mgr = new CredentialSetManager(logger);
            const start = Date.now();
            for (let i = 0; i < 100; i++) {
                mgr.createCredentialSet(
                    `Set-${i}`,
                    Array.from({ length: 10 }, (_, j) => `cred-${i}-${j}`),
                );
            }
            mgr.getAllSets();
            const elapsed = Date.now() - start;
            expect(elapsed).toBeLessThan(2000);
        });
    });
});
