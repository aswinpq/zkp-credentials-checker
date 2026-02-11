import { HashManager } from '../../src/core/crypto/HashManager';
import { RandomGenerator } from '../../src/core/crypto/RandomGenerator';
import { KeyManager } from '../../src/core/crypto/KeyManager';
import { Logger } from '../../src/utils/logger';
import * as testVectors from '../fixtures/test-vectors.json';

const logger = new Logger('test');

describe('HashManager', () => {
    let hashManager: HashManager;

    beforeEach(() => {
        hashManager = new HashManager(logger);
    });

    describe('sha256', () => {
        it('should produce correct SHA-256 hash', () => {
            testVectors.hashing.cases.forEach(({ input, sha256: expected }) => {
                const result = hashManager.sha256Hex(input);
                expect(result).toBe(expected);
            });
        });

        it('should return Buffer from sha256', () => {
            const result = hashManager.sha256('hello');
            expect(Buffer.isBuffer(result)).toBe(true);
            expect(result.length).toBe(32);
        });

        it('should hash Buffer input', () => {
            const buf = Buffer.from('hello');
            const result = hashManager.sha256Buffer(buf);
            expect(result.length).toBe(32);
        });
    });

    describe('doubleSha256', () => {
        it('should produce different hash from single SHA-256', () => {
            const single = hashManager.sha256('hello');
            const double = hashManager.doubleSha256('hello');
            expect(single.equals(double)).toBe(false);
        });

        it('should be deterministic', () => {
            const a = hashManager.doubleSha256('test');
            const b = hashManager.doubleSha256('test');
            expect(a.equals(b)).toBe(true);
        });
    });

    describe('hmacSha256', () => {
        it('should produce HMAC with given key', () => {
            const key = Buffer.from('secret-key');
            const result = hashManager.hmacSha256('data', key);
            expect(Buffer.isBuffer(result)).toBe(true);
            expect(result.length).toBe(32);
        });

        it('should produce different HMACs for different keys', () => {
            const key1 = Buffer.from('key1');
            const key2 = Buffer.from('key2');
            const r1 = hashManager.hmacSha256('data', key1);
            const r2 = hashManager.hmacSha256('data', key2);
            expect(r1.equals(r2)).toBe(false);
        });
    });

    describe('constantTimeEqual', () => {
        it('should return true for equal hex strings', () => {
            const hex = 'a'.repeat(64);
            expect(hashManager.constantTimeEqual(hex, hex)).toBe(true);
        });

        it('should return false for different hex strings', () => {
            const a = 'a'.repeat(64);
            const b = 'b'.repeat(64);
            expect(hashManager.constantTimeEqual(a, b)).toBe(false);
        });

        it('should return false for different lengths', () => {
            expect(hashManager.constantTimeEqual('aabb', 'aabbcc')).toBe(false);
        });
    });

    describe('constantTimeEqualBuffers', () => {
        it('should return true for equal buffers', () => {
            const buf = Buffer.from('hello');
            expect(hashManager.constantTimeEqualBuffers(buf, Buffer.from('hello'))).toBe(true);
        });

        it('should return false for different buffers', () => {
            const a = Buffer.from('hello');
            const b = Buffer.from('world');
            expect(hashManager.constantTimeEqualBuffers(a, b)).toBe(false);
        });

        it('should return false for different-length buffers', () => {
            const a = Buffer.from('hi');
            const b = Buffer.from('hello');
            expect(hashManager.constantTimeEqualBuffers(a, b)).toBe(false);
        });
    });

    describe('Domain-separated hashing', () => {
        it('should produce different hashes for leaf vs node', () => {
            const data = 'test-data';
            const leafHash = hashManager.hashLeaf(data);
            const buf = Buffer.from(data);
            const nodeHash = hashManager.hashNodes(buf, buf);
            expect(leafHash.equals(nodeHash)).toBe(false);
        });
    });
});

