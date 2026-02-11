import { RootManager } from '../../src/core/verifier/RootManager';
import { ProofValidator } from '../../src/core/verifier/ProofValidator';
import { Logger } from '../../src/utils/logger';

const logger = new Logger('test');

describe('RootManager', () => {
    let rootManager: RootManager;

    beforeEach(() => {
        rootManager = new RootManager(logger);
    });

    describe('addTrustedRoot', () => {
        it('should add a trusted root', () => {
            const root = 'a'.repeat(64);
            rootManager.addTrustedRoot({
                credentialSetId: 'set-1',
                merkleRoot: root,
                addedAt: new Date(),
            });

            expect(rootManager.getTrustedRoots('set-1')).toContain(root);
        });

        it('should throw on empty parameters', () => {
            expect(() =>
                rootManager.addTrustedRoot({
                    credentialSetId: '',
                    merkleRoot: 'a'.repeat(64),
                    addedAt: new Date(),
                }),
            ).toThrow();
        });

        it('should throw on invalid hash format', () => {
            expect(() =>
                rootManager.addTrustedRoot({
                    credentialSetId: 'set-1',
                    merkleRoot: 'not-a-valid-hash',
                    addedAt: new Date(),
                }),
            ).toThrow();
        });

        it('should allow multiple roots per set', () => {
            const root1 = 'a'.repeat(64);
            const root2 = 'b'.repeat(64);
            rootManager.addTrustedRoot({
                credentialSetId: 'set-1',
                merkleRoot: root1,
                addedAt: new Date(),
            });
            rootManager.addTrustedRoot({
                credentialSetId: 'set-1',
                merkleRoot: root2,
                addedAt: new Date(),
            });

            const roots = rootManager.getTrustedRoots('set-1');
            expect(roots).toContain(root1);
            expect(roots).toContain(root2);
        });
    });

    describe('isTrustedRoot', () => {
        it('should return true for trusted root', async () => {
            const root = 'a'.repeat(64);
            rootManager.addTrustedRoot({
                credentialSetId: 'set-1',
                merkleRoot: root,
                addedAt: new Date(),
            });

            expect(await rootManager.isTrustedRoot('set-1', root)).toBe(true);
        });

        it('should return false for unknown root', async () => {
            expect(await rootManager.isTrustedRoot('set-1', 'b'.repeat(64))).toBe(false);
        });

        it('should return false for unknown set', async () => {
            expect(await rootManager.isTrustedRoot('unknown', 'a'.repeat(64))).toBe(false);
        });

        it('should return false for expired root', async () => {
            const root = 'a'.repeat(64);
            rootManager.addTrustedRoot({
                credentialSetId: 'set-1',
                merkleRoot: root,
                addedAt: new Date(),
                expiresAt: new Date(Date.now() - 1000), // expired
            });

            expect(await rootManager.isTrustedRoot('set-1', root)).toBe(false);
        });

        it('should return true for non-expired root', async () => {
            const root = 'a'.repeat(64);
            rootManager.addTrustedRoot({
                credentialSetId: 'set-1',
                merkleRoot: root,
                addedAt: new Date(),
                expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
            });

            expect(await rootManager.isTrustedRoot('set-1', root)).toBe(true);
        });
    });

    describe('revokeTrustedRoot', () => {
        it('should revoke an existing root', async () => {
            const root = 'a'.repeat(64);
            rootManager.addTrustedRoot({
                credentialSetId: 'set-1',
                merkleRoot: root,
                addedAt: new Date(),
            });

            expect(rootManager.revokeTrustedRoot('set-1', root)).toBe(true);
            expect(await rootManager.isTrustedRoot('set-1', root)).toBe(false);
        });

        it('should return false revoking unknown root', () => {
            expect(rootManager.revokeTrustedRoot('set-1', 'a'.repeat(64))).toBe(false);
        });

        it('should return false revoking from unknown set', () => {
            expect(rootManager.revokeTrustedRoot('unknown', 'a'.repeat(64))).toBe(false);
        });
    });

    describe('getTrustedRoots', () => {
        it('should return empty array for unknown set', () => {
            expect(rootManager.getTrustedRoots('unknown')).toEqual([]);
        });
    });

    describe('getTotalRootCount', () => {
        it('should return 0 initially', () => {
            expect(rootManager.getTotalRootCount()).toBe(0);
        });

        it('should track total across sets', () => {
            rootManager.addTrustedRoot({
                credentialSetId: 'set-1',
                merkleRoot: 'a'.repeat(64),
                addedAt: new Date(),
            });
            rootManager.addTrustedRoot({
                credentialSetId: 'set-2',
                merkleRoot: 'b'.repeat(64),
                addedAt: new Date(),
            });
            expect(rootManager.getTotalRootCount()).toBe(2);
        });
    });
});

describe('ProofValidator', () => {
    let validator: ProofValidator;

    beforeEach(() => {
        validator = new ProofValidator(logger);
    });

    describe('preValidate', () => {
        const validProof = {
            proof: { pi_a: [], pi_b: [], pi_c: [], protocol: 'groth16', curve: 'bn128' },
            publicSignals: ['signal'],
            metadata: {
                proofId: 'id',
                credentialSetId: 'set-id',
                merkleRoot: 'a'.repeat(64),
                timestamp: new Date(Date.now() - 1000),
                expiresAt: new Date(Date.now() + 86400000),
                version: '1.0.0',
                circuitId: 'credential-v1.0.0',
            },
        };

        it('should pass for valid proof', () => {
            const errors = validator.preValidate(validProof as any);
            expect(errors).toEqual([]);
        });

        it('should catch missing public signals', () => {
            const proof = { ...validProof, publicSignals: [] };
            const errors = validator.preValidate(proof as any);
            expect(errors).toContain('Missing public signals');
        });

        it('should catch missing proof data', () => {
            const proof = { ...validProof, proof: null };
            const errors = validator.preValidate(proof as any);
            expect(errors).toContain('Missing proof data');
        });

        it('should catch missing metadata fields', () => {
            const proof = {
                ...validProof,
                metadata: { ...validProof.metadata, proofId: '' },
            };
            const errors = validator.preValidate(proof as any);
            expect(errors).toContain('Missing proof ID');
        });

        it('should catch future timestamp', () => {
            const proof = {
                ...validProof,
                metadata: {
                    ...validProof.metadata,
                    timestamp: new Date(Date.now() + 100000),
                },
            };
            const errors = validator.preValidate(proof as any);
            expect(errors).toContain('Proof timestamp is in the future');
        });

        it('should catch invalid expiration', () => {
            const now = new Date();
            const proof = {
                ...validProof,
                metadata: {
                    ...validProof.metadata,
                    timestamp: now,
                    expiresAt: new Date(now.getTime() - 1000),
                },
            };
            const errors = validator.preValidate(proof as any);
            expect(errors).toContain('Proof expiration must be after timestamp');
        });
    });

    describe('validateAndDeserialize', () => {
        it('should throw for invalid input', () => {
            expect(() => validator.validateAndDeserialize(null)).toThrow('Invalid proof format');
        });

        it('should throw for malformed input', () => {
            expect(() => validator.validateAndDeserialize({ proof: 123 })).toThrow('Invalid proof format');
        });
    });
});
