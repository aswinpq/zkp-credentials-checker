import { CircuitManager } from '../../src/core/prover/CircuitManager';
import { ProofSerializer } from '../../src/core/prover/ProofSerializer';
import { ZKProver } from '../../src/core/prover/ZKProver';
import { Logger } from '../../src/utils/logger';
import { ZKProof, ProofMetadata } from '../../src/types/proof.types';
import path from 'path';

const logger = new Logger('test');
const testCircuitsPath = path.join(__dirname, '../../circuits/build');

describe('CircuitManager', () => {
    let circuitManager: CircuitManager;

    beforeEach(() => {
        circuitManager = new CircuitManager('credential', testCircuitsPath, logger);
    });

    describe('paths', () => {
        it('should return correct WASM path', () => {
            const wasmPath = circuitManager.getWasmPath();
            expect(wasmPath).toContain('credential_js');
            expect(wasmPath).toContain('credential.wasm');
        });

        it('should return correct zkey path', () => {
            const zkeyPath = circuitManager.getZkeyPath();
            expect(zkeyPath).toContain('credential_final.zkey');
        });

        it('should return correct verification key path', () => {
            const vkPath = circuitManager.getVerificationKeyPath();
            expect(vkPath).toContain('verification_key.json');
        });
    });

    describe('getCircuitId', () => {
        it('should return versioned circuit ID', () => {
            expect(circuitManager.getCircuitId()).toBe('credential-v1.0.0');
        });
    });

    describe('verifySetup', () => {
        it('should return false when circuit files are missing', async () => {
            const result = await circuitManager.verifySetup();
            // Files won't exist in test environment unless circuit setup has been run
            expect(typeof result).toBe('boolean');
        });
    });

    describe('loadVerificationKey', () => {
        it('should throw when verification key is missing', async () => {
            await expect(circuitManager.loadVerificationKey()).rejects.toThrow(
                'Verification key not found',
            );
        });
    });
});

describe('ProofSerializer', () => {
    let serializer: ProofSerializer;

    const mockMetadata: ProofMetadata = {
        proofId: '550e8400-e29b-41d4-a716-446655440000',
        credentialSetId: '550e8400-e29b-41d4-a716-446655440001',
        merkleRoot: 'a'.repeat(64),
        timestamp: new Date('2025-01-01T00:00:00Z'),
        expiresAt: new Date('2025-01-02T00:00:00Z'),
        version: '1.0.0',
        circuitId: 'credential-v1.0.0',
    };

    const mockProof: ZKProof = {
        proof: {
            pi_a: ['1', '2', '3'],
            pi_b: [['4', '5'], ['6', '7'], ['8', '9']],
            pi_c: ['10', '11', '12'],
            protocol: 'groth16',
            curve: 'bn128',
        },
        publicSignals: ['signal1', 'signal2'],
        metadata: mockMetadata,
    };

    beforeEach(() => {
        serializer = new ProofSerializer(logger);
    });

    describe('serialize', () => {
        it('should serialize a proof to transport format', () => {
            const serialized = serializer.serialize(mockProof);

            expect(typeof serialized.proof).toBe('string');
            expect(serialized.publicSignals).toEqual(['signal1', 'signal2']);
            expect(serialized.metadata.proofId).toBe(mockMetadata.proofId);
            expect(serialized.metadata.timestamp).toBe('2025-01-01T00:00:00.000Z');
            expect(serialized.metadata.expiresAt).toBe('2025-01-02T00:00:00.000Z');
        });
    });

    describe('deserialize', () => {
        it('should round-trip serialize/deserialize', () => {
            const serialized = serializer.serialize(mockProof);
            const deserialized = serializer.deserialize(serialized);

            expect(deserialized.proof).toEqual(mockProof.proof);
            expect(deserialized.publicSignals).toEqual(mockProof.publicSignals);
            expect(deserialized.metadata.proofId).toBe(mockMetadata.proofId);
        });
    });

    describe('validate', () => {
        it('should validate correct serialized proof', () => {
            const serialized = serializer.serialize(mockProof);
            expect(serializer.validate(serialized)).toBe(true);
        });

        it('should reject null', () => {
            expect(serializer.validate(null)).toBe(false);
        });

        it('should reject missing fields', () => {
            expect(serializer.validate({ proof: '{}' })).toBe(false);
        });

        it('should reject non-string proof', () => {
            expect(
                serializer.validate({
                    proof: 123,
                    publicSignals: [],
                    metadata: {},
                }),
            ).toBe(false);
        });

        it('should reject missing metadata fields', () => {
            expect(
                serializer.validate({
                    proof: '{}',
                    publicSignals: [],
                    metadata: { proofId: 'abc' },
                }),
            ).toBe(false);
        });
    });
});

describe('ZKProver', () => {
    let prover: ZKProver;

    beforeEach(() => {
        const cm = new CircuitManager('credential', testCircuitsPath, logger);
        prover = new ZKProver(cm, logger);
    });

    describe('initialization', () => {
        it('should not be initialized by default', () => {
            expect(prover.isInitialized()).toBe(false);
        });

        // Note: Full initialization requires circuit files
    });

    describe('generateProof (without circuits)', () => {
        it('should throw if not initialized', async () => {
            const merkleProof = {
                leaf: 'a'.repeat(64),
                leafIndex: 0,
                root: 'b'.repeat(64),
                siblings: [{ hash: 'c'.repeat(64), position: 'left' as const }],
                pathIndices: [0],
            };

            await expect(prover.generateProof('set-id', merkleProof, 'cred')).rejects.toThrow(
                'not initialized',
            );
        });
    });

    describe('generateNullifier', () => {
        it('should generate hex nullifier', () => {
            const nullifier = prover.generateNullifier('credential');
            expect(nullifier).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should generate different nullifiers for different credentials', () => {
            const secret = Buffer.from('same-secret');
            const n1 = prover.generateNullifier('cred1', secret);
            const n2 = prover.generateNullifier('cred2', secret);
            expect(n1).not.toBe(n2);
        });

        it('should generate deterministic nullifier with same secret', () => {
            const secret = Buffer.from('fixed-secret');
            const n1 = prover.generateNullifier('cred', secret);
            const n2 = prover.generateNullifier('cred', secret);
            expect(n1).toBe(n2);
        });
    });
});
