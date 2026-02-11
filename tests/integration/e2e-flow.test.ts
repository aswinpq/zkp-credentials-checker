import { SecureMerkleTree } from '../../src/core/merkle/MerkleTree';
import { CredentialSetManager } from '../../src/core/merkle/CredentialSet';
import { RootManager } from '../../src/core/verifier/RootManager';
import { Logger } from '../../src/utils/logger';
import { CredentialSetType } from '../../src/types/credential.types';

const logger = new Logger('test');

describe('End-to-End Credential Flow (Merkle-only)', () => {
    let credentialSetManager: CredentialSetManager;
    let rootManager: RootManager;

    beforeEach(() => {
        credentialSetManager = new CredentialSetManager(logger);
        rootManager = new RootManager(logger);
    });

    it('should complete full Merkle proof lifecycle', async () => {
        // Step 1: Create credential set
        const universities = ['MIT', 'Stanford', 'Harvard', 'Berkeley'];
        const credSet = credentialSetManager.createCredentialSet(
            'Top Universities',
            universities,
            'Leading universities',
            CredentialSetType.UNIVERSITIES,
        );

        expect(credSet).toBeDefined();
        expect(credSet.merkleRoot).toMatch(/^[a-f0-9]{64}$/);

        // Step 2: Register trusted root
        rootManager.addTrustedRoot({
            credentialSetId: credSet.id,
            merkleRoot: credSet.merkleRoot,
            addedAt: new Date(),
        });

        // Step 3: Generate proof for a credential
        const credential = 'MIT';
        const merkleProof = credentialSetManager.generateProof(credSet.id, credential);

        expect(merkleProof).toBeDefined();
        expect(merkleProof.root).toBe(credSet.merkleRoot);
        expect(merkleProof.leafIndex).toBe(0);

        // Step 4: Verify Merkle proof cryptographically
        const isValid = SecureMerkleTree.verify(merkleProof);
        expect(isValid).toBe(true);

        // Step 5: Verify root is trusted
        const isTrusted = await rootManager.isTrustedRoot(credSet.id, merkleProof.root);
        expect(isTrusted).toBe(true);

        // Step 6: Verify credential membership through manager
        const membershipValid = credentialSetManager.verifyCredential(credSet.id, merkleProof);
        expect(membershipValid).toBe(true);
    });

    it('should verify all credentials in a set', () => {
        const companies = ['Google', 'Apple', 'Microsoft', 'Amazon', 'Meta', 'Netflix'];
        const credSet = credentialSetManager.createCredentialSet(
            'Tech Companies',
            companies,
            'Top tech companies',
            CredentialSetType.COMPANIES,
        );

        companies.forEach((company) => {
            const proof = credentialSetManager.generateProof(credSet.id, company);
            expect(SecureMerkleTree.verify(proof)).toBe(true);
            expect(credentialSetManager.verifyCredential(credSet.id, proof)).toBe(true);
        });
    });

    it('should reject tampered proof', () => {
        const creds = ['A', 'B', 'C', 'D'];
        const credSet = credentialSetManager.createCredentialSet('Test', creds);

        const proof = credentialSetManager.generateProof(credSet.id, 'A');
        const tampered = { ...proof, root: 'f'.repeat(64) };

        expect(SecureMerkleTree.verify(tampered)).toBe(false);
        expect(credentialSetManager.verifyCredential(credSet.id, tampered)).toBe(false);
    });

    it('should reject proof for wrong credential set', () => {
        const set1 = credentialSetManager.createCredentialSet('Set1', ['A', 'B']);
        const set2 = credentialSetManager.createCredentialSet('Set2', ['C', 'D']);

        const proof = credentialSetManager.generateProof(set1.id, 'A');

        // Proof from set1 should fail verification against set2
        expect(credentialSetManager.verifyCredential(set2.id, proof)).toBe(false);
    });

    it('should handle root revocation', async () => {
        const credSet = credentialSetManager.createCredentialSet('Test', ['A', 'B', 'C']);

        rootManager.addTrustedRoot({
            credentialSetId: credSet.id,
            merkleRoot: credSet.merkleRoot,
            addedAt: new Date(),
        });

        // Initially trusted
        expect(await rootManager.isTrustedRoot(credSet.id, credSet.merkleRoot)).toBe(true);

        // Revoke
        rootManager.revokeTrustedRoot(credSet.id, credSet.merkleRoot);

        // No longer trusted
        expect(await rootManager.isTrustedRoot(credSet.id, credSet.merkleRoot)).toBe(false);
    });

    it('should handle root expiration', async () => {
        const credSet = credentialSetManager.createCredentialSet('Test', ['A', 'B']);

        // Add root that expires immediately
        rootManager.addTrustedRoot({
            credentialSetId: credSet.id,
            merkleRoot: credSet.merkleRoot,
            addedAt: new Date(),
            expiresAt: new Date(Date.now() - 1000), // already expired
        });

        expect(await rootManager.isTrustedRoot(credSet.id, credSet.merkleRoot)).toBe(false);
    });

    it('should manage multiple credential sets independently', () => {
        const uniSet = credentialSetManager.createCredentialSet(
            'Universities',
            ['MIT', 'Stanford'],
            '',
            CredentialSetType.UNIVERSITIES,
        );
        const compSet = credentialSetManager.createCredentialSet(
            'Companies',
            ['Google', 'Apple'],
            '',
            CredentialSetType.COMPANIES,
        );

        // Proofs from each set should only validate against their own set
        const uniProof = credentialSetManager.generateProof(uniSet.id, 'MIT');
        const compProof = credentialSetManager.generateProof(compSet.id, 'Google');

        expect(credentialSetManager.verifyCredential(uniSet.id, uniProof)).toBe(true);
        expect(credentialSetManager.verifyCredential(compSet.id, compProof)).toBe(true);

        // Cross-set verification should fail
        expect(credentialSetManager.verifyCredential(compSet.id, uniProof)).toBe(false);
        expect(credentialSetManager.verifyCredential(uniSet.id, compProof)).toBe(false);
    });
});
