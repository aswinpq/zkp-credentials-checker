import { SecureMerkleTree } from '../../src/core/merkle/MerkleTree';
import { CredentialSetManager } from '../../src/core/merkle/CredentialSet';
import { Logger } from '../../src/utils/logger';
import * as testVectors from '../fixtures/test-vectors.json';
import * as sampleCredentials from '../fixtures/sample-credentials.json';

// Suppress logs during tests
const logger = new Logger('test');

describe('SecureMerkleTree', () => {
    describe('Constructor', () => {
        it('should create a tree with valid leaves', () => {
            const leaves = ['leaf1', 'leaf2', 'leaf3', 'leaf4'];
            const tree = new SecureMerkleTree(leaves, logger);

            expect(tree).toBeDefined();
            expect(tree.getRoot()).toMatch(/^[a-f0-9]{64}$/);
            expect(tree.getLeafCount()).toBe(4);
        });

        it('should throw error with empty leaves', () => {
            expect(() => new SecureMerkleTree([], logger)).toThrow(
                'Cannot create Merkle tree with empty leaves',
            );
        });

        it('should handle single leaf', () => {
            const tree = new SecureMerkleTree(['only-one'], logger);
            expect(tree.getLeafCount()).toBe(1);
            expect(tree.getDepth()).toBe(0);
        });

        it('should handle odd number of leaves', () => {
            const tree = new SecureMerkleTree(['A', 'B', 'C'], logger);
            expect(tree.getLeafCount()).toBe(3);
            expect(tree.getRoot()).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should produce deterministic roots', () => {
            const leaves = ['A', 'B', 'C', 'D'];
            const tree1 = new SecureMerkleTree(leaves, logger);
            const tree2 = new SecureMerkleTree(leaves, logger);
            expect(tree1.getRoot()).toBe(tree2.getRoot());
        });

        it('should produce different roots for different leaves', () => {
            const tree1 = new SecureMerkleTree(['A', 'B'], logger);
            const tree2 = new SecureMerkleTree(['C', 'D'], logger);
            expect(tree1.getRoot()).not.toBe(tree2.getRoot());
        });

        it.each(testVectors.merkleTree.cases)(
            'should handle test vector: $name',
            ({ leaves, expectedDepth, rootNotEmpty }) => {
                const tree = new SecureMerkleTree(leaves, logger);
                expect(tree.getDepth()).toBe(expectedDepth);
                if (rootNotEmpty) {
                    expect(tree.getRoot().length).toBe(64);
                }
            },
        );
    });

    describe('Proof Generation', () => {
        it('should generate valid proof for each leaf', () => {
            const leaves = ['MIT', 'Stanford', 'Harvard', 'Berkeley'];
            const tree = new SecureMerkleTree(leaves, logger);

            for (let i = 0; i < leaves.length; i++) {
                const proof = tree.getProof(i);
                expect(proof).toBeDefined();
                expect(proof.leafIndex).toBe(i);
                expect(proof.root).toBe(tree.getRoot());
                expect(proof.siblings.length).toBeGreaterThan(0);
                expect(proof.pathIndices.length).toBe(proof.siblings.length);
            }
        });

        it('should throw error for negative leaf index', () => {
            const tree = new SecureMerkleTree(['A', 'B'], logger);
            expect(() => tree.getProof(-1)).toThrow('Invalid leaf index');
        });

        it('should throw error for out-of-bounds leaf index', () => {
            const tree = new SecureMerkleTree(['A', 'B'], logger);
            expect(() => tree.getProof(5)).toThrow('Invalid leaf index');
        });

        it('should produce proof with correct structure', () => {
            const tree = new SecureMerkleTree(['A', 'B', 'C', 'D'], logger);
            const proof = tree.getProof(0);

            expect(proof.leaf).toMatch(/^[a-f0-9]{64}$/);
            expect(proof.root).toMatch(/^[a-f0-9]{64}$/);
            proof.siblings.forEach((sibling) => {
                expect(sibling.hash).toMatch(/^[a-f0-9]{64}$/);
                expect(['left', 'right']).toContain(sibling.position);
            });
            proof.pathIndices.forEach((idx) => {
                expect([0, 1]).toContain(idx);
            });
        });
    });

    describe('Proof Verification', () => {
        it('should verify valid proof', () => {
            const leaves = ['MIT', 'Stanford', 'Harvard', 'Berkeley'];
            const tree = new SecureMerkleTree(leaves, logger);

            for (let i = 0; i < leaves.length; i++) {
                const proof = tree.getProof(i);
                expect(SecureMerkleTree.verify(proof)).toBe(true);
            }
        });

        it('should reject proof with tampered root', () => {
            const tree = new SecureMerkleTree(['A', 'B', 'C', 'D'], logger);
            const proof = tree.getProof(0);

            const tamperedProof = {
                ...proof,
                root: 'a'.repeat(64),
            };

            expect(SecureMerkleTree.verify(tamperedProof)).toBe(false);
        });

        it('should reject proof with tampered leaf', () => {
            const tree = new SecureMerkleTree(['A', 'B', 'C', 'D'], logger);
            const proof = tree.getProof(0);

            const tamperedProof = {
                ...proof,
                leaf: 'b'.repeat(64),
            };

            expect(SecureMerkleTree.verify(tamperedProof)).toBe(false);
        });

        it('should reject proof with tampered sibling', () => {
            const tree = new SecureMerkleTree(['A', 'B', 'C', 'D'], logger);
            const proof = tree.getProof(0);

            const tamperedSiblings = [...proof.siblings];
            tamperedSiblings[0] = { ...tamperedSiblings[0], hash: 'c'.repeat(64) };

            const tamperedProof = {
                ...proof,
                siblings: tamperedSiblings,
            };

            expect(SecureMerkleTree.verify(tamperedProof)).toBe(false);
        });

        it('should verify with sample credential sets', () => {
            const tree = new SecureMerkleTree(sampleCredentials.universities, logger);

            sampleCredentials.universities.forEach((_, i) => {
                const proof = tree.getProof(i);
                expect(SecureMerkleTree.verify(proof)).toBe(true);
            });
        });
    });

    describe('getLeafHash', () => {
        it('should return hex hash for valid index', () => {
            const tree = new SecureMerkleTree(['A', 'B'], logger);
            const hash = tree.getLeafHash(0);
            expect(hash).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should throw for invalid index', () => {
            const tree = new SecureMerkleTree(['A'], logger);
            expect(() => tree.getLeafHash(5)).toThrow('Invalid leaf index');
        });
    });
});