describe('RandomGenerator', () => {
    let rng: RandomGenerator;

    beforeEach(() => {
        rng = new RandomGenerator(logger);
    });

    describe('generateBytes', () => {
        it('should generate requested number of bytes', () => {
            const result = rng.generateBytes(32);
            expect(Buffer.isBuffer(result)).toBe(true);
            expect(result.length).toBe(32);
        });

        it('should generate different bytes each time', () => {
            const a = rng.generateBytes(32);
            const b = rng.generateBytes(32);
            expect(a.equals(b)).toBe(false);
        });

        it('should throw on invalid length', () => {
            expect(() => rng.generateBytes(0)).toThrow();
            expect(() => rng.generateBytes(-1)).toThrow();
            expect(() => rng.generateBytes(1025)).toThrow();
        });
    });

    describe('generateHex', () => {
        it('should generate hex string of correct length', () => {
            const hex = rng.generateHex(32);
            expect(hex).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should use default 32-byte length', () => {
            const hex = rng.generateHex();
            expect(hex.length).toBe(64);
        });
    });

    describe('generateInt', () => {
        it('should generate integer in valid range', () => {
            for (let i = 0; i < 100; i++) {
                const val = rng.generateInt(0, 10);
                expect(val).toBeGreaterThanOrEqual(0);
                expect(val).toBeLessThan(10);
            }
        });

        it('should throw if min >= max', () => {
            expect(() => rng.generateInt(5, 5)).toThrow();
            expect(() => rng.generateInt(10, 5)).toThrow();
        });
    });

    describe('generateNonce', () => {
        it('should generate 32-byte nonce', () => {
            const nonce = rng.generateNonce();
            expect(nonce.length).toBe(32);
        });
    });

    describe('generateSalt', () => {
        it('should generate 16-byte salt', () => {
            const salt = rng.generateSalt();
            expect(salt.length).toBe(16);
        });
    });

    describe('generateNullifierSecret', () => {
        it('should generate 32-byte secret', () => {
            const secret = rng.generateNullifierSecret();
            expect(secret.length).toBe(32);
        });
    });
});

describe('KeyManager', () => {
    let keyManager: KeyManager;

    beforeEach(() => {
        keyManager = new KeyManager(logger);
    });

    afterEach(() => {
        keyManager.destroy();
    });

    describe('initialization', () => {
        it('should initialize with ephemeral key', () => {
            keyManager.initialize();
            expect(keyManager.isInitialized()).toBe(true);
        });

        it('should initialize with provided hex key', () => {
            const key = 'a'.repeat(64);
            keyManager.initialize(key);
            expect(keyManager.isInitialized()).toBe(true);
        });

        it('should reject invalid hex key', () => {
            expect(() => keyManager.initialize('not-valid')).toThrow();
        });
    });

    describe('deriveKey', () => {
        it('should derive deterministic keys for same purpose', () => {
            keyManager.initialize('a'.repeat(64));
            const k1 = keyManager.deriveKey('test');
            const k2 = keyManager.deriveKey('test');
            expect(k1.equals(k2)).toBe(true);
        });

        it('should derive different keys for different purposes', () => {
            keyManager.initialize('a'.repeat(64));
            const k1 = keyManager.deriveKey('purpose1');
            const k2 = keyManager.deriveKey('purpose2');
            expect(k1.equals(k2)).toBe(false);
        });

        it('should throw if not initialized', () => {
            expect(() => keyManager.deriveKey('test')).toThrow('not initialized');
        });
    });

    describe('generateNullifier', () => {
        it('should generate deterministic nullifier', () => {
            keyManager.initialize('a'.repeat(64));
            const secret = Buffer.from('secret');
            const n1 = keyManager.generateNullifier('cred', secret);
            const n2 = keyManager.generateNullifier('cred', secret);
            expect(n1).toBe(n2);
        });

        it('should generate different nullifiers for different credentials', () => {
            keyManager.initialize('a'.repeat(64));
            const secret = Buffer.from('secret');
            const n1 = keyManager.generateNullifier('cred1', secret);
            const n2 = keyManager.generateNullifier('cred2', secret);
            expect(n1).not.toBe(n2);
        });
    });

    describe('generateCommitment', () => {
        it('should generate hex commitment', () => {
            keyManager.initialize('a'.repeat(64));
            const blinding = Buffer.from('blinding');
            const commitment = keyManager.generateCommitment('value', blinding);
            expect(commitment).toMatch(/^[a-f0-9]{64}$/);
        });
    });

    describe('destroy', () => {
        it('should mark as uninitialized after destroy', () => {
            keyManager.initialize();
            keyManager.destroy();
            expect(keyManager.isInitialized()).toBe(false);
        });

        it('should be safe to call destroy multiple times', () => {
            keyManager.initialize();
            keyManager.destroy();
            keyManager.destroy();
            expect(keyManager.isInitialized()).toBe(false);
        });
    });
});