describe('CredentialSetManager', () => {
    let manager: CredentialSetManager;

    beforeEach(() => {
        manager = new CredentialSetManager(logger);
    });

    describe('createCredentialSet', () => {
        it('should create a credential set', () => {
            const creds = ['A', 'B', 'C', 'D'];
            const result = manager.createCredentialSet('Test Set', creds, 'A test set');

            expect(result).toBeDefined();
            expect(result.id).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            );
            expect(result.name).toBe('Test Set');
            expect(result.description).toBe('A test set');
            expect(result.credentials).toEqual(creds);
            expect(result.merkleRoot).toMatch(/^[a-f0-9]{64}$/);
            expect(result.version).toBe('1.0.0');
        });

        it('should throw on empty credentials', () => {
            expect(() => manager.createCredentialSet('Empty', [])).toThrow();
        });

        it('should throw on duplicate credentials', () => {
            expect(() => manager.createCredentialSet('Dup', ['A', 'A', 'B'])).toThrow(
                'Duplicate credentials',
            );
        });

        it('should throw on too-long credential', () => {
            const longCred = 'x'.repeat(257);
            expect(() => manager.createCredentialSet('Long', [longCred])).toThrow('maximum length');
        });

        it('should throw on empty string credential', () => {
            expect(() => manager.createCredentialSet('Empty', ['  '])).toThrow('cannot be empty');
        });

        it('should freeze the credentials array', () => {
            const creds = ['A', 'B'];
            const result = manager.createCredentialSet('Set', creds);
            expect(Object.isFrozen(result.credentials)).toBe(true);
        });
    });

    describe('generateProof', () => {
        it('should generate proof for existing credential', () => {
            const creds = ['MIT', 'Stanford', 'Harvard'];
            const set = manager.createCredentialSet('Unis', creds);
            const proof = manager.generateProof(set.id, 'Stanford');

            expect(proof).toBeDefined();
            expect(proof.root).toBe(set.merkleRoot);
            expect(proof.leafIndex).toBe(1);
        });

        it('should throw for non-existent credential set', () => {
            expect(() => manager.generateProof('fake-id', 'MIT')).toThrow('Credential set not found');
        });

        it('should throw for non-existent credential (generic error)', () => {
            const set = manager.createCredentialSet('Unis', ['MIT', 'Stanford']);
            expect(() => manager.generateProof(set.id, 'Harvard')).toThrow('Invalid credential');
        });
    });

    describe('verifyCredential', () => {
        it('should verify valid credential proof', () => {
            const set = manager.createCredentialSet('Unis', ['MIT', 'Stanford', 'Harvard', 'Berkeley']);
            const proof = manager.generateProof(set.id, 'Harvard');
            expect(manager.verifyCredential(set.id, proof)).toBe(true);
        });

        it('should reject proof with wrong root', () => {
            const set = manager.createCredentialSet('Unis', ['MIT', 'Stanford']);
            const proof = manager.generateProof(set.id, 'MIT');

            const tampered = { ...proof, root: 'f'.repeat(64) };
            expect(manager.verifyCredential(set.id, tampered)).toBe(false);
        });
    });

    describe('CRUD operations', () => {
        it('should retrieve a created set', () => {
            const set = manager.createCredentialSet('Test', ['A', 'B']);
            expect(manager.getCredentialSet(set.id)).toEqual(set);
        });

        it('should return undefined for unknown set', () => {
            expect(manager.getCredentialSet('nonexistent')).toBeUndefined();
        });

        it('should list all sets', () => {
            manager.createCredentialSet('Set1', ['A', 'B']);
            manager.createCredentialSet('Set2', ['C', 'D']);
            expect(manager.getAllSets().length).toBe(2);
        });

        it('should delete a set', () => {
            const set = manager.createCredentialSet('Del', ['A']);
            expect(manager.deleteCredentialSet(set.id)).toBe(true);
            expect(manager.getCredentialSet(set.id)).toBeUndefined();
        });

        it('should return false deleting nonexistent set', () => {
            expect(manager.deleteCredentialSet('fake')).toBe(false);
        });

        it('should track set count', () => {
            expect(manager.getSetCount()).toBe(0);
            manager.createCredentialSet('A', ['x']);
            expect(manager.getSetCount()).toBe(1);
        });
    });
});
